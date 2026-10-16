-- =============================================================================
-- cp-public storage: media/ scope (rewrite)
-- REWRITE OF 20261014000000 STORAGE SECTION
--
-- Scope (deliberately minimal):
--   Adds exactly ONE new policy for the media/{tenant_id}/ scope.
--   Adds NO policies for products/, homepage/, menu/, funnels/, campaigns/,
--   or journeys/.
--   Adds NO public-read policy (bucket flag cp-public.public = true already
--   serves anonymous reads via the /object/public/ path).
--   Does NOT drop, alter, or shadow any existing policy.
--
-- Why only media/:
--   Of the six CMS prefixes, only media/ carries a resolvable tenant identifier
--   in its path. The other five (homepage/{scopeType}, menu, funnels/{scopeId},
--   campaigns/{scopeId}, journeys/{scopeId}) do not, and there is no database
--   anchor for homepage/, menu/, or funnels/ at all. Granting those paths would
--   require hardcoding the CP Splash tenant UUID and would not generalize to
--   other tenants. The tenant-in-path refactor for those five prefixes is a
--   separate follow-up.
--
-- What is preserved:
--   - cp_public_cms_delete     (media, DELETE)     - unchanged (pre-existing)
--   - cp_public_staff_insert   (products, INSERT)   - unchanged
--   - cp_public_staff_select   (products, SELECT)   - unchanged
--   - cp_public_staff_update   (products, UPDATE)   - unchanged
--   - cp_public_staff_delete   (products, DELETE)   - unchanged
--
-- What is added:
--   - cp_public_media_insert   (media, INSERT)      - tenant-scoped
--
-- Dependencies:
--   public.has_tenant_role(uuid, text[])  - present in production
--   public.tenants(id)                    - parent of the tenant UUID in path
--
-- Path contract for media/:
--   name = media/{tenant_id}/{timestamp}_{nonce}_{filename}
--   foldername(name) = ['media', '{tenant_id}']  ->  array_length = 2
--   Segment [2] MUST be a valid UUID matching a tenants.id row.
--   Deeper nesting (media/{tenant}/subdir/file) is intentionally rejected by
--   the array_length = 2 guard.
--
-- Not yet applied to production. Stage-test before apply.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- media/{tenant_id}/  - INSERT
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS cp_public_media_insert ON storage.objects;
CREATE POLICY cp_public_media_insert ON storage.objects
    FOR INSERT TO authenticated
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
