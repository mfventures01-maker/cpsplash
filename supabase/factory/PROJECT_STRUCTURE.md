# Deterministic Ecommerce Project Structure

The following is the target structure for the next ecommerce repository. It separates the database lifecycle, domain modules, generated contracts, verification and project-specific configuration.

```text
project-root/
├── .env.example
├── .gitignore
├── package.json
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/
│   │   ├── 20261121000100_platform_extensions.sql
│   │   ├── 20261121000200_tenant_identity_and_membership.sql
│   │   ├── 20261121000300_catalogue_and_variants.sql
│   │   ├── 20261121000400_price_lists_and_prices.sql
│   │   ├── 20261121000500_media_assets_and_product_gallery.sql
│   │   ├── 20261121000600_sales_campaigns_and_funnels.sql
│   │   ├── 20261121000700_customers_and_addresses.sql
│   │   ├── 20261121000800_orders_items_and_payments.sql
│   │   ├── 20261121000900_inventory_and_locations.sql
│   │   ├── 20261121001000_analytics_and_audit.sql
│   │   ├── 20261121001100_rls_and_grants.sql
│   │   ├── 20261121001200_storage_buckets_and_policies.sql
│   │   └── 20261121001300_rpc_and_integrity_guards.sql
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── auth.ts
│   │   │   ├── tenant.ts
│   │   │   ├── validation.ts
│   │   │   └── response.ts
│   │   ├── lead-capture/
│   │   │   └── index.ts
│   │   ├── order-create/
│   │   │   └── index.ts
│   │   └── payment-webhook/
│   │       └── index.ts
│   ├── tests/
│   │   ├── 00_connection_smoke.test.sql
│   │   ├── 01_tenant_isolation.test.sql
│   │   ├── 02_catalogue_and_pricing.test.sql
│   │   ├── 03_media_and_storage.test.sql
│   │   ├── 04_sales_funnel.test.sql
│   │   ├── 05_order_payment_integrity.test.sql
│   │   └── 06_rls_and_rpc.test.sql
│   ├── verification/
│   │   ├── connection_smoke.sql
│   │   ├── schema_inventory.sql
│   │   ├── rls_inventory.sql
│   │   ├── function_inventory.sql
│   │   ├── storage_inventory.sql
│   │   └── tenant_boundary_audit.sql
│   ├── templates/
│   │   ├── tenant-bootstrap.template.sql
│   │   └── project-settings.template.md
│   └── factory/
│       ├── README.md
│       ├── PROJECT_STRUCTURE.md
│       ├── SCHEMA_MODULE_MAP.md
│       ├── CONNECTION_CONTRACT.md
│       ├── BUILD_SEQUENCE.md
│       └── ENVIRONMENT_CONTRACT.md
├── src/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       ├── env.ts
│   │       └── database.types.ts
│   ├── config/
│   │   ├── tenant.ts
│   │   ├── brand.ts
│   │   ├── currency.ts
│   │   ├── funnels.ts
│   │   └── sales-channels.ts
│   ├── domain/
│   │   ├── tenant/
│   │   ├── catalogue/
│   │   ├── pricing/
│   │   ├── media/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── inventory/
│   │   └── analytics/
│   ├── services/
│   │   ├── tenantService.ts
│   │   ├── productsService.ts
│   │   ├── pricingService.ts
│   │   ├── mediaService.ts
│   │   ├── placementService.ts
│   │   ├── salesService.ts
│   │   ├── leadService.ts
│   │   ├── ordersService.ts
│   │   ├── paymentsService.ts
│   │   └── analyticsService.ts
│   └── features/
│       ├── storefront/
│       ├── product-detail/
│       ├── checkout/
│       ├── sales-funnels/
│       ├── lead-capture/
│       ├── cms/
│       └── admin/
└── tests/
    ├── contracts/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

## Directory ownership

- `supabase/migrations`: immutable, ordered database changes. Never edit an applied migration.
- `supabase/seed.sql`: deterministic local/demo reference data only. No secrets and no production customer data.
- `supabase/functions`: server-side operations requiring trusted secrets or privileged orchestration.
- `supabase/tests`: database-level pgTAP or SQL assertions.
- `supabase/verification`: read-only inspection scripts used during connection and certification.
- `src/lib/supabase`: one typed client boundary per runtime. No feature should construct its own client.
- `src/domain`: domain types and invariants, independent of UI.
- `src/services`: persistence orchestration. Components call services, not ad hoc table mutations.
- `src/config`: project-specific values such as tenant slug, brand, currency, routes and funnel keys.
- `tests`: application contract, integration and browser verification.

## Files generated, not manually maintained

- `src/lib/supabase/database.types.ts` must be generated from the target Supabase project after migrations.
- Never copy CP Splash's `CP_SPLASH_TENANT_ID` into a new app.
- Never hand-edit generated database types to hide a schema mismatch.
- The exact migration filenames above are a suggested module order, not pre-existing applied migration versions. Generate new unique timestamps when implementing a new repository.
