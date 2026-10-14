-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261011011157
-- Recorded name: cp_splash_allow_gif_product_media_uploads
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]
WHERE id = 'cp-public';
