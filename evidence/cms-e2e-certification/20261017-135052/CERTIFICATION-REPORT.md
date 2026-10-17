# HOEOS MASTER CERTIFICATION REPORT
## CP SPLASH: CMS → MEDIA → PLACEMENT → PUBLICATION → STOREFRONT CERTIFICATION

**Operating Mode:** Forensic Verification First, Deterministic Execution  
**Project:** CP Splash  
**Repository:** \`C:\\Projects\\cp-splash\`  
**Supabase Project Ref:** \`efvvczmopacoroudzfnl\`  
**Primary Tenant:** \`42d36cee-4cd6-43d1-af5d-334e5a07e37c\`  
**Timestamp (UTC):** 2026-10-17T15:20:00Z  
**Evidence Directory:** \`evidence/cms-e2e-certification/20261017-135052/\`  

---

## A. CERTIFICATION SUMMARY

| Metric | Result / Status | Notes |
| :--- | :--- | :--- |
| **Overall Decision** | **NOT CERTIFIED** | Mandatory acceptance criteria failed due to deployment mismatch & DB trigger gap |
| **Gate G0 (Baseline Capture)** | **PASS** | 8 baseline forensic artifacts captured and verified |
| **Gate G1 (Migration Reconciliation)** | **PASS** | 25 live migrations reconciled; historical legacy & bak files verified |
| **Gate G2 (Live Schema & Auth)** | **FAIL** | Trigger silently skips non-UUID scope_ids; anon analytics_events missing INSERT grant |
| **Gate G3 (CMS Write Pipeline)** | **PASS** | 111/111 unit & service tests passed across isolated harnesses |
| **Gate G4 (Storefront & 5 Funnels)** | **BLOCKED** | Deployed Vercel site is running stale commit \`5c6185f\` from 2026-10-10 |
| **Total Checks Passed** | **123** | 111 unit/contract tests + 12 static/schema/build checks |
| **Total Checks Failed** | **2** | 1 DB trigger regex skip defect + 1 anon analytics_events 401 error |
| **Total Checks Blocked** | **1** | Production Vercel deployment certification |
| **Total Checks Not Run** | **0** | All scheduled checks were executed |
| **Production Mutations Performed** | **0** | Strict read-only verification; zero rows/files mutated |
| **Local Code Files Modified** | **0** | Working tree preserved; all test scripts placed in scratch artifact path |
| **Deployment Modified** | **No** | Zero unauthorized production deployments executed |

---

## B. CMS PIPELINE MATRIX

| Stage | Required Evidence | Result | Evidence Reference |
| :--- | :--- | :--- | :--- |
| **Authenticated Tenant Selection** | Identity & tenant-boundary tests | **PASS** | \`tests/media_service_contract.test.ts\` (Section D) |
| **Storage Upload** | Allowed and denied upload tests | **PASS** | \`tests/media_pipeline_placements.test.ts\` (Tests 1a, 1b, 2, 3, 4, 16a-d) |
| **Metadata Persistence** | Read-after-write & failure compensation | **PASS** | \`tests/media_pipeline_placements.test.ts\` (Tests 6, 7, 8, 18) |
| **Media Relationship & Placement** | Integrity, primary media, & cross-tenant | **PASS** | \`tests/media_pipeline_placements.test.ts\` (Tests 9a, 9b, 10a, 11, 15a-c) |
| **Publication Gate** | Universal publication gate positive & negative | **PASS** | \`tests/product_publication_gate.test.ts\` (24/24 tests passed) |
| **Homepage Consumption** | Browser and API evidence | **PASS (Local) / FAIL (Vercel)** | Local: \`screenshots-local/desktop_r_home.png\` / Vercel: HTTP 401 on analytics |
| **Product Menu / Carousel** | Browser and API evidence | **PASS** | \`screenshots/desktop_r_menu.png\` (100% clean render, 0 broken images) |
| **Product Details View** | Browser and API evidence | **PASS (Local) / FAIL (Vercel)** | Local: \`screenshots-local/desktop_r_detail.png\` / Vercel: HTTP 401 on analytics |
| **Funnel 1 (Sports & Athletics)** | Independent route evidence | **PASS (Local) / FAIL (Vercel)** | Local: 1 image, polymorphic video / Vercel: 0 images, stale bundle |
| **Funnel 2 (Parties & Events)** | Independent route evidence | **PASS (Local) / FAIL (Vercel)** | Local: 1 image, qualification form / Vercel: 0 images, stale bundle |
| **Funnel 3 (Hotels & Hospitality)** | Independent route evidence | **PASS (Local) / FAIL (Vercel)** | Local: qualification form & WhatsApp CTA / Vercel: stale bundle |
| **Funnel 4 (Schools & Campuses)** | Independent route evidence | **PASS (Local) / FAIL (Vercel)** | Local: qualification form & WhatsApp CTA / Vercel: stale bundle |
| **Funnel 5 (Individuals & Orders)** | Independent route evidence | **PASS (Local) / FAIL (Vercel)** | Local: bottle selection & direct WhatsApp / Vercel: stale bundle |

---

## C. DETAILED GATE FINDINGS

### 1. Gate G0: Baseline Capture (PASS)
- Captured complete Git status, detached HEAD at \`b57faf7eea479c72b5046de9eb3549f6e84d49aa\`.
- All 25 SQL migrations cataloged with version, byte size, and SHA-256 hashes in \`migration-inventory.csv\`.
- TypeScript compiler scope verified: \`src/**/*\` included; tests and scripts intentionally isolated to avoid Node/DOM environment pollution.
- Working tree preserved with 0 staged files.

### 2. Gate G1: Migration Reconciliation (PASS)
- Reconciled live production \`supabase_migrations.schema_migrations\` (24 recorded entries) against local migration ledger.
- Historical \`20260929000000_cp_splash_schema.sql\` verified as safely archived in \`evidence/legacy/\`; never applied to production. Production correctly initialized from \`20261001093826_create_multi_tenant_ecommerce_engine.sql\`.
- Monolithic \`20261014000000_media_placements.sql\` verified as local NO-OP placeholder (\`SELECT 1;\`), with active schema delivered by atomic migrations \`20261014000001\` through \`20261014000005\` and original archived in \`evidence/superseded/\`.
- Full reconciliation ledger recorded in \`migration-reconciliation.csv\`.

### 3. Gate G2: Live Schema and Authorization Audit (FAIL)
1. **Defect G2-A (Trigger Scope Validation Bypass):**
   - In \`check_media_placement_tenant_consistency()\`:
     \`\`\`sql
     IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL
        AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
     \`\`\`
   - When \`NEW.scope_id\` is non-null but not a valid UUID (e.g. \`"invalid-id"\`), the condition evaluates to FALSE, silently bypassing campaign and sales-journey ownership checks.
   - Criterion 5 of Phase G2 ("Rejects malformed non-null scope IDs instead of silently skipping ownership validation") failed.
2. **Defect G2-B (Anonymous Analytics Permission Conflict):**
   - Migration \`20261011005429\` revoked INSERT from \`anon\` across all public tables except \`sales_leads\`.
   - Storefront components call \`analyticsService.trackEvent()\`, generating HTTP 401 Unauthorized errors in browser consoles across all public pages.

### 4. Gate G3: CMS Write Pipeline Certification (PASS)
- **Static & Animated Media Upload:** Verified JPEG, PNG, animated GIF, and WebP handling with exact MIME preservation.
- **Fail-Closed Compensation:** Verified that metadata DB insert failures immediately delete uploaded objects from \`cp-public\` Storage, leaving 0 orphaned files.
- **Cross-Tenant Isolation:** Rejection verified for cross-tenant media, campaigns, and sales journeys.
- **Universal Publication Gate:** Verified that \`validateProductPublication\` strictly blocks publishing products without qualifying primary images, blocks video as primary media, and operates with 0 database mutations upon rejection.
- All 111 isolated test cases passed across \`media_pipeline_placements.test.ts\`, \`media_service_contract.test.ts\`, \`product_publication_gate.test.ts\`, and \`verify-frontend-ssot.mjs\`.

### 5. Gate G4: Storefront & Funnels Certification (BLOCKED / CONDITIONAL)
- **Local Preview Server (\`http://localhost:4173\`):**
  - Product Menu (\`/shop\`): 100% PASS with 0 broken images and responsive catalog rendering.
  - Funnels 1-5: Correctly resolve polymorphic images/videos and render dynamic qualification forms and authoritative WhatsApp CTA links (\`https://wa.me/2348127700724\`).
- **Production Deployment (\`https://cp-splash-nine.vercel.app\`):**
  - Deployed bundle is \`index-DimlsVZL.js\` / \`index-BuL0fUUc.css\`, deployed on **2026-10-10** from commit \`5c6185f\`.
  - The live deployment predates database migrations \`20261011005429\`–\`20261016000001\` and HOEOS repairs R1-R6.
  - Results in console 401 errors on \`analytics_events\` and missing funnel media enhancements.

---

## D. OUTSTANDING BLOCKERS & REPAIR PLAN

### Blocker 1: Production Deployment Mismatch
- **Impact:** Production storefront at \`https://cp-splash-nine.vercel.app\` does not execute the certified code.
- **Root Cause:** Vercel was last deployed from commit \`5c6185f\` on Oct 10, 2026.
- **Minimum Corrective Action:**
  1. Authorize production Vercel deployment of HEAD commit \`b57faf7\` (or current sealed state).
  2. Verify deployment SHA matches git commit hash.
- **Production Authorization Required:** **YES (Deployment)**.

### Blocker 2: Malformed Scope ID Validation in Placement Trigger
- **Impact:** Invalid non-UUID scope IDs can be inserted without validating that the target campaign or sales journey belongs to the same tenant.
- **Root Cause:** Regex check in \`check_media_placement_tenant_consistency()\` wraps the existence query instead of asserting UUID validity first.
- **Proposed Migration DDL:**
  \`\`\`sql
  CREATE OR REPLACE FUNCTION public.check_media_placement_tenant_consistency()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $function$
  DECLARE
      v_asset_tenant_id UUID;
  BEGIN
      SELECT tenant_id INTO v_asset_tenant_id
      FROM public.media_assets
      WHERE id = NEW.media_id;

      IF v_asset_tenant_id IS NULL THEN
          RAISE EXCEPTION 'Referenced media asset % does not exist', NEW.media_id;
      END IF;

      IF v_asset_tenant_id <> NEW.tenant_id THEN
          RAISE EXCEPTION 'Tenant mismatch: placement tenant % does not match media asset tenant %',
              NEW.tenant_id, v_asset_tenant_id;
      END IF;

      IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL THEN
          IF NOT (NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
              RAISE EXCEPTION 'Malformed campaign scope_id: % is not a valid UUID', NEW.scope_id;
          END IF;
          IF NOT EXISTS (
              SELECT 1 FROM public.campaigns c
              WHERE c.id = NEW.scope_id::uuid AND c.tenant_id = NEW.tenant_id
          ) THEN
              RAISE EXCEPTION 'Referenced campaign % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
          END IF;
      END IF;

      IF NEW.scope_type = 'sales_journey' AND NEW.scope_id IS NOT NULL THEN
          IF NOT (NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
              RAISE EXCEPTION 'Malformed sales_journey scope_id: % is not a valid UUID', NEW.scope_id;
          END IF;
          IF NOT EXISTS (
              SELECT 1 FROM public.sales_journeys sj
              WHERE sj.id = NEW.scope_id::uuid AND sj.tenant_id = NEW.tenant_id
          ) THEN
              RAISE EXCEPTION 'Referenced sales journey % does not belong to tenant %', NEW.scope_id, NEW.tenant_id;
          END IF;
      END IF;

      RETURN NEW;
  END;
  $function$;
  \`\`\`
- **Production Authorization Required:** **YES (Database Migration)**.

### Blocker 3: Public Analytics Event 401 Permission Conflict
- **Impact:** Uncaught HTTP 401 errors logged to browser console on all public storefront pages.
- **Root Cause:** \`REVOKE INSERT ... FROM anon\` in migration \`20261011005429\` revoked anonymous event tracking.
- **Proposed Solution:** Either add explicit \`GRANT INSERT ON TABLE public.analytics_events TO anon;\` with tenant-scoped RLS check, or swallow analytics network rejections in \`analyticsService.trackEvent()\` so public browsing is unaffected.
- **Production Authorization Required:** **YES (Database Grant)** or local code change in \`analyticsService.ts\`.

---

## E. FINAL CERTIFICATION DECISION

**DECISION:** **NOT CERTIFIED**

**Justification:** Under the House of Oroh Engineering Operating System (HOEOS) Non-Negotiable Rules, no certification can be granted when:
1. The live deployment commit (\`5c6185f\`) does not match the code under certification (\`b57faf7\`).
2. Production database trigger \`check_media_placement_tenant_consistency()\` fails negative validation for malformed non-null scope IDs.
3. Unauthenticated public traffic experiences HTTP 401 console errors on analytics logging.

Once the three documented corrective actions are authorized and applied, re-running the automated suite will establish complete end-to-end certification.
