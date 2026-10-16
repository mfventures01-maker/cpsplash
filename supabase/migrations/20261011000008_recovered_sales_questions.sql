-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      sales_questions (table)
-- Recovered:   2026-10-15
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration outside this repository.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- Depends on:  tenants, sales_journeys, touch_sales_updated_at()
-- =============================================================================

CREATE TABLE public.sales_questions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  journey_id uuid NOT NULL,
  field_key text NOT NULL,
  label text NOT NULL,
  question_type text DEFAULT 'text' NOT NULL,
  required boolean DEFAULT false NOT NULL,
  placeholder text,
  options jsonb DEFAULT '[]'::jsonb NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.sales_questions
  ADD CONSTRAINT sales_questions_pkey PRIMARY KEY (id);

ALTER TABLE public.sales_questions
  ADD CONSTRAINT sales_questions_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.sales_questions
  ADD CONSTRAINT sales_questions_journey_id_fkey
  FOREIGN KEY (journey_id) REFERENCES public.sales_journeys(id) ON DELETE CASCADE;

ALTER TABLE public.sales_questions
  ADD CONSTRAINT sales_questions_journey_id_field_key_key
  UNIQUE (journey_id, field_key);

ALTER TABLE public.sales_questions
  ADD CONSTRAINT sales_questions_question_type_check
  CHECK (question_type = ANY (ARRAY['text','email','phone','number','date','select','textarea']::text[]));

CREATE INDEX sales_questions_journey_idx
  ON public.sales_questions(tenant_id, journey_id, active, sort_order);

ALTER TABLE public.sales_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_questions_public_select" ON public.sales_questions;
CREATE POLICY "sales_questions_public_select" ON public.sales_questions
  FOR SELECT TO authenticated, anon
  USING (
    (tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid)
    AND (active = true)
  );

DROP POLICY IF EXISTS "sales_questions_staff_manage" ON public.sales_questions;
CREATE POLICY "sales_questions_staff_manage" ON public.sales_questions
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(
      tenant_id,
      ARRAY['owner','admin','editor','manager']::text[]
    )
  )
  WITH CHECK (
    public.has_tenant_role(
      tenant_id,
      ARRAY['owner','admin','editor','manager']::text[]
    )
  );

DROP TRIGGER IF EXISTS sales_questions_updated_at ON public.sales_questions;
CREATE TRIGGER sales_questions_updated_at
  BEFORE UPDATE ON public.sales_questions
  FOR EACH ROW
  EXECUTE FUNCTION touch_sales_updated_at();