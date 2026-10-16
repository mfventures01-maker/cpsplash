# CP SPLASH SCHEMA GAP MATRIX: CURRENT VS. TARGET

**Specification Reference:** `docs/schema/target-end-to-end.md`  
**Date:** 2026-10-15  
**Audit Context:** CP Splash Publishing System Certification

---

## 1. Domain Object Gap Analysis

| Domain Area | Current Production State | Target Specified State | Gap Status | Resolution Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Media Placements Table** | Non-existent in production (`pg_class` = 0) | `public.media_placements` with tenant cascade, check constraints on 8 scopes, and performance indexes | **Gap 3.1** | Apply `20261014000001_media_placements_table.sql` in Staging. |
| **Placement Modtime Trigger** | Non-existent | Trigger updating `updated_at = NOW()` on `media_placements` | **Gap 3.1b** | Apply `20261014000002_media_placements_modtime.sql` in Staging. |
| **Cross-Tenant Placement Integrity** | Non-existent | Trigger enforcing `media_assets.tenant_id == media_placements.tenant_id` and verifying campaign/journey tenant matches | **Gap 3.1c** | Apply `20261014000003_media_placements_integrity.sql` in Staging. |
| **Placement Row-Level Security** | Non-existent | Public read for active placements with active media; tenant admin `ALL` via `has_tenant_role` | **Gap 3.1d** | Apply `20261014000004_media_placements_rls.sql` in Staging. |
| **Storage Scoping for CMS Media** | Only `products/{productId}/*` policies exist (`cp_public_staff_*`) | Dedicated `cp_public_media_insert` and `cp_public_media_delete` on `storage.objects` for `media/{tenant_id}/*` | **Gap 3.3** | Apply `20261014000005_cp_public_storage_scope.sql` in Staging. |
| **Placement Resolution View / RPC** | Frontend queries `placementService.ts` with direct PostgREST join | Evaluated in Phase 2: PostgREST join `.select('*, media_assets(*)')` is fully functional and type-safe | **No Gap** | Decision: Retain frontend PostgREST join; extra DB view is not required. |
| **Storage Namespaces for Non-Media** | No direct storage folders for `homepage/`, `menu/`, etc. | Physical files reside in `media/{tenant_id}/*`; logical assignment via `media_placements` | **Resolved by Design** | No new storage folders required. Media is referenced by scope key. |
| **Product Publication Gate** | Application-level validation enforced in `productsService.ts` | Fails closed on draft, missing media, foreign tenant, wrong bucket, non-image MIME | **Fully Implemented** | Retain verified application gate; triggers designed for staging review. |

---

## 2. Summary of Migrations Required to Close Gaps

The 5 atomic split migrations already drafted in `supabase/migrations/` completely cover Gaps 3.1 through 3.3 without introducing unnecessary or redundant database objects:

1. `20261014000001_media_placements_table.sql`
2. `20261014000002_media_placements_modtime.sql`
3. `20261014000003_media_placements_integrity.sql`
4. `20261014000004_media_placements_rls.sql`
5. `20261014000005_cp_public_storage_scope.sql`

No additional schema gaps exist.
