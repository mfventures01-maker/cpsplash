-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      sales_offers (table)
-- Recovered:   2026-10-14
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- =============================================================================

CREATE TABLE public.sales_offers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  territory_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  offer_type text DEFAULT 'standard'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.sales_offers ADD CONSTRAINT sales_offers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.sales_offers ADD CONSTRAINT sales_offers_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_offers ADD CONSTRAINT sales_offers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sales_offers ADD CONSTRAINT sales_offers_tenant_id_slug_key UNIQUE (tenant_id, slug);
ALTER TABLE public.sales_offers ADD CONSTRAINT sales_offers_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES sales_territories(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX sales_offers_tenant_id_slug_key ON public.sales_offers USING btree (tenant_id, slug);
CREATE INDEX sales_offers_territory_idx ON public.sales_offers USING btree (tenant_id, territory_id, active);

ALTER TABLE public.sales_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_offers_public_select" ON public.sales_offers;
CREATE POLICY "sales_offers_public_select" ON public.sales_offers
  FOR SELECT TO authenticated, anon
  USING (((tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid) AND (active = true)))
;

DROP POLICY IF EXISTS "sales_offers_staff_manage" ON public.sales_offers;
CREATE POLICY "sales_offers_staff_manage" ON public.sales_offers
  FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'manager'::text]))
  WITH CHECK (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'manager'::text]))
;

DROP TRIGGER IF EXISTS sales_offers_updated_at ON public.sales_offers;
CREATE TRIGGER sales_offers_updated_at BEFORE UPDATE ON public.sales_offers FOR EACH ROW EXECUTE FUNCTION touch_sales_updated_at();

