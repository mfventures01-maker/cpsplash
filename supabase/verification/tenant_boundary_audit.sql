-- Read-only audit: tenant-owned public tables must have RLS enabled.
-- This query flags tables that contain tenant_id but have RLS disabled.
SELECT
  c.table_name,
  cls.relrowsecurity AS rls_enabled,
  cls.relforcerowsecurity AS force_rls
FROM information_schema.columns c
JOIN pg_namespace n ON n.nspname = c.table_schema
JOIN pg_class cls ON cls.relnamespace = n.oid AND cls.relname = c.table_name
WHERE c.table_schema = 'public'
  AND c.column_name = 'tenant_id'
  AND cls.relkind = 'r'
  AND NOT cls.relrowsecurity
ORDER BY c.table_name;

-- Review policies that contain tenant-aware conditions.
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
