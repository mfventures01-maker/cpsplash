# HOEOS FORENSIC MEDIA METHOD — E2E IMAGE & MEDIA PIPELINE CERTIFICATION

## Sequence
Evidence → Verification → Diagnosis → Repair → Re-verification → Certification

## Evidence Classes
STATIC | STRUCTURAL | RUNTIME | BROWSER | PERSISTENCE | INTEGRITY | SECURITY | CERTIFICATION

## The Four Pipelines
1. **Pipeline H (Homepage Hero):** Featured product renders its primary media in hero view with naturalWidth > 0.
2. **Pipeline M (Product Catalog Grid & Menu):** Every published product renders valid media in card and carousel.
3. **Pipeline F (Commercial Acquisition Funnel):** Funnel territory renders polymorphic video/gif/webp assets from `media_placements`.
4. **Pipeline S (Blog SEO & AEO):** Articles render valid featured imagery with dynamic OpenGraph, canonical, and JSON-LD schema.

## Root Cause Taxonomy
- RC-1: Query Gap (PostgREST select lacks join)
- RC-2: RLS Block (policy denies SELECT)
- RC-3: Data Gap (row absent in database)
- RC-4: Storage Gap (storage object missing)
- RC-5: URL Construction Bug (malformed public URL)
- RC-6: Component Bug (element missing from DOM)
- RC-7: Precedence Bug (fallback overrides genuine asset)
- RC-8: Element Type Bug (wrong tag, e.g. <img> for MP4)
- RC-9: Fixture/Decompression Bug (corrupted image payload / mock bytes fail decode)
- RC-10: Cache/Stale State (CDN or browser cache retention)

## Forensic Test Scripts
- `scripts/create-valid-fixtures.mjs`: Generates valid PNG, GIF, WebP, MP4 with real compression.
- `scripts/phase-b-trace.mjs`: Headless Chromium trace measuring DOM presence, HTTP 200, and naturalWidth > 0 decode.
- `scripts/replace-fixtures-in-storage.mjs`: Synchronizes storage bucket with validated media assets.
