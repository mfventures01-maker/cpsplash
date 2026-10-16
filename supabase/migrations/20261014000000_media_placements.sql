-- ==============================================================================
-- CP SPLASH MEDIA PLACEMENTS: MIGRATION CONCILIATION NOTICE
-- Version: 20261014000000
-- Status: SUPERSEDED by atomic migrations 20261014000001 through 20261014000005.
-- Recoverable backup preserved at:
--   supabase/migrations/20261014000000_media_placements.sql.superseded_by_000001_to_000005.bak
--
-- Breakdown of atomic migrations:
--   - 20261014000001_media_placements_table.sql       (table + performance indexes)
--   - 20261014000002_media_placements_modtime.sql     (updated_at trigger)
--   - 20261014000003_media_placements_integrity.sql   (cross-tenant integrity trigger)
--   - 20261014000004_media_placements_rls.sql         (table RLS policies)
--   - 20261014000005_cp_public_storage_scope.sql      (narrow media/{tenant_id}/* storage scope)
--
-- This file intentionally executes NO-OP statements to preserve migration-history
-- compatibility and prevent duplicate execution of schema changes.
-- ==============================================================================

SELECT 1;
