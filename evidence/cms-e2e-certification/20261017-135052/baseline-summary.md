# HOEOS PHASE G0: CURRENT STATE BASELINE REPORT
**Timestamp (UTC):** 2026-10-17T13:00:38.813Z  
**Repository Path:** `c:\Projects\cp-splash`  
**Git Branch:** `detached`  
**Git HEAD Commit:** `b57faf7eea479c72b5046de9eb3549f6e84d49aa`  
**Supabase Project Ref:** `efvvczmopacoroudzfnl`  
**Primary Tenant ID:** `42d36cee-4cd6-43d1-af5d-334e5a07e37c`  
**Vercel Project:** `cp-splash` (`prj_7c7TOz3fJfkKW9glWZ4zbvCvovPL`)  
**Node Version:** `v20.20.2` | **NPM Version:** `10.8.2`

---

## 1. Working Tree & Git Status
- **HEAD Status:** Detached at `b57faf7eea479c72b5046de9eb3549f6e84d49aa`
- **Modified Tracked Files (3):**
  - `package.json` (added `ws` devDependency)
  - `package-lock.json`
  - `src/types/database.types.ts` (added optional `poster_url` to MediaAsset interface)
- **Untracked Files (4):**
  - `evidence/r7-decode-test-1792190841660.json`
  - `evidence/r7-upload-test-1792190723489.json`
  - `scripts/test-decode-all-formats.mjs`
  - `scripts/test-upload-all-formats.mjs`

## 2. Recent Git Commits (Last 10)
- `b57faf7eea479c72b5046de9eb3549f6e84d49aa | 2026-10-16 23:28:26 +0100 | Amend: Certification reports with sealed state reconciliation`
- `819b6e99dc729001100b7e4c0532421b88ae4684 | 2026-10-16 23:27:00 +0100 | R6-D: Add transient scripts and Supabase CLI config to .gitignore`
- `91456617757208955b4608ffc8f9b362942c1850 | 2026-10-16 23:26:46 +0100 | R6-C: Commit CertificationPage modification`
- `d4f81a8e5ee4a97b432a835852a0618f2f840533 | 2026-10-16 23:17:33 +0100 | R6-B: Archive prior-session forensic evidence and documentation`
- `6256aaa8de694bb4c76c679091054144a67f8972 | 2026-10-16 23:17:10 +0100 | R6-A: Seal certified runtime state and evidence`
- `0c424c9771e6afc27feac3bf676f8f37d75ac4c4 | 2026-10-16 21:20:16 +0100 | Certify: Complete HOEOS E2E Image Pipeline Certification & Factory Asset Extraction (R1-R5)`
- `79bc7e5b84a50bb6d43253c435dae8efd93b3b13 | 2026-10-16 21:19:22 +0100 | R5: Blog featured image resolution and SEO meta injection`
- `a934bde91844981699e4fff09444b77dae426917 | 2026-10-16 21:05:35 +0100 | R4: Polymorphic funnel media pipeline certification`
- `5ef3d33bd4938867cb02f32c3ba0b3321d40d18d | 2026-10-16 20:52:26 +0100 | R2: Re-upload valid fixtures to cp-public storage`
- `3f60f2f7b5d9aba6ae4d9953035f38736acd019f | 2026-10-16 20:48:19 +0100 | R1: Regenerate media fixtures with valid bytes`

## 3. Migration Inventory Summary
- **Total Local SQL Migrations:** 25
- Inventory persisted to `migration-inventory.csv` with versions, byte sizes, and SHA-256 hashes.

## 4. TypeScript Configuration & Scope Analysis
- **Config file:** `tsconfig.json`
- **Included files:** `src/**/*`
- **Excluded files:** `["node_modules", "dist", "evidence", "supabase", "tests", "scripts"]`
- **Finding:** As flagged by HOEOS, `tests/` and `scripts/` are intentionally excluded from the main application `tsc` run to prevent vite/browser/node type collisions. Tests are executed via `tsx` or Node runners directly.

## 5. Test Suite Inventory
- Registered test files: 11 files in `tests/`
- Key test suites:
  - `tests/media_service_contract.test.ts`
  - `tests/media_pipeline_placements.test.ts`
  - `tests/product_publication_gate.test.ts`
  - `tests/e2e_cms_storage_storefront.cjs`
  - `tests/e2e_five_funnels_certification.cjs`
  - `tests/probe_round_trip.cjs`
  - `tests/probe_auth_chain.cjs`
  - `tests/probe_media_animation.cjs`

## 6. Gate G0 Status
- **STATUS:** **PASS**
- All required baseline artifacts captured under `evidence/cms-e2e-certification/20261017-135052/`:
  - `baseline.json`
  - `git-status.txt`
  - `git-diff-stat.txt`
  - `migration-inventory.csv`
  - `file-hashes.csv`
  - `environment-identity.json`
  - `test-inventory.txt`
  - `baseline-summary.md`
