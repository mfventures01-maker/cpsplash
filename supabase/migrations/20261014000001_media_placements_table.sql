-- =============================================================================
-- media_placements: table + indexes
-- Split from 20261014000000_media_placements.sql per Law 5.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.media_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
    placement_key VARCHAR(120) NOT NULL,
    scope_type VARCHAR(64) NOT NULL CHECK (
        scope_type IN (
            'homepage_hero','homepage_carousel','product_menu','product_gallery',
            'funnel_hero','funnel_card','campaign','sales_journey'
        )
    ),
    scope_id VARCHAR(120),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    alt_text_override VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_placements_tenant_scope
    ON public.media_placements(tenant_id, scope_type, scope_id, active, sort_order);

CREATE INDEX IF NOT EXISTS idx_media_placements_media_id
    ON public.media_placements(media_id);

CREATE INDEX IF NOT EXISTS idx_media_placements_placement_key
    ON public.media_placements(tenant_id, placement_key);