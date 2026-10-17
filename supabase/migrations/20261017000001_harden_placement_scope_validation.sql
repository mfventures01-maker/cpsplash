-- Migration: 20261017000001_harden_media_placement_scope_validation.sql
-- Description: Enforce explicit UUID validation on non-null campaign and sales_journey scope_ids.
-- Fail-closed: Malformed scope_ids raise immediate exception instead of silently skipping ownership check.

CREATE OR REPLACE FUNCTION public.check_media_placement_tenant_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_asset_tenant_id UUID;
BEGIN
    -- 1. Validate referenced media asset exists and belongs to same tenant
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

    -- 2. Validate campaign scope
    IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL THEN
        IF NOT (NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
            RAISE EXCEPTION 'Malformed campaign scope_id: "%" is not a valid UUID', NEW.scope_id;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = NEW.scope_id::uuid AND c.tenant_id = NEW.tenant_id
        ) THEN
            RAISE EXCEPTION 'Referenced campaign % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
        END IF;
    END IF;

    -- 3. Validate sales_journey scope
    IF NEW.scope_type = 'sales_journey' AND NEW.scope_id IS NOT NULL THEN
        IF NOT (NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
            RAISE EXCEPTION 'Malformed sales_journey scope_id: "%" is not a valid UUID', NEW.scope_id;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.sales_journeys sj
            WHERE sj.id = NEW.scope_id::uuid AND sj.tenant_id = NEW.tenant_id
        ) THEN
            RAISE EXCEPTION 'Referenced sales journey % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;
