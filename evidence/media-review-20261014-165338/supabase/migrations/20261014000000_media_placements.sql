-- ==============================================================================
-- CP SPLASH TENANT-SCOPED MEDIA PLACEMENTS MIGRATION
-- Migration Version: 20261014000000_media_placements.sql
-- Governed under HOEOS Canonical Media Contract
-- Scope: Homepage, Product Menu, Product Gallery, Five Sales Funnels, Campaigns & Journeys
-- ==============================================================================

-- 1. Create media_placements table
CREATE TABLE IF NOT EXISTS public.media_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
    placement_key VARCHAR(120) NOT NULL,
    scope_type VARCHAR(64) NOT NULL CHECK (
        scope_type IN (
            'homepage_hero',
            'homepage_carousel',
            'product_menu',
            'product_gallery',
            'funnel_hero',
            'funnel_card',
            'campaign',
            'sales_journey'
        )
    ),
    scope_id VARCHAR(120),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    alt_text_override VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_media_placements_tenant_scope
    ON public.media_placements(tenant_id, scope_type, scope_id, active, sort_order);

CREATE INDEX IF NOT EXISTS idx_media_placements_media_id
    ON public.media_placements(media_id);

CREATE INDEX IF NOT EXISTS idx_media_placements_placement_key
    ON public.media_placements(tenant_id, placement_key);

-- 3. Row-Level Security (RLS)
ALTER TABLE public.media_placements ENABLE ROW LEVEL SECURITY;

-- 3a. Public read policy: Anyone can read active placements referencing active media in cp-public bucket
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

-- 3b. Authenticated tenant role management using authoritative helper
DROP POLICY IF EXISTS "Tenant admin manage media placements" ON public.media_placements;
CREATE POLICY "Tenant admin manage media placements"
    ON public.media_placements
    FOR ALL
    TO authenticated
    USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor', 'manager'])
    )
    WITH CHECK (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor', 'manager'])
    );

-- 4. Cross-Tenant Integrity Trigger: Enforce tenant consistency across placement, asset, and references
CREATE OR REPLACE FUNCTION public.check_media_placement_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_asset_tenant_id UUID;
BEGIN
    -- Verify media asset exists and belongs to same tenant
    SELECT tenant_id INTO v_asset_tenant_id
    FROM public.media_assets
    WHERE id = NEW.media_id;

    IF v_asset_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Referenced media asset % does not exist', NEW.media_id;
    END IF;

    IF v_asset_tenant_id <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch: placement tenant % does not match media asset tenant %',
            NEW.tenant_id, v_asset_tenant_id;
    END IF;

    -- Verify campaign tenant consistency if referenced
    IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = NEW.scope_id::uuid AND c.tenant_id = NEW.tenant_id
        ) THEN
            RAISE EXCEPTION 'Referenced campaign % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
        END IF;
    END IF;

    -- Verify sales journey tenant consistency if referenced
    IF NEW.scope_type = 'sales_journey' AND NEW.scope_id IS NOT NULL AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.sales_journeys sj
            WHERE sj.id = NEW.scope_id::uuid AND sj.tenant_id = NEW.tenant_id
        ) THEN
            RAISE EXCEPTION 'Referenced sales journey % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_placement_tenant_consistency ON public.media_placements;
CREATE TRIGGER trigger_media_placement_tenant_consistency
    BEFORE INSERT OR UPDATE ON public.media_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.check_media_placement_tenant_consistency();

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_media_placements_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_placements_modtime ON public.media_placements;
CREATE TRIGGER trigger_media_placements_modtime
    BEFORE UPDATE ON public.media_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_media_placements_modtime();

-- 6. Storage Policies: Reconcile scoped object paths in cp-public bucket
-- Preserves products/{productId}/* and grants narrowly scoped paths for CMS placements
DROP POLICY IF EXISTS "Public read cp-public storage objects" ON storage.objects;
CREATE POLICY "Public read cp-public storage objects"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'cp-public');

DROP POLICY IF EXISTS "Authenticated upload scoped cp-public storage objects" ON storage.objects;
CREATE POLICY "Authenticated upload scoped cp-public storage objects"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'cp-public'
        AND (
            -- Preserved: Product uploads under products/{productId}/*
            (storage.foldername(name))[1] = 'products'
            -- Scoped: Homepage placements under homepage/{scopeType}/*
            OR (storage.foldername(name))[1] = 'homepage'
            -- Scoped: Product menu placements under menu/*
            OR (storage.foldername(name))[1] = 'menu'
            -- Scoped: Funnel hero/card placements under funnels/{scopeId}/*
            OR (storage.foldername(name))[1] = 'funnels'
            -- Scoped: Campaign placements under campaigns/{scopeId}/*
            OR (storage.foldername(name))[1] = 'campaigns'
            -- Scoped: Sales journey placements under journeys/{scopeId}/*
            OR (storage.foldername(name))[1] = 'journeys'
            -- Scoped: General tenant media under media/{tenantId}/*
            OR (storage.foldername(name))[1] = 'media'
        )
    );

DROP POLICY IF EXISTS "Authenticated delete scoped cp-public storage objects" ON storage.objects;
CREATE POLICY "Authenticated delete scoped cp-public storage objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'cp-public'
        AND (
            (storage.foldername(name))[1] IN ('products', 'homepage', 'menu', 'funnels', 'campaigns', 'journeys', 'media')
        )
    );

