-- Atomic CP Splash product + variant + price persistence.
-- Reconciles the frontend productsService.ts RPC contract:
-- cms_save_product(p_product_id, p_product, p_variant, p_price).
-- Security: SECURITY INVOKER; authenticated owner/admin/manager only.
-- Tenant is fixed to the CP Splash tenant; table RLS and tenant consistency
-- triggers remain in force. Price changes preserve history by deactivating
-- the previous active row and inserting a new active price row.

CREATE OR REPLACE FUNCTION public.cms_save_product(
  p_product_id uuid,
  p_product jsonb,
  p_variant jsonb,
  p_price jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_tenant_id CONSTANT uuid := '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid;
  v_actor_id uuid;
  v_product_id uuid;
  v_variant_id uuid;
  v_price_list_id uuid;
  v_current_price_id uuid;
  v_current_amount numeric(14,2);
  v_compare_at_amount numeric(14,2);
  v_amount numeric(14,2);
BEGIN
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to save CP Splash products'
      USING ERRCODE = '42501';
  END IF;

  IF NOT private.has_tenant_role(
    v_tenant_id,
    ARRAY['owner','admin','manager']::text[]
  ) THEN
    RAISE EXCEPTION 'Not authorized to save CP Splash products and prices'
      USING ERRCODE = '42501';
  END IF;

  IF p_product IS NULL OR jsonb_typeof(p_product) <> 'object'
     OR p_variant IS NULL OR jsonb_typeof(p_variant) <> 'object'
     OR p_price IS NULL OR jsonb_typeof(p_price) <> 'object' THEN
    RAISE EXCEPTION 'Product, variant, and price payloads must be JSON objects'
      USING ERRCODE = '22023';
  END IF;

  IF p_product_id IS NULL THEN
    IF nullif(btrim(p_product->>'name'), '') IS NULL
       OR nullif(btrim(p_product->>'slug'), '') IS NULL THEN
      RAISE EXCEPTION 'Product name and slug are required'
        USING ERRCODE = '22023';
    END IF;

    IF nullif(p_variant->>'name', '') IS NULL THEN
      RAISE EXCEPTION 'Variant name is required'
        USING ERRCODE = '22023';
    END IF;

    IF NOT (p_price ? 'amount') OR nullif(p_price->>'amount', '') IS NULL THEN
      RAISE EXCEPTION 'Initial product price is required'
        USING ERRCODE = '22023';
    END IF;

    v_amount := (p_price->>'amount')::numeric(14,2);
    IF v_amount <= 0 THEN
      RAISE EXCEPTION 'Product price must be greater than zero'
        USING ERRCODE = '22023';
    END IF;

    v_compare_at_amount := nullif(p_price->>'compare_at_amount', '')::numeric(14,2);
    IF v_compare_at_amount IS NOT NULL AND v_compare_at_amount < v_amount THEN
      RAISE EXCEPTION 'Compare-at price must be greater than or equal to active price'
        USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.products (
      tenant_id, category_id, name, slug, sku, brand, product_type,
      short_description, description, status, featured, seo_title,
      seo_description, metadata, created_by
    )
    VALUES (
      v_tenant_id,
      nullif(p_product->>'category_id', '')::uuid,
      btrim(p_product->>'name'),
      lower(regexp_replace(btrim(p_product->>'slug'), '[^a-zA-Z0-9]+', '-', 'g')),
      nullif(btrim(p_product->>'sku'), ''),
      nullif(btrim(p_product->>'brand'), ''),
      coalesce(nullif(p_product->>'product_type', ''), 'physical'),
      nullif(p_product->>'short_description', ''),
      nullif(p_product->>'description', ''),
      coalesce(nullif(p_product->>'status', ''), 'draft'),
      coalesce((p_product->>'featured')::boolean, false),
      nullif(p_product->>'seo_title', ''),
      nullif(p_product->>'seo_description', ''),
      coalesce(p_product->'metadata', '{}'::jsonb),
      v_actor_id
    )
    RETURNING id INTO v_product_id;

    INSERT INTO public.product_variants (
      tenant_id, product_id, name, sku, barcode, volume, volume_unit,
      weight, weight_unit, status, metadata
    )
    VALUES (
      v_tenant_id,
      v_product_id,
      btrim(p_variant->>'name'),
      nullif(btrim(p_variant->>'sku'), ''),
      nullif(btrim(p_variant->>'barcode'), ''),
      nullif(p_variant->>'volume', '')::numeric,
      nullif(p_variant->>'volume_unit', ''),
      nullif(p_variant->>'weight', '')::numeric,
      nullif(p_variant->>'weight_unit', ''),
      coalesce(nullif(p_variant->>'status', ''), 'active'),
      coalesce(p_variant->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_variant_id;

    SELECT pl.id
      INTO v_price_list_id
    FROM public.price_lists pl
    WHERE pl.tenant_id = v_tenant_id
      AND pl.price_type = 'retail'
      AND pl.status = 'active'
    ORDER BY CASE WHEN pl.name = 'Standard Retail Price List' THEN 0 ELSE 1 END,
             pl.created_at ASC
    LIMIT 1;

    IF v_price_list_id IS NULL THEN
      INSERT INTO public.price_lists (tenant_id, name, currency, price_type, status)
      VALUES (v_tenant_id, 'Default Retail', 'NGN', 'retail', 'active')
      ON CONFLICT (tenant_id, name)
      DO UPDATE SET status = 'active', price_type = 'retail'
      RETURNING id INTO v_price_list_id;
    END IF;

    INSERT INTO public.product_prices (
      tenant_id, price_list_id, variant_id, amount, compare_at_amount,
      status, change_reason, created_by
    )
    VALUES (
      v_tenant_id, v_price_list_id, v_variant_id, v_amount,
      v_compare_at_amount, 'active',
      coalesce(nullif(p_price->>'change_reason', ''), 'Initial creation via CMS'),
      v_actor_id
    );

  ELSE
    v_product_id := p_product_id;

    PERFORM 1
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found in the CP Splash tenant'
        USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.products p
    SET
      category_id = CASE WHEN p_product ? 'category_id'
        THEN nullif(p_product->>'category_id', '')::uuid ELSE p.category_id END,
      name = CASE WHEN p_product ? 'name' THEN btrim(p_product->>'name') ELSE p.name END,
      slug = CASE WHEN p_product ? 'slug'
        THEN lower(regexp_replace(btrim(p_product->>'slug'), '[^a-zA-Z0-9]+', '-', 'g')) ELSE p.slug END,
      sku = CASE WHEN p_product ? 'sku' THEN nullif(btrim(p_product->>'sku'), '') ELSE p.sku END,
      brand = CASE WHEN p_product ? 'brand' THEN nullif(btrim(p_product->>'brand'), '') ELSE p.brand END,
      short_description = CASE WHEN p_product ? 'short_description'
        THEN nullif(p_product->>'short_description', '') ELSE p.short_description END,
      description = CASE WHEN p_product ? 'description'
        THEN nullif(p_product->>'description', '') ELSE p.description END,
      status = CASE WHEN p_product ? 'status' THEN p_product->>'status' ELSE p.status END,
      featured = CASE WHEN p_product ? 'featured'
        THEN (p_product->>'featured')::boolean ELSE p.featured END,
      seo_title = CASE WHEN p_product ? 'seo_title'
        THEN nullif(p_product->>'seo_title', '') ELSE p.seo_title END,
      seo_description = CASE WHEN p_product ? 'seo_description'
        THEN nullif(p_product->>'seo_description', '') ELSE p.seo_description END,
      metadata = CASE WHEN p_product ? 'metadata'
        THEN p_product->'metadata' ELSE p.metadata END,
      updated_at = now()
    WHERE p.id = v_product_id
      AND p.tenant_id = v_tenant_id;

    SELECT v.id
      INTO v_variant_id
    FROM public.product_variants v
    WHERE v.product_id = v_product_id
      AND v.tenant_id = v_tenant_id
      AND v.status = 'active'
    ORDER BY v.created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_variant_id IS NULL AND p_variant <> '{}'::jsonb THEN
      RAISE EXCEPTION 'No active product variant exists to update'
        USING ERRCODE = 'P0002';
    END IF;

    IF v_variant_id IS NOT NULL AND p_variant <> '{}'::jsonb THEN
      UPDATE public.product_variants v
      SET
        name = CASE WHEN p_variant ? 'name' THEN btrim(p_variant->>'name') ELSE v.name END,
        sku = CASE WHEN p_variant ? 'sku' THEN nullif(btrim(p_variant->>'sku'), '') ELSE v.sku END,
        barcode = CASE WHEN p_variant ? 'barcode' THEN nullif(btrim(p_variant->>'barcode'), '') ELSE v.barcode END,
        volume = CASE WHEN p_variant ? 'volume' THEN nullif(p_variant->>'volume', '')::numeric ELSE v.volume END,
        volume_unit = CASE WHEN p_variant ? 'volume_unit' THEN nullif(p_variant->>'volume_unit', '') ELSE v.volume_unit END,
        weight = CASE WHEN p_variant ? 'weight' THEN nullif(p_variant->>'weight', '')::numeric ELSE v.weight END,
        weight_unit = CASE WHEN p_variant ? 'weight_unit' THEN nullif(p_variant->>'weight_unit', '') ELSE v.weight_unit END,
        metadata = CASE WHEN p_variant ? 'metadata' THEN p_variant->'metadata' ELSE v.metadata END,
        updated_at = now()
      WHERE v.id = v_variant_id
        AND v.tenant_id = v_tenant_id;
    END IF;

    IF p_price <> '{}'::jsonb THEN
      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'No active product variant exists for price update'
          USING ERRCODE = 'P0002';
      END IF;

      SELECT pp.id, pp.amount, pp.compare_at_amount, pp.price_list_id
        INTO v_current_price_id, v_current_amount, v_compare_at_amount, v_price_list_id
      FROM public.product_prices pp
      WHERE pp.variant_id = v_variant_id
        AND pp.tenant_id = v_tenant_id
        AND pp.status = 'active'
      ORDER BY pp.created_at DESC
      LIMIT 1
      FOR UPDATE;

      IF p_price ? 'amount' THEN
        v_amount := (p_price->>'amount')::numeric(14,2);
      ELSE
        v_amount := v_current_amount;
      END IF;

      IF p_price ? 'compare_at_amount' THEN
        v_compare_at_amount := nullif(p_price->>'compare_at_amount', '')::numeric(14,2);
      END IF;

      IF v_amount IS NULL OR v_amount <= 0 THEN
        RAISE EXCEPTION 'A positive active price is required'
          USING ERRCODE = '22023';
      END IF;

      IF v_compare_at_amount IS NOT NULL AND v_compare_at_amount < v_amount THEN
        RAISE EXCEPTION 'Compare-at price must be greater than or equal to active price'
          USING ERRCODE = '22023';
      END IF;

      IF v_price_list_id IS NULL THEN
        SELECT pl.id
          INTO v_price_list_id
        FROM public.price_lists pl
        WHERE pl.tenant_id = v_tenant_id
          AND pl.price_type = 'retail'
          AND pl.status = 'active'
        ORDER BY CASE WHEN pl.name = 'Standard Retail Price List' THEN 0 ELSE 1 END,
                 pl.created_at ASC
        LIMIT 1;

        IF v_price_list_id IS NULL THEN
          INSERT INTO public.price_lists (tenant_id, name, currency, price_type, status)
          VALUES (v_tenant_id, 'Default Retail', 'NGN', 'retail', 'active')
          ON CONFLICT (tenant_id, name)
          DO UPDATE SET status = 'active', price_type = 'retail'
          RETURNING id INTO v_price_list_id;
        END IF;
      END IF;

      IF v_current_price_id IS NOT NULL THEN
        UPDATE public.product_prices
        SET status = 'inactive'
        WHERE id = v_current_price_id
          AND tenant_id = v_tenant_id
          AND status = 'active';
      END IF;

      INSERT INTO public.product_prices (
        tenant_id, price_list_id, variant_id, amount, compare_at_amount,
        status, change_reason, created_by
      )
      VALUES (
        v_tenant_id, v_price_list_id, v_variant_id, v_amount,
        v_compare_at_amount, 'active',
        coalesce(nullif(p_price->>'change_reason', ''), 'Product update via CMS'),
        v_actor_id
      );
    END IF;
  END IF;

  RETURN v_product_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cms_save_product(uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cms_save_product(uuid, jsonb, jsonb, jsonb)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
