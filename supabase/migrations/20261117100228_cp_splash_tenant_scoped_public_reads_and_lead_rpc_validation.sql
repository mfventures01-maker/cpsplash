
-- CP Splash public storefront isolation and lead RPC hardening.
-- Public storefront reads are intentionally limited to the CP Fruit Splash tenant.
-- Staff access remains governed by existing tenant-membership policies.

-- Tenants: do not expose other active tenants through the CP Splash public API.
DROP POLICY IF EXISTS tenant_public_select ON public.tenants;
CREATE POLICY tenant_public_select
ON public.tenants
FOR SELECT
TO anon, authenticated
USING (
  id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND status = 'active'
);

-- Products and categories.
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
ON public.products
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = products.tenant_id AND t.status = 'active'
  )
);

DROP POLICY IF EXISTS categories_public_select ON public.product_categories;
CREATE POLICY categories_public_select
ON public.product_categories
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = product_categories.tenant_id AND t.status = 'active'
  )
);

DROP POLICY IF EXISTS variants_public_select ON public.product_variants;
CREATE POLICY variants_public_select
ON public.product_variants
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variants.product_id
      AND p.tenant_id = product_variants.tenant_id
      AND p.status = 'published'
  )
);

-- Product media must belong to the same CP tenant and reference an active public asset.
DROP POLICY IF EXISTS product_media_public_select ON public.product_media;
CREATE POLICY product_media_public_select
ON public.product_media
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.media_assets ma ON ma.id = product_media.media_id
    WHERE p.id = product_media.product_id
      AND p.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
      AND p.status = 'published'
      AND ma.tenant_id = p.tenant_id
      AND ma.bucket = 'cp-public'
      AND ma.status = 'active'
  )
);

-- Media metadata must be owned by CP Fruit Splash to be public through this storefront.
DROP POLICY IF EXISTS media_public_select ON public.media_assets;
CREATE POLICY media_public_select
ON public.media_assets
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND bucket = 'cp-public'
  AND status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = media_assets.tenant_id AND t.status = 'active'
  )
);

-- Active placements must reference active media owned by the same CP tenant.
DROP POLICY IF EXISTS "Public read access for active media placements" ON public.media_placements;
CREATE POLICY "Public read access for active media placements"
ON public.media_placements
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND active = true
  AND EXISTS (
    SELECT 1 FROM public.media_assets ma
    WHERE ma.id = media_placements.media_id
      AND ma.tenant_id = media_placements.tenant_id
      AND ma.bucket = 'cp-public'
      AND ma.status = 'active'
  )
);

-- Price lists and prices must stay inside the CP tenant and match their parent records.
DROP POLICY IF EXISTS price_lists_public_select ON public.price_lists;
CREATE POLICY price_lists_public_select
ON public.price_lists
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = price_lists.tenant_id AND t.status = 'active'
  )
);

DROP POLICY IF EXISTS prices_public_select ON public.product_prices;
CREATE POLICY prices_public_select
ON public.product_prices
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND status = 'active'
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_to IS NULL OR valid_to > now())
  AND EXISTS (
    SELECT 1
    FROM public.price_lists pl
    JOIN public.product_variants v ON v.id = product_prices.variant_id
    JOIN public.products p ON p.id = v.product_id
    WHERE pl.id = product_prices.price_list_id
      AND pl.tenant_id = product_prices.tenant_id
      AND pl.status = 'active'
      AND v.tenant_id = product_prices.tenant_id
      AND v.status = 'active'
      AND p.tenant_id = product_prices.tenant_id
      AND p.status = 'published'
  )
);

-- Sales content remains CP-only and enforces parent/child tenant consistency on public reads.
DROP POLICY IF EXISTS sales_territories_public_select ON public.sales_territories;
CREATE POLICY sales_territories_public_select
ON public.sales_territories
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND active = true
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = sales_territories.tenant_id AND t.status = 'active'
  )
);

DROP POLICY IF EXISTS sales_journeys_public_select ON public.sales_journeys;
CREATE POLICY sales_journeys_public_select
ON public.sales_journeys
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND active = true
  AND EXISTS (
    SELECT 1 FROM public.sales_territories st
    WHERE st.id = sales_journeys.territory_id
      AND st.tenant_id = sales_journeys.tenant_id
      AND st.active = true
  )
);

DROP POLICY IF EXISTS sales_offers_public_select ON public.sales_offers;
CREATE POLICY sales_offers_public_select
ON public.sales_offers
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND active = true
  AND EXISTS (
    SELECT 1 FROM public.sales_territories st
    WHERE st.id = sales_offers.territory_id
      AND st.tenant_id = sales_offers.tenant_id
      AND st.active = true
  )
);

DROP POLICY IF EXISTS sales_questions_public_select ON public.sales_questions;
CREATE POLICY sales_questions_public_select
ON public.sales_questions
FOR SELECT
TO anon, authenticated
USING (
  tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
  AND active = true
  AND EXISTS (
    SELECT 1
    FROM public.sales_journeys sj
    JOIN public.sales_territories st ON st.id = sj.territory_id
    WHERE sj.id = sales_questions.journey_id
      AND sj.tenant_id = sales_questions.tenant_id
      AND sj.active = true
      AND st.tenant_id = sales_questions.tenant_id
      AND st.active = true
  )
);

-- Anonymous lead creation must go through the validated RPC, not direct table INSERT.
REVOKE INSERT ON TABLE public.sales_leads FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.media_placements FROM anon;

-- Validate all caller-supplied relationships before the SECURITY DEFINER insert.
CREATE OR REPLACE FUNCTION public.create_sales_lead(
  p_territory_id uuid,
  p_journey_id uuid,
  p_offer_id uuid DEFAULT NULL::uuid,
  p_answers jsonb DEFAULT '{}'::jsonb,
  p_source text DEFAULT 'website'::text,
  p_medium text DEFAULT NULL::text,
  p_campaign text DEFAULT NULL::text,
  p_content text DEFAULT NULL::text
)
RETURNS public.sales_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_lead public.sales_leads;
  v_territory public.sales_territories;
  v_journey public.sales_journeys;
  v_offer public.sales_offers;
BEGIN
  IF p_answers IS NULL OR pg_catalog.jsonb_typeof(p_answers) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'Lead answers must be a JSON object';
  END IF;

  SELECT st.* INTO v_territory
  FROM public.sales_territories st
  JOIN public.tenants t ON t.id = st.tenant_id
  WHERE st.id = p_territory_id
    AND st.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
    AND st.active = true
    AND t.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'Invalid or inactive CP Splash sales territory';
  END IF;

  SELECT sj.* INTO v_journey
  FROM public.sales_journeys sj
  WHERE sj.id = p_journey_id
    AND sj.tenant_id = v_territory.tenant_id
    AND sj.territory_id = v_territory.id
    AND sj.active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'Journey does not belong to the selected active territory';
  END IF;

  IF p_offer_id IS NOT NULL THEN
    SELECT so.* INTO v_offer
    FROM public.sales_offers so
    WHERE so.id = p_offer_id
      AND so.tenant_id = v_territory.tenant_id
      AND so.territory_id = v_territory.id
      AND so.active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'Offer does not belong to the selected active territory';
    END IF;
  END IF;

  IF NULLIF(pg_catalog.btrim(p_answers->>'quantity'), '') IS NOT NULL
     AND (p_answers->>'quantity') !~ '^[0-9]+([.][0-9]+)?$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'Quantity must be a non-negative number';
  END IF;

  INSERT INTO public.sales_leads (
    tenant_id, territory_id, offer_id, journey_id, buyer_type, contact_name, email,
    phone, location, quantity, event_date, product_interest, source, medium,
    campaign, content, answers, metadata
  )
  VALUES (
    v_territory.tenant_id,
    v_territory.id,
    p_offer_id,
    v_journey.id,
    NULLIF(pg_catalog.btrim(p_answers->>'buyer_type'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'contact_name'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'email'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'phone'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'location'), ''),
    CASE
      WHEN NULLIF(pg_catalog.btrim(p_answers->>'quantity'), '') IS NULL THEN NULL
      ELSE (p_answers->>'quantity')::numeric
    END,
    CASE
      WHEN NULLIF(pg_catalog.btrim(p_answers->>'event_date'), '') IS NULL THEN NULL
      ELSE (p_answers->>'event_date')::date
    END,
    NULLIF(pg_catalog.btrim(p_answers->>'product_interest'), ''),
    COALESCE(NULLIF(pg_catalog.btrim(p_source), ''), 'website'),
    NULLIF(pg_catalog.btrim(p_medium), ''),
    NULLIF(pg_catalog.btrim(p_campaign), ''),
    NULLIF(pg_catalog.btrim(p_content), ''),
    p_answers,
    pg_catalog.jsonb_build_object('created_via', 'public_sales_engine', 'rpc_version', 2)
  )
  RETURNING * INTO v_lead;

  RETURN v_lead;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_sales_lead(uuid, uuid, uuid, jsonb, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sales_lead(uuid, uuid, uuid, jsonb, text, text, text, text) TO anon, authenticated, service_role;
