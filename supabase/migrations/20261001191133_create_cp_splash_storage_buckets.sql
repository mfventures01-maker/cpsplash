-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261001191133
-- Recorded name: create_cp_splash_storage_buckets
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cp-public', 'cp-public', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('cp-private', 'cp-private', false, 52428800, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('cp-ugc', 'cp-ugc', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('cp-campaigns', 'cp-campaigns', false, 104857600, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
