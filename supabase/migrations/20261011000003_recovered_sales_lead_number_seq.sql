-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      sales_lead_number_seq (sequence)
-- Recovered:   2026-10-14
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS public.sales_lead_number_seq
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  CACHE 1
  NO CYCLE
;
