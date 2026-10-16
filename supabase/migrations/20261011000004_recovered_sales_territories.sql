-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      sales_territories (table)
-- Recovered:   2026-10-14
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- =============================================================================

CREATE TABLE public.sales_territories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  headline text NOT NULL,
  description text,
  buyer_summary text,
  cta_label text NOT NULL,
  landing_path text,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.sales_territories ADD CONSTRAINT sales_territories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.sales_territories ADD CONSTRAINT sales_territories_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_territories ADD CONSTRAINT sales_territories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sales_territories ADD CONSTRAINT sales_territories_tenant_id_slug_key UNIQUE (tenant_id, slug);
CREATE INDEX sales_territories_public_idx ON public.sales_territories USING btree (tenant_id, active, sort_order);

ALTER TABLE public.sales_territories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_territories_public_select" ON public.sales_territories;
CREATE POLICY "sales_territories_public_select" ON public.sales_territories
  FOR SELECT TO authenticated, anon
  USING (((tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid) AND (active = true)))
;

DROP POLICY IF EXISTS "sales_territories_staff_manage" ON public.sales_territories;
CREATE POLICY "sales_territories_staff_manage" ON public.sales_territories
  FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'manager'::text]))
  WITH CHECK (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'manager'::text]))
;

DROP TRIGGER IF EXISTS sales_territories_updated_at ON public.sales_territories;
CREATE TRIGGER sales_territories_updated_at BEFORE UPDATE ON public.sales_territories FOR EACH ROW EXECUTE FUNCTION touch_sales_updated_at();

