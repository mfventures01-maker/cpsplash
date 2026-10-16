-- =============================================================================
-- media_placements: Row-Level Security
-- Split from 20261014000000_media_placements.sql per Law 5.
-- Scope: the media_placements table only. Storage policies are in _000005_.
-- =============================================================================

ALTER TABLE public.media_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for active media placements" ON public.media_placements;
CREATE POLICY "Public read access for active media placements"
    ON public.media_placements
    FOR SELECT
    USING (
        active = true
        AND EXISTS (
            SELECT 1 FROM public.media_assets ma
            WHERE ma.id = media_placements.media_id
              AND ma.status = 'active'
              AND ma.bucket = 'cp-public'
        )
    );

DROP POLICY IF EXISTS "Tenant admin manage media placements" ON public.media_placements;
CREATE POLICY "Tenant admin manage media placements"
    ON public.media_placements
    FOR ALL
    TO authenticated
    USING (
        public.has_tenant_role(tenant_id, ARRAY['owner','admin','editor','manager'])
    )
    WITH CHECK (
        public.has_tenant_role(tenant_id, ARRAY['owner','admin','editor','manager'])
    );