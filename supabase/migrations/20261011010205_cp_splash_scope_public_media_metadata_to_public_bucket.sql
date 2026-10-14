-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261011010205
-- Recorded name: cp_splash_scope_public_media_metadata_to_public_bucket
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.
DROP POLICY IF EXISTS media_public_select ON public.media_assets;
CREATE POLICY media_public_select
ON public.media_assets
FOR SELECT
TO anon, authenticated
USING (status = 'active' AND bucket = 'cp-public');
