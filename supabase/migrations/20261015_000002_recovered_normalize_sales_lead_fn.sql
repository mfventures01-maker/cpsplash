-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      normalize_sales_lead (function)
-- Recovered:   2026-10-14
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.normalize_sales_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if not exists (
    select 1 from public.sales_territories
    where id = new.territory_id
      and tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid
      and active = true
  ) then
    raise exception 'Invalid or inactive sales territory';
  end if;

  if new.journey_id is not null and not exists (
    select 1 from public.sales_journeys
    where id = new.journey_id
      and territory_id = new.territory_id
      and tenant_id = new.tenant_id
      and active = true
  ) then
    raise exception 'Invalid or inactive sales journey';
  end if;

  if new.offer_id is not null and not exists (
    select 1 from public.sales_offers
    where id = new.offer_id
      and territory_id = new.territory_id
      and tenant_id = new.tenant_id
      and active = true
  ) then
    raise exception 'Invalid or inactive sales offer';
  end if;

  new.tenant_id := '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid;
  new.status := 'new';
  new.lead_number := 'CPL-' || lpad(nextval('public.sales_lead_number_seq')::text, 6, '0');
  new.updated_at := now();
  return new;
end;
$function$

