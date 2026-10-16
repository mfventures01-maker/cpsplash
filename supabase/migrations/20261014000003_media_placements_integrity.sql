-- =============================================================================
-- media_placements: tenant-consistency trigger
-- Split from 20261014000000_media_placements.sql per Law 5.
-- Depends on: campaigns, sales_journeys, media_assets (all present in production)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_media_placement_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_asset_tenant_id UUID;
BEGIN
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

    IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL
       AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = NEW.scope_id::uuid AND c.tenant_id = NEW.tenant_id
        ) THEN
            RAISE EXCEPTION 'Referenced campaign % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
        END IF;
    END IF;

    IF NEW.scope_type = 'sales_journey' AND NEW.scope_id IS NOT NULL
       AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
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