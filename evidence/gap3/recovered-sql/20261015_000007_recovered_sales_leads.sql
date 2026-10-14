-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      sales_leads (table)
-- Recovered:   2026-10-14
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- =============================================================================

CREATE TABLE public.sales_leads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  lead_number text DEFAULT ('CPL-'::text || lpad((nextval('sales_lead_number_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
  territory_id uuid NOT NULL,
  offer_id uuid,
  journey_id uuid,
  buyer_type text,
  contact_name text,
  email text,
  phone text,
  location text,
  quantity numeric,
  event_date date,
  product_interest text,
  status text DEFAULT 'new'::text NOT NULL,
  source text,
  medium text,
  campaign text,
  content text,
  manychat_contact_id text,
  notes text,
  answers jsonb DEFAULT '{}'::jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES sales_journeys(id);
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_lead_number_key UNIQUE (lead_number);
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES sales_offers(id);
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'quoted'::text, 'won'::text, 'lost'::text, 'closed'::text])));
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sales_leads ADD CONSTRAINT sales_leads_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES sales_territories(id);

CREATE UNIQUE INDEX sales_leads_lead_number_key ON public.sales_leads USING btree (lead_number);
CREATE INDEX sales_leads_pipeline_idx ON public.sales_leads USING btree (tenant_id, status, created_at DESC);
CREATE INDEX sales_leads_territory_idx ON public.sales_leads USING btree (tenant_id, territory_id, created_at DESC);

ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_leads_public_insert" ON public.sales_leads;
CREATE POLICY "sales_leads_public_insert" ON public.sales_leads
  FOR INSERT TO anon
  WITH CHECK (((tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid) AND (status = 'new'::text)))
;

DROP POLICY IF EXISTS "sales_leads_staff_delete" ON public.sales_leads;
CREATE POLICY "sales_leads_staff_delete" ON public.sales_leads
  FOR DELETE TO authenticated
  USING (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text]))
;

DROP POLICY IF EXISTS "sales_leads_staff_insert" ON public.sales_leads;
CREATE POLICY "sales_leads_staff_insert" ON public.sales_leads
  FOR INSERT TO authenticated
  WITH CHECK (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'sales'::text, 'marketing'::text]))
;

DROP POLICY IF EXISTS "sales_leads_staff_select" ON public.sales_leads;
CREATE POLICY "sales_leads_staff_select" ON public.sales_leads
  FOR SELECT TO authenticated
  USING (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'sales'::text, 'marketing'::text]))
;

DROP POLICY IF EXISTS "sales_leads_staff_update" ON public.sales_leads;
CREATE POLICY "sales_leads_staff_update" ON public.sales_leads
  FOR UPDATE TO authenticated
  USING (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'sales'::text, 'marketing'::text]))
  WITH CHECK (has_tenant_role(tenant_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'sales'::text, 'marketing'::text]))
;

DROP TRIGGER IF EXISTS normalize_sales_lead_before_insert ON public.sales_leads;
CREATE TRIGGER normalize_sales_lead_before_insert BEFORE INSERT ON public.sales_leads FOR EACH ROW EXECUTE FUNCTION normalize_sales_lead();

DROP TRIGGER IF EXISTS sales_leads_updated_at ON public.sales_leads;
CREATE TRIGGER sales_leads_updated_at BEFORE UPDATE ON public.sales_leads FOR EACH ROW EXECUTE FUNCTION touch_sales_updated_at();

