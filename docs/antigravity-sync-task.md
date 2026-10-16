# MISSION: CP SPLASH — DETERMINISTIC SCHEMA / CMS / STOREFRONT SYNCHRONIZATION

You are operating in `C:\Projects\cp-splash`. This is a React + TypeScript + Vite + Tailwind frontend against a Supabase (PostgreSQL + Storage + Auth + PostgREST) backend. The system is CP Splash, a multitenant commerce + CMS platform.

Your task is to bring the schema, the CMS, and the public storefront into **verified synchronization** — such that a write through the CMS produces a row that the storefront renders, with no assumptions, no mocks, and no silent failures.

You must operate strictly under the HOEOS methodology:
- Evidence Before Assumption
- Verify Before Change
- Root Cause Before Repair
- Preserve Production
- Evidence Classification (STATIC / STRUCTURAL / RUNTIME / CERTIFICATION)

Read this entire prompt before executing anything. Follow the phases in order. Do not skip phases. Do not apply anything to production without an explicit human authorization gate.

---

## 1. CERTIFIED BASELINE — WHAT IS TRUE (Do Not Re-Litigate)

The following has been verified with evidence and is **frozen**. Do not re-investigate these facts. Do not "improve" them. Do not modify the objects they describe unless a phase explicitly authorizes it.

### 1.1 Production project
- Project ref: `efvvczmopacoroudzfnl` (ECOMMERCE, Central EU Frankfurt)
- Supabase URL: `https://efvvczmopacoroudzfnl.supabase.co`
- Tenant `cp-splash`: `42d36cee-4cd6-43d1-af5d-334e5a07e37c`
- Tenant `linos-e-security`: `b765e32e-188f-470e-9054-43ec9abf0b77`

### 1.2 Migration ledger (24 entries)
The production `supabase_migrations.schema_migrations` contains 24 recorded migrations:
- 10 certified from the original deployment (`20261001093826` … `20261011011157`)
- 8 repaired into the ledger after reconstruction (`20261011000001` … `20261011000008`)
- 6 applied via `supabase db push` (`20261014000000` … `20261014000005`)
- 1 policy-only migration applied directly via Studio and repaired into the ledger (`20261016000001`)

The repository's `supabase/migrations/` directory is the source of truth for future applies. Do not rewrite any of these files.

### 1.3 Storage policies on `storage.objects` (cp-public bucket)
Seven policies, all `{authenticated}`, all verified byte-identical to their certified predicate:

Products prefix:
- `cp_public_staff_insert` (INSERT, `products/{productId}/...`, depth = 2, `has_tenant_role(products.tenant_id, [owner, admin, editor, manager])`)
- `cp_public_staff_select` (SELECT, same predicate)
- `cp_public_staff_update` (UPDATE, same predicate, USING + WITH CHECK)
- `cp_public_staff_delete` (DELETE, same predicate)

Media prefix:
- `cp_public_media_insert` (INSERT, `media/{tenantId}/...`, depth = 2, tenant UUID regex, `has_tenant_role(foldername[2]::uuid, [owner, admin, editor, manager])`)
- `cp_public_media_select` (SELECT, same predicate)
- `cp_public_media_update` (UPDATE, same predicate, USING + WITH CHECK)
- `cp_public_media_delete` (DELETE, same predicate)

Media-asset anchored:
- `cp_public_cms_delete` (DELETE, `EXISTS (SELECT 1 FROM media_assets ma WHERE ma.bucket = 'cp-public' AND ma.path = objects.name AND has_tenant_role(ma.tenant_id, [...])`)

**Do not add, drop, or alter any of these policies unless a Phase explicitly authorizes it and requires a new migration.**

### 1.4 Table schema (public schema)
Certified and live. Includes all tables created by the 24 migrations, plus the sales subsystem (`sales_territories`, `sales_offers`, `sales_journeys`, `sales_leads`, `sales_questions`) and the placements subsystem (`media_placements`).

Key tables for this task:
- `products` (tenant_id, name, slug, sku, description, status, metadata, …)
- `product_variants` (tenant_id, product_id, name, volume, status, …)
- `price_lists` (tenant_id, name, currency, price_type, status, …)
- `product_prices` (tenant_id, price_list_id, variant_id, amount, status, …)
- `media_assets` (tenant_id, bucket, path, media_type, mime_type, filename, size_bytes, width, height, alt_text, caption, status, …)
- `product_media` (product_id, media_id, sort_order, is_primary)
- `media_placements` (tenant_id, media_id, placement_key, scope_type, scope_id, sort_order, active, alt_text_override)

### 1.5 Helper functions
- `public.has_tenant_role(uuid, text[])` — `SECURITY DEFINER`, `STABLE`, `SET search_path = ''`, owner = `postgres`. Verified byte-identical to certified definition.
- `public.is_tenant_member(uuid)` — same pattern.

### 1.6 Frontend (certified)
- `src/lib/supabase.ts` — single authoritative client, `persistSession: true`, `autoRefreshToken: true`, exports `TENANT_ID` and `supabase`
- `src/services/mediaService.ts` — uploads to `media/{TENANT_ID}/...`, validates MIME types, enforces animation size limit, uses `upsert: true`
- `src/services/placementService.ts` — resolves placements via PostgREST join `.select('*, media_assets(*)')`
- `src/services/productsService.ts` — product CRUD with publication gate
- Admin routes at `/admin/*` render CMS components; public routes at `/`, `/products/*`, `/sports`, etc. render storefront

### 1.7 Evidence directory
`evidence/G6-20261015-114143/` contains:
- `authorization.txt` (signed production apply authorization)
- `linked-project.txt`
- `push-complete.txt`
- `manifest.csv` (SHA256 of every evidence file)
- `production-before/` (ledger, tables, storage policies pre-apply)
- `production-after/` (post-apply snapshots)

These are immutable evidence artifacts. Do not modify them. Append new evidence in separate timestamped folders.
