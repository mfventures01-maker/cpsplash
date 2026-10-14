-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261011005448
-- Recorded name: cp_splash_revoke_anonymous_private_reads
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

-- Remove anonymous read grants from private operational/customer/identity tables.
-- Public storefront reads remain available on catalog/content tables via their RLS policies.
REVOKE SELECT ON TABLE
  public.analytics_events,
  public.audit_logs,
  public.customer_addresses,
  public.customers,
  public.influencers,
  public.inventory_items,
  public.inventory_transactions,
  public.inventory_transfers,
  public.locations,
  public.orders,
  public.order_items,
  public.payments,
  public.profiles,
  public.roles,
  public.tenant_memberships
FROM anon;
