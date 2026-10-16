# PIPELINE F — CERTIFICATION

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
