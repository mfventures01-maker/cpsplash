-- Read-only connection identity check. Safe to run against local, preview or production.
SELECT
  current_database() AS database_name,
  current_user AS database_role,
  current_schema() AS current_schema,
  current_setting('server_version') AS postgres_version,
  current_setting('search_path') AS search_path,
  now() AS checked_at;
