# HOEOS: G0-G4 Read-Only Evidence Collection & Forensic Discrepancy Report

**Timestamp (UTC):** 2026-10-17T19:50:00Z  
**Repository:** \`C:\\Projects\\cp-splash\`  
**Supabase Project Ref:** \`efvvczmopacoroudzfnl\`  
**Primary Tenant:** \`42d36cee-4cd6-43d1-af5d-334e5a07e37c\`  
**Evidence Package Directory:** \`evidence/cms-e2e-certification/20261017-194126/\`  

---

## 1. Executive Summary: The Remote-to-Local Resolution

The GitHub connector was unable to resolve commit \`b57faf7\` or branch \`hoEOS-repair-20261016-203717\` because **neither has ever been pushed to the remote repository**.

1. **Local State:**
   - The branch \`hoEOS-repair-20261016-203717\` exists locally and points to \`b57faf7eea479c72b5046de9eb3549f6e84d49aa\`.
   - HEAD is detached at \`b57faf7eea479c72b5046de9eb3549f6e84d49aa\`.
   - Local \`main\` points to \`9861b0d\`, which is 3 commits ahead of \`origin/main\`.
   - Branch \`hoEOS-repair-20261016-203717\` is 10 commits ahead of local \`main\` (13 commits ahead of \`origin/main\`).

2. **Remote State (\`origin\` -> \`https://github.com/mfventures01-maker/cpsplash.git\`):**
   - \`origin/main\` is at \`5c6185f4007591866eac7153ab9123b0d091cecf\` (dated 2026-10-10).
   - Only two branch refs exist on remote: \`refs/heads/main\` (\`5c6185f\`) and \`refs/heads/fix/cp-splash-cms-media-upload\` (\`22abdcbd\`).
   - Neither \`b57faf7\` nor \`hoEOS-repair-20261016-203717\` exists on GitHub.

3. **Vercel Production State:**
   - Production deployment at \`https://cp-splash-nine.vercel.app\` is linked to GitHub \`origin/main\` and is serving the static bundle built on **2026-10-10** from commit \`5c6185f\`.
   - It is missing all subsequent database migrations and code repairs (R1–R6).

---

## 2. Working Tree Baseline

- **HEAD SHA:** \`b57faf7eea479c72b5046de9eb3549f6e84d49aa\`
- **Staged Diffs:** 0 bytes (clean index).
- **Unstaged Diffs:**
  - \`package.json\`: devDependency \`"ws": "^8.22.0"\` added.
  - \`package-lock.json\`: updated corresponding lockfile.
  - \`src/types/database.types.ts\`: added optional \`poster_url?: string;\` to \`MediaAsset\` interface.
- **Untracked Files:**
  - \`evidence/cms-e2e-certification/\`
  - \`evidence/r7-decode-test-1792190841660.json\`
  - \`evidence/r7-upload-test-1792190723489.json\`
  - \`scripts/test-decode-all-formats.mjs\`
  - \`scripts/test-upload-all-formats.mjs\`

---

## 3. Live Database Forensic Audit (Supabase \`efvvczmopacoroudzfnl\`)

### 3.1 Function \`check_media_placement_tenant_consistency()\`
- **Execution Context:** Language PL/pgSQL, \`SECURITY INVOKER\` (\`prosecdef = false\`), volatile.
- **Discovered Defect:** The function contains an explicit logic bypass:
  \`\`\`sql
  IF NEW.scope_type = 'campaign' AND NEW.scope_id IS NOT NULL
     AND NEW.scope_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
  \`\`\`
  When \`NEW.scope_id\` is non-null but not a valid UUID (e.g. \`"invalid-id"\`), the regex test fails and the entire \`IF\` block is skipped. As a result, the trigger silently allows the insert without validating that the referenced campaign belongs to the same tenant.

### 3.2 Trigger Bindings
- \`trigger_media_placement_tenant_consistency\`: \`BEFORE INSERT\` on \`public.media_placements\`.
- \`trigger_media_placement_tenant_consistency\`: \`BEFORE UPDATE\` on \`public.media_placements\`.
- \`trigger_media_placements_modtime\`: \`BEFORE UPDATE\` on \`public.media_placements\` (\`update_media_placements_modtime()\`).

### 3.3 Table \`public.analytics_events\`
- **Table Info:** RLS is enabled (\`rowsecurity = true\`).
- **Grants:** Granted to \`postgres\`, \`authenticated\`, \`service_role\`. **NO GRANTS TO \`anon\`**.
- **RLS Policies:**
  - \`analytics_public_insert\`: \`FOR INSERT TO anon, authenticated WITH CHECK ((tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid) AND (event_name = ANY (ARRAY['page_view'::text, 'territory_selected'::text, ...])))\`
  - \`analytics_staff_select\`: \`FOR SELECT TO authenticated USING (has_tenant_role(...))\`
- **Forensic Diagnosis:**
  Even though the RLS policy permits \`anon\`, PostgreSQL evaluates table-level grants first. Because migration \`20261011005429\` revoked table privileges from \`anon\` on all tables except \`sales_leads\`, \`anon\` callers are rejected at the table permission layer with **HTTP 401 Unauthorized** before RLS is evaluated.

---

## 4. Source-to-Production Discrepancy Matrix

| Component | Local Source | Production Remote | Severity | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Git Remote** | \`hoEOS-repair-20261016-203717\` (\`b57faf7\`) | Origin at \`5c6185f\`; repair branch missing | **HIGH** | Remote connector cannot see certified commit. |
| **Vercel** | Bundle \`index-DvzIpLMj.js\` from \`b57faf7\` | Bundle \`index-DimlsVZL.js\` from \`5c6185f\` | **CRITICAL** | Production storefront serves outdated code. |
| **Placement Trigger** | Expected fail-closed validation | Silent skip on non-UUID \`scope_id\` | **MEDIUM** | Malformed campaign/journey scope IDs bypass checks. |
| **Analytics Grants** | Storefront calls \`trackEvent()\` | \`anon\` lacks SQL table \`INSERT\` privilege | **HIGH** | Browser console logs HTTP 401 on every public route. |
| **Migration Ledger** | 25 local migration files | 24 ledger records (reconciled) | **LOW** | Legacy baseline archived; 20261014 split into 01-05. |

---

## 5. Proposed Repairs (R8-A and R8-B)

### Proposed R8-A: Placement Trigger Hardening
File: \`proposed_R8A_harden_placement_scope_validation.sql\`
- Validates UUID syntax explicitly when \`scope_id IS NOT NULL\`.
- Raises an immediate exception (\`'Malformed campaign scope_id...'\`) if malformed, preventing silent validation bypass.

### Proposed R8-B: Anonymous Analytics Event Grant
File: \`proposed_R8B_grant_anon_analytics_events_insert.sql\`
- Grants \`INSERT\` on \`public.analytics_events\` to \`anon\`.
- Leaves \`SELECT\`, \`UPDATE\`, \`DELETE\` strictly revoked.
- Preserves tenant-restricted RLS check.

---

## 6. SHA-256 Checksum Manifest
All evidence files have been cataloged with SHA-256 hashes in [sha256-manifest.txt](file:///c:/Projects/cp-splash/evidence/cms-e2e-certification/20261017-194126/sha256-manifest.txt).
