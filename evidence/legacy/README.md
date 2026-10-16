# Legacy schema baseline

20260929000000_cp_splash_schema.sql was the original single-tenant CP Splash
schema. It was never applied to production: production's schema_migrations
ledger begins at 20261001093826_create_multi_tenant_ecommerce_engine.

Applying both in sequence fails because the two files define overlapping
tables (product_categories, products, product_media, etc.) and the engine
migration uses CREATE TABLE without IF NOT EXISTS.

This file is retained for historical reference. It is NOT part of the
migration sequence that builds a fresh database.

The authoritative schema is:
  20261001093826_create_multi_tenant_ecommerce_engine.sql
  ... through ...
  20261011011157_cp_splash_allow_gif_product_media_uploads.sql
  ... plus the media_placements migrations in supabase/migrations/
