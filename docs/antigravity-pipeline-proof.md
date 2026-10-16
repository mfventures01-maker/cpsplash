# MISSION: DEFINITIVE END-TO-END PIPELINE PROOF FOR CP SPLASH

You are operating in `C:\Projects\cp-splash`. This is a React + TypeScript + Vite + Tailwind frontend against a Supabase (PostgreSQL + Storage + Auth + PostgREST) backend. The system is CP Splash, a multitenant commerce + CMS platform.

Your task is to produce **independently reproducible runtime evidence** that proves — or disproves — four specific end-to-end pipelines. There are no other objectives. Do not optimize. Do not refactor. Do not add features. Do not fix unrelated defects. Only prove or disprove.

You must operate strictly under the HOEOS methodology:
- Evidence Before Assumption
- Verify Before Change
- Root Cause Before Repair
- Preserve Production
- Evidence Classification (STATIC / STRUCTURAL / RUNTIME / CERTIFICATION)

Read this entire prompt before executing anything.

---

## 1. THE FOUR PIPELINES TO PROVE

### Pipeline A — CMS product creation → database persistence
**Claim to prove:** A user authenticated as a CP Splash owner can fill the "Create Product in Supabase" form in the CMS and produce exactly one row in `public.products`, one in `public.product_variants`, and one in `public.product_prices`, all with `tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'`.

### Pipeline B — CMS media upload → storage + metadata → placement
**Claim to prove:** A user authenticated as a CP Splash owner can upload an image through the CMS Media & Storage screen, and then assign that media to a homepage or funnel scope, producing:
- 1 object in `storage.objects` at `media/{tenant}/...`
- 1 row in `public.media_assets` matching the object
- 1 row in `public.media_placements` with the chosen `scope_type` and `scope_id`

### Pipeline C — GIF, video, and animated asset upload
**Claim to prove:** The CMS accepts and persists GIF, MP4, WebM, and animated WebP files, writing the correct `mime_type` and `media_type` to `media_assets`, and the file is retrievable at its public URL.

### Pipeline D — Blog post publication with SEO/AIEO
**Claim to prove:** A user authenticated as a CP Splash owner can create a blog post through the CMS, publish it, and the public site renders it at a stable URL with correct SEO meta tags and JSON-LD structured data.

---

## 2. THE CERTIFIED BASELINE — DO NOT RE-LITIGATE
- Project ref: `efvvczmopacoroudzfnl` (ECOMMERCE, Central EU Frankfurt)
- URL: `https://efvvczmopacoroudzfnl.supabase.co`
- Tenant `cp-splash`: `42d36cee-4cd6-43d1-af5d-334e5a07e37c`
- Admin user: `kevweoyibode@gmail.com` (owner, active)
- Admin user ID: `58bfdbd9-abb5-4cc9-b3a0-cb516479c146`
- Migration ledger: 25 entries, Local = Remote
- Storage policies on `storage.objects` (cp-public bucket): 10 policies
- One upload to `media/{tenant}/...` has succeeded (beetroot PNG, 2026-10-15 20:12:49 UTC)
- Current production counts: `media_assets`: 1, `products`: 0, `product_variants`: 0, `product_prices`: 0, `media_placements`: 0, `product_media`: 0, `blog_posts`: unknown (to be captured in Phase 0).

---

## 3. HOEOS OPERATING RULES — MANDATORY FOR EVERY PHASE
- Evidence classification: STATIC, STRUCTURAL, RUNTIME, CERTIFICATION
- Preserve production
- Authorization gate for production writes
- Evidence discipline: manifests, command logs, pre/post states
- No speculative fixes

---

## 4. PHASE STRUCTURE
- Phase 0 — Repository and environment baseline (read-only)
- Phase 1 — Pipeline A: Product creation trace (runtime)
- Phase 2 — Root cause for Pipeline A failure (only if Phase 1 failed)
- Phase 3 — Fix Pipeline A (only if Phase 2 identified a cause)
- Phase 4 — Pipeline B: Media upload + placement trace (runtime)
- Phase 5 — Pipeline C: GIF and video upload (runtime)
- Phase 6 — Pipeline D: Blog post publication (runtime)
- Phase 7 — Final synthesis report
