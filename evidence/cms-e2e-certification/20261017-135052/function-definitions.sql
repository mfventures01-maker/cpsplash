-- Extracted Function Definitions from Production Database
-- Timestamp: 2026-10-17T13:15:08.427Z

-- Function: check_media_placement_tenant_consistency (SECURITY DEFINER: false)
CREATE OR REPLACE FUNCTION public.check_media_placement_tenant_consistency()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Function: has_tenant_role (SECURITY DEFINER: true)
CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id uuid, _role_names text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    JOIN public.roles r ON r.id = tm.role_id
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND r.name = ANY(_role_names)
  );
$function$
;

-- Function: is_tenant_member (SECURITY DEFINER: true)
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  );
$function$
;

-- Function: update_media_placements_modtime (SECURITY DEFINER: false)
CREATE OR REPLACE FUNCTION public.update_media_placements_modtime()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

