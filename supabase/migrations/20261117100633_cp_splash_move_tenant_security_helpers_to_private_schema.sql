
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_tenant_role(_tenant_id uuid, _role_names text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    JOIN public.roles r ON r.id = tm.role_id
    WHERE tm.tenant_id = _tenant_id AND tm.user_id = auth.uid()
      AND tm.status = 'active' AND r.name = ANY(_role_names)
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_tenant_member(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.tenant_id = _tenant_id AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  );
$function$;

REVOKE ALL ON FUNCTION private.has_tenant_role(uuid,text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_tenant_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_tenant_role(uuid,text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_tenant_member(uuid) TO authenticated, service_role;

DO $$
DECLARE p record; v_using text; v_check text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        position('has_tenant_role(' in coalesce(qual,'')) > 0
        OR position('has_tenant_role(' in coalesce(with_check,'')) > 0
        OR position('is_tenant_member(' in coalesce(qual,'')) > 0
        OR position('is_tenant_member(' in coalesce(with_check,'')) > 0
      )
  LOOP
    v_using := p.qual;
    v_check := p.with_check;
    IF v_using IS NOT NULL THEN
      v_using := replace(replace(v_using, 'has_tenant_role(', 'private.has_tenant_role('), 'is_tenant_member(', 'private.is_tenant_member(');
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', p.policyname, p.schemaname, p.tablename, v_using);
    END IF;
    IF v_check IS NOT NULL THEN
      v_check := replace(replace(v_check, 'has_tenant_role(', 'private.has_tenant_role('), 'is_tenant_member(', 'private.is_tenant_member(');
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', p.policyname, p.schemaname, p.tablename, v_check);
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.has_tenant_role(uuid,text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon, authenticated;
