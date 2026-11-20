# Supabase Connection Contract for a New Ecommerce Application

## 1. Isolation rule

Each new ecommerce application receives:
- Its own Supabase project.
- Its own Vercel/hosting project and environment variables.
- Its own tenant row and tenant membership.
- Its own Storage buckets and policies.
- Its own migration history and generated database types.

Do not connect a new app to CP Splash's production project as its default database. Do not reuse CP Splash's tenant UUID, service-role key, Auth users, media paths, product IDs or customer records.

## 2. Required local environment

Use an ignored local `.env.local` or `.env` file. Commit only a placeholder `.env.example`.

Browser-safe variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only variables when needed:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Provider secrets such as payment webhook secrets.

Never prefix a service-role key or payment secret with `VITE_`. Never paste secrets into GitHub files, prompts, logs or screenshots.

## 3. Project connection sequence

1. Create the new Supabase project in the correct organization and region.
2. Record the project reference, region, database version and owner in the private project runbook.
3. Authenticate Supabase CLI using the approved developer session.
4. Run `supabase link --project-ref <NEW_PROJECT_REF>` from the new repository.
5. Confirm the linked project reference before any database command.
6. Generate or verify `supabase/config.toml` for that project.
7. Apply reviewed migrations to a disposable local database first.
8. Run the schema, RLS, function and Storage verification scripts.
9. Apply migrations to the new hosted project only after explicit release approval.
10. Generate types from the target project and commit the output.
11. Configure preview environment variables separately from production.
12. Run the storefront and sales-funnel smoke tests against the isolated preview.

Never rely on a developer's default linked project. Print and compare the target project reference before `db push`, `migration up`, function deployment or secret mutation.

## 4. Single client boundary

Create the Supabase client in `src/lib/supabase/client.ts` and export a single typed client. Server-side privileged operations use a separate server-only client module. Domain services import those boundaries; React components do not create independent clients.

## 5. Tenant resolution

The active tenant must be resolved from trusted application configuration, verified hostname/domain mapping or authenticated membership. A user-controlled request body must never be trusted as the authority for tenant access.

For public storefront reads, the tenant key is a public routing identifier, but database policies must still constrain every returned row to that tenant. For staff operations, verify authenticated membership and role in the database.

## 6. First-run tenant bootstrap

Tenant bootstrap is a controlled administrative operation:
1. Create the tenant.
2. Create system roles or tenant-scoped roles.
3. Create the owner membership after the owner has authenticated.
4. Create the default store/location if the business requires one.
5. Create the default price list and currency.
6. Create sales territories, offers, journeys and qualification questions.
7. Verify read-back and tenant ownership for every inserted row.

Do not place a fixed tenant UUID in migration SQL. Do not create the owner by accepting an arbitrary user ID from an unauthenticated client. Do not seed production with demo products.

## 7. Generated types

After the target database migrations are applied:
```powershell
supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

Review the generated diff. The generated types must match the live target project. Never copy CP Splash's tenant-specific type constant into a new project.

## 8. Required connection evidence

Capture:
- Target project reference (non-secret).
- `supabase status` output.
- Migration list and applied versions.
- Public table inventory.
- RLS-enabled table inventory.
- Function inventory and grants.
- Storage bucket and policy inventory.
- Generated type file hash/commit.
- Successful anonymous public read test.
- Successful authenticated owner write test.
- Failed cross-tenant read/write test.

A successful CLI link alone is not proof that the application is correctly connected. Runtime read/write and isolation tests are required.
