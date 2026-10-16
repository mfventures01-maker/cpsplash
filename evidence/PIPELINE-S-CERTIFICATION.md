# PIPELINE S — CERTIFICATION

Date: 2026-10-16
Commit: [git rev-parse HEAD]
Evidence: evidence/R5-blog.png

## Gate Matrix

| Gate | Criterion | Evidence Class | Result | Artifact |
| :--- | :--- | :--- | :--- | :--- |
| S-01 | blog_posts.featured_media_id populated | PERSISTENCE | PASS | SQL insertion (hoeos-seo-test) |
| S-02 | Article <img> renders featured image | BROWSER | PASS | R5.6 trace (w=800) |
| S-03 | <meta property="og:image"> matches featured image public URL | BROWSER | PASS | R5.6 trace meta.ogImage |
| S-04 | <meta property="og:title"> matches seo_title | BROWSER | PASS | R5.6 trace meta.ogTitle |
| S-05 | <link rel="canonical"> present | BROWSER | PASS | R5.6 trace meta.canonical |
| S-06 | JSON-LD Article schema includes image | STRUCTURAL | PASS | BlogPages.tsx articleStructuredData |
| S-07 | sitemap.xml exists | STATIC | PASS | public/sitemap.xml |
| S-08 | robots.txt points to sitemap | STATIC | PASS | public/robots.txt |

## Verdict: CERTIFIED

## Verification Command
node scripts/r5-verify.mjs
