-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261011005429
-- Recorded name: cp_splash_harden_public_grants_and_tenant_helpers
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

-- CP Splash ecommerce defense-in-depth: anonymous access is read-only except public lead capture.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public FROM anon;

-- Explicitly preserve the public conversion endpoint used by CP Splash lead funnels.
GRANT INSERT ON TABLE public.sales_leads TO anon;

-- Harden tenant helper functions against search_path object shadowing.
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id uuid, _role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
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
$function$;

-- Avoid per-row auth.uid() re-evaluation in the profile self policy.
DROP POLICY IF EXISTS profile_self ON public.profiles;
CREATE POLICY profile_self ON public.profiles
FOR ALL TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));
