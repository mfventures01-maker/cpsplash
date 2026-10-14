-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261001184542
-- Recorded name: restore_authenticated_tenant_function_execution
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.has_tenant_role(uuid, text[]) to authenticated;
