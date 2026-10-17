# CMS OPERATION TRACE & FORENSIC PIPELINE ANALYSIS
**System:** CP Splash CMS → Media Storage → Placements → Publication → Storefront  
**Project Ref:** `efvvczmopacoroudzfnl` | **Tenant:** `42d36cee-4cd6-43d1-af5d-334e5a07e37c`  
**Timestamp:** 2026-10-17T14:16:33.329Z

---

## 1. Trace Overview & Architecture

The CP Splash publication pipeline consists of 5 deterministic, fail-closed stages:
```
[CMS Client] 
   │
   ▼ (Step 1: Authenticated Session & Tenant Selection)
[Tenant Membership Gate] -> Fails closed if user is unauthenticated or not active tenant staff
   │
   ▼ (Step 2: Upload to Supabase Storage)
[Storage: cp-public] -> Enforces bucket_id='cp-public', folder depth=2, MIME types (JPEG, PNG, WebP, GIF, MP4, WebM)
   │
   ▼ (Step 3: Persist Metadata)
[media_assets] -> Concrete DB row; rollback/compensation deletes Storage object on insert error
   │
   ▼ (Step 4: Media Linking & Placements)
[product_media / media_placements] -> Database trigger checks tenant consistency & cross-tenant bounds
   │
   ▼ (Step 5: Universal Publication Gate)
[productsService.validateProductPublication] -> Mandatory pre-condition check:
      - Product status 'published' requires active qualifying primary media in cp-public
      - Video cannot be primary product media
      - All entities must belong to active tenant
```

---

## 2. Step-by-Step Stage Verification

### Step 1: CMS Tenant & Product Selection
- **Enforcement Layer:** `src/auth/AdminAuthContext.tsx`, `src/services/adminService.ts`, Supabase RLS `has_tenant_role`.
- **Observed Behavior:**
  - Non-authenticated requests fail closed.
  - Active tenant is derived from authoritative context (`VITE_CP_SPLASH_TENANT_ID`), strictly preventing client override.
  - Test result: `tests/media_service_contract.test.ts` Section D passed.

### Step 2: Supabase Storage Upload
- **Enforcement Layer:** `storage.buckets` definition & `storage.objects` RLS policies.
- **Observed Behavior:**
  - Bucket: `cp-public` (public read, authenticated write).
  - Allowed MIME types: `ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']`.
  - Max file size: 30 MiB.
  - Path structure:
    - Product media: `products/{productId}/{filename}` (array length 2)
    - Standalone media: `media/{tenantId}/{filename}` (array length 2)
  - Unauthorized MIME types (e.g. `application/pdf`, `text/plain`) are rejected prior to or during storage write.
  - Test result: `tests/media_pipeline_placements.test.ts` Tests 1a, 1b, 2, 3, 4, 16a-d passed.

### Step 3: Metadata Persistence (`media_assets`)
- **Enforcement Layer:** `public.media_assets` table & `src/services/mediaService.ts`.
- **Observed Behavior:**
  - Persists `tenant_id`, `bucket`, `path`, `filename`, `mime_type`, `media_type`, `status`, `size_bytes`.
  - Compensation guarantee: If DB metadata insert fails, the newly uploaded storage object is deleted immediately from `cp-public` to prevent dangling orphaned files.
  - Re-upload idempotency: Re-uploading identical file returns existing asset without duplicate inserts.
  - Test result: `tests/media_pipeline_placements.test.ts` Tests 6, 7, 8 passed.

### Step 4: Link Media & Create Placement
- **Enforcement Layer:** `public.product_media`, `public.media_placements`, and DB triggers.
- **Observed Behavior:**
  - `setPrimaryMedia` marks target asset as `is_primary = true` and unsets prior primary media atomically.
  - Placement table stores `scope_type` (`homepage_hero`, `product_menu`, `funnel`, etc.), `sort_order`, `active`.
  - DB Trigger `check_media_placement_tenant_consistency` validates that `media_id` belongs to the placement's `tenant_id`.
  - Deletion of placement leaves the shared `media_assets` row intact.
  - Test result: `tests/media_pipeline_placements.test.ts` Tests 9a, 9b, 10a, 10b, 11, 12a, 12b passed.

### Step 5: Universal Product Publication Gate
- **Enforcement Layer:** `src/services/productsService.ts` (`validateProductPublication`).
- **Observed Rules:**
  - Product cannot transition to `published` without an active primary media link in `product_media`.
  - Referenced media asset must reside in `cp-public` and belong to current tenant.
  - Primary media asset cannot be a video (`media_type = 'video'`).
  - Draft and archived status transitions do not require media.
  - Test result: `tests/product_publication_gate.test.ts` 24/24 tests passed.

---

## 3. Discovered Vulnerabilities & Forensic Gaps

1. **Trigger Gap in `check_media_placement_tenant_consistency`:**
   - The PL/pgSQL function regex checks:
     ```sql
     IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL
        AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
     ```
   - If a caller supplies a malformed non-null `scope_id` (e.g. `"not-a-uuid"`), the condition silently evaluates to FALSE, skipping campaign tenant ownership verification rather than raising an exception.
   - Recommended resolution: Change trigger logic to raise `EXCEPTION 'Invalid scope_id format for campaign scope'` if `scope_id` fails UUID regex.

2. **Anonymous Analytics Event Permission Conflict:**
   - Migration `20261011005429` revoked INSERT on all public tables from `anon` except `sales_leads`.
   - Storefront routes attempt to invoke `analyticsService.trackEvent()`, generating client-side HTTP 401 errors.
   - Recommended resolution: Either grant `INSERT` on `public.analytics_events` to `anon` with strict RLS, or encapsulate analytics in an edge function / RPC, or handle 401 silently without throwing uncaught page errors.

3. **Production Deployment Commit Mismatch:**
   - Production Vercel is deployed from commit `5c6185f` (Oct 10 2026), missing 10 migrations and all HOEOS R1-R6 repairs.
