
-- Keep the validated elevated insert implementation outside the exposed public API schema.
CREATE OR REPLACE FUNCTION private.create_sales_lead(
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
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Lead answers must be a JSON object';
  END IF;

  SELECT st.* INTO v_territory
  FROM public.sales_territories st
  JOIN public.tenants t ON t.id = st.tenant_id
  WHERE st.id = p_territory_id
    AND st.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
    AND st.active = true AND t.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid or inactive CP Splash sales territory';
  END IF;

  SELECT sj.* INTO v_journey
  FROM public.sales_journeys sj
  WHERE sj.id = p_journey_id
    AND sj.tenant_id = v_territory.tenant_id
    AND sj.territory_id = v_territory.id
    AND sj.active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Journey does not belong to the selected active territory';
  END IF;

  IF p_offer_id IS NOT NULL THEN
    SELECT so.* INTO v_offer
    FROM public.sales_offers so
    WHERE so.id = p_offer_id
      AND so.tenant_id = v_territory.tenant_id
      AND so.territory_id = v_territory.id
      AND so.active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Offer does not belong to the selected active territory';
    END IF;
  END IF;

  IF NULLIF(pg_catalog.btrim(p_answers->>'quantity'), '') IS NOT NULL
     AND (p_answers->>'quantity') !~ '^[0-9]+([.][0-9]+)?$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Quantity must be a non-negative number';
  END IF;

  INSERT INTO public.sales_leads (
    tenant_id, territory_id, offer_id, journey_id, buyer_type, contact_name, email,
    phone, location, quantity, event_date, product_interest, source, medium,
    campaign, content, answers, metadata
  )
  VALUES (
    v_territory.tenant_id, v_territory.id, p_offer_id, v_journey.id,
    NULLIF(pg_catalog.btrim(p_answers->>'buyer_type'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'contact_name'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'email'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'phone'), ''),
    NULLIF(pg_catalog.btrim(p_answers->>'location'), ''),
    CASE WHEN NULLIF(pg_catalog.btrim(p_answers->>'quantity'), '') IS NULL THEN NULL
         ELSE (p_answers->>'quantity')::numeric END,
    CASE WHEN NULLIF(pg_catalog.btrim(p_answers->>'event_date'), '') IS NULL THEN NULL
         ELSE (p_answers->>'event_date')::date END,
    NULLIF(pg_catalog.btrim(p_answers->>'product_interest'), ''),
    COALESCE(NULLIF(pg_catalog.btrim(p_source), ''), 'website'),
    NULLIF(pg_catalog.btrim(p_medium), ''),
    NULLIF(pg_catalog.btrim(p_campaign), ''),
    NULLIF(pg_catalog.btrim(p_content), ''),
    p_answers,
    pg_catalog.jsonb_build_object('created_via', 'public_sales_engine', 'rpc_version', 3)
  )
  RETURNING * INTO v_lead;

  RETURN v_lead;
END;
$function$;

REVOKE ALL ON FUNCTION private.create_sales_lead(uuid,uuid,uuid,jsonb,text,text,text,text) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.create_sales_lead(uuid,uuid,uuid,jsonb,text,text,text,text) TO anon, authenticated, service_role;

DROP FUNCTION public.create_sales_lead(uuid,uuid,uuid,jsonb,text,text,text,text);

CREATE FUNCTION public.create_sales_lead(
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
LANGUAGE sql
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT private.create_sales_lead(
    p_territory_id, p_journey_id, p_offer_id, p_answers,
    p_source, p_medium, p_campaign, p_content
  );
$function$;

REVOKE ALL ON FUNCTION public.create_sales_lead(uuid,uuid,uuid,jsonb,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sales_lead(uuid,uuid,uuid,jsonb,text,text,text,text) TO anon, authenticated, service_role;
