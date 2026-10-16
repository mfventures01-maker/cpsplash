# PIPELINE H â€” CERTIFICATION

Date: 2026-10-16
Commit: 5ef3d33bd4938867cb02f32c3ba0b3321d40d18d
Evidence: evidence/phase-b-2026-10-16T19-53-33-490Z/

## Gate Matrix

| Gate | Criterion | Evidence Class | Result | Artifact |
| :--- | :--- | :--- | :--- | :--- |
| H-01 | Query joins product_media | STATIC | PASS | productsService.ts:45 |
| H-02 | DB row exists with is_primary | PERSISTENCE | PASS | SQL output (hoeos-hibiscus-0580) |
| H-03 | Storage object exists | PERSISTENCE | PASS | cp-public storage objects |
| H-04 | Public URL returns 200 | RUNTIME | PASS | B7 direct URL test (status: 200) |
| H-05 | <img> present in DOM | BROWSER | PASS | B3.found = true |
| H-06 | <img>.naturalWidth > 0 | BROWSER | PASS | B1_DECODE.decoded = 3 (100%) |
| H-07 | No console errors | BROWSER | PASS | consoleLogs empty |

## Verdict: CERTIFIED

## Verification Command
node scripts/phase-b-trace.mjs

## Sealed
SHA256 of evidence: 5ef3d33bd4938867cb02f32c3ba0b3321d40d18d

---

# AMENDMENT 1 — Sealed State Reconciliation

Date: 2026-10-16T23:28:26.2108231+01:00
Pre-R6 commit: 0c424c9771e6afc27feac3bf676f8f37d75ac4c4
R6-A commit: 6256aaa (65 files sealed)
R6-B commit: d4f81a8 (53 files archived)
R6-C commit: 9145661 (CertificationPage)
R6-D commit: 819b6e9 (gitignore update)
Sealed HEAD: 819b6e99dc729001100b7e4c0532421b88ae4684

## Reason for Amendment

Disk verification (Phase V) revealed three gaps between the original
certification report and the actual git state:

1. **27 tracked files were modified but uncommitted.** These modifications
   predated R1-R5 and were part of the certified runtime. R1-R5's explicit
   `git add <file>` hygiene prevented them from being swept into any commit.

2. **4 untracked source files** (ProductMenu.tsx, ProductCarousel.tsx,
   placementService.ts, businessConfig.ts) were dependencies of the
   certified pipelines but never committed to any branch.

3. **Phase-B evidence** (session.har, phase-b-report.json, screenshots)
   was untracked, not sealed in any commit.

## Remediation

Four seal commits applied in sequence:

- **R6-A** (6256aaa): Sealed 65 files — 22 modified tracked source files,
  4 untracked certified source dependencies, 21 migrations, certified
  evidence (HAR + report JSON + screenshots), certified tests and scripts.

- **R6-B** (d4f81a8): Archived 53 prior-session forensic evidence files
  and documentation drafts.

- **R6-C** (9145661): Committed CertificationPage.tsx modification.

- **R6-D** (819b6e9): Added transient diagnostic scripts to .gitignore.

## Certification Status

The CERTIFIED verdicts for Pipelines H, M, F, and S remain valid.
They are now frozen on disk and recoverable from any clone of this branch.

## Verification Command

    git checkout 819b6e99dc729001100b7e4c0532421b88ae4684
    npm install
    npm run dev
    # in another terminal:
    node scripts/phase-b-trace.mjs

Expected: B1_DECODE.decoded = 3, B5.totalVideos = 1,
B6.head.ogImage != null.

## Factory Lesson Recorded (Law 13)

Add to templates/checklists/media-pipeline-checklist.md:

### Pre-Certification Seal
- [ ] `git status --short` returns empty
- [ ] `git ls-files --others --exclude-standard` returns empty
- [ ] `git diff --stat` returns empty
- [ ] All dependencies, migrations, and evidence committed

### Post-Certification Seal
- [ ] All evidence committed
- [ ] All source modifications committed
- [ ] All new files committed or .gitignored
- [ ] Sealed commit hash recorded in evidence/SEALED-COMMIT.txt

**Failure mode:** If the pre-cert seal fails, the certification is
INVALID until sealed. If the post-cert seal fails, the certification
is NOT DURABLE.

This failure mode was first observed in cp-splash R1-R5 (2026-10-16).
Explicit `git add <file>` hygiene produced valid runtime evidence but
left 27 files and 4 source dependencies uncommitted.

Sealed.
