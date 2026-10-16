-- =============================================================================
-- cp-public storage: media/ scope -- complete policy surface
-- =============================================================================
-- Fix: Supabase Storage INSERT ... RETURNING * and upsert-on-conflict paths
-- require SELECT, INSERT, UPDATE, and DELETE policies on storage.objects to
-- all be present for the same row. Prior to this migration, only INSERT
-- existed, causing 403 AccessDenied on every upload to media/{tenant_id}/*.
--
-- Predicate mirrors cp_public_media_insert exactly. Role array:
-- ['owner','admin','editor','manager'].
--
-- Applied directly to production on 2026-10-15 via Studio; recorded here
-- for repository parity.
-- =============================================================================

DROP POLICY IF EXISTS cp_public_media_select ON storage.objects;
CREATE POLICY cp_public_media_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cp-public'
    AND array_length(storage.foldername(name), 1) = 2
    AND (storage.foldername(name))[1] = 'media'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
      ((storage.foldername(name))[2])::uuid,
      ARRAY['owner','admin','editor','manager']::text[]
    )
  );

DROP POLICY IF EXISTS cp_public_media_update ON storage.objects;
CREATE POLICY cp_public_media_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cp-public'
    AND array_length(storage.foldername(name), 1) = 2
    AND (storage.foldername(name))[1] = 'media'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
      ((storage.foldername(name))[2])::uuid,
      ARRAY['owner','admin','editor','manager']::text[]
    )
  )
  WITH CHECK (
    bucket_id = 'cp-public'
    AND array_length(storage.foldername(name), 1) = 2
    AND (storage.foldername(name))[1] = 'media'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
      ((storage.foldername(name))[2])::uuid,
      ARRAY['owner','admin','editor','manager']::text[]
    )
  );

DROP POLICY IF EXISTS cp_public_media_delete ON storage.objects;
CREATE POLICY cp_public_media_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cp-public'
    AND array_length(storage.foldername(name), 1) = 2
    AND (storage.foldername(name))[1] = 'media'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
      ((storage.foldername(name))[2])::uuid,
      ARRAY['owner','admin','editor','manager']::text[]
    )
  );