# HOEOS Ecommerce Supabase Factory

This directory is the handoff contract for creating the next ecommerce application from the CP Splash sales-machine foundation.

It is a **blueprint**, not a migration bundle. It contains no production credentials, CP Splash tenant identifiers, customer data or live records. A new application must connect to its own Supabase project and bootstrap its own tenant.

## Read in this order

1. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md): canonical repository and Supabase file layout.
2. [SCHEMA_MODULE_MAP.md](./SCHEMA_MODULE_MAP.md): CP Splash schema modules and the tables/functions they represent.
3. [CONNECTION_CONTRACT.md](./CONNECTION_CONTRACT.md): environment, project linking, tenant isolation and generated types.
4. [BUILD_SEQUENCE.md](./BUILD_SEQUENCE.md): deterministic implementation and verification order.
5. [ENVIRONMENT_CONTRACT.md](./ENVIRONMENT_CONTRACT.md): required environment variables and secret boundaries.

## Source-of-truth hierarchy

1. The target Supabase project's live catalog, migration ledger, RLS policies, functions and Storage configuration.
2. Versioned SQL migrations in the target repository.
3. Generated TypeScript database types from that target project.
4. Domain services and application code.
5. This factory documentation.

Never use a handwritten schema snapshot or this blueprint to overwrite a live database without a reviewed migration plan.

## Critical CP Splash recovery note

The current `supabase/schema.sql` is only a psql include stub referencing `20260929000000_cp_splash_schema.sql`. That referenced file is not present in the current repository tree. It is not a complete standalone schema dump.

The recovered migration `20261001093826_create_multi_tenant_ecommerce_engine.sql` explicitly says it was reconstructed from the production ledger and **must not be applied as a new migration**. Treat it as historical evidence only. Reconstruct a fresh project's schema from reviewed, ordered migrations and verified live definitions.

## Law 13 rule

Every new project must return reusable improvements to the factory: migrations, typed contracts, reusable services, RLS patterns, deterministic tests, deployment instructions and evidence. Do not fork the foundation silently.
