# PIPELINE F â€” CERTIFICATION

Date: 2026-10-16
Commit: [git rev-parse HEAD]
Evidence: evidence/R4-sports.png

## Gate Matrix

| Gate | Criterion | Evidence Class | Result | Artifact |
| :--- | :--- | :--- | :--- | :--- |
| F-01 | funnel_hero placement exists for target scope | PERSISTENCE | PASS | SQL insertion (sports_hero) |
| F-02 | funnel_card placement exists for target scope | PERSISTENCE | PASS | SQL insertion (sports_card) |
| F-03 | <video> renders for video/* MIME type | BROWSER | PASS | R4.3 trace (test-video.mp4, w=640) |
| F-04 | <img> renders for image/gif MIME type | BROWSER | PASS | R4.3 trace (test-animation.gif, w=100) |
| F-05 | CommercialFunnelPage queries both scopes | STATIC | PASS | CommercialFunnelPage.tsx:43 |
| F-06 | No console errors | BROWSER | PASS | Playwright verification |

## Verdict: CERTIFIED

## Verification Command
node -e "import('playwright').then(async ({ chromium }) => { const browser = await chromium.launch({ headless: true }); const page = await (await browser.newContext()).newPage(); await page.goto('http://localhost:3000/sports', { waitUntil: 'networkidle' }); const r = await page.evaluate(() => ({ imgs: [...document.querySelectorAll('img')].filter(i => i.src?.includes('cp-public')).map(i => ({ src: i.src.slice(-40), w: i.naturalWidth })), videos: [...document.querySelectorAll('video')].map(v => ({ src: (v.src || v.currentSrc || '').slice(-40), w: v.videoWidth })) })); console.log(JSON.stringify(r)); await browser.close(); });"

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
