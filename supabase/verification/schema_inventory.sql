-- Read-only public schema inventory.
SELECT
  t.table_name,
  count(c.column_name)::integer AS column_count,
  bool_or(c.column_name = 'tenant_id') AS has_tenant_id
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = t.table_schema
 AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
