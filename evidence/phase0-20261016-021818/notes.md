# Phase 0 Notes: Repository and Environment Baseline
Timestamp: 2026-10-16T02:18:18+01:00

## 1. Git State
- HEAD: `9861b0dc563c354ed623a87d4ecfbdfbdfd27ea1`
- Commit: `9861b0d chore(schema): archive recovered sales catalog artifacts`
- Recorded in `git-log.txt`, `git-status.txt`, `git-rev-parse-head.txt`

## 2. Supabase Project Link
- Project Ref: `efvvczmopacoroudzfnl` (`ECOMMERCE`, region `eu-central-1`)
- Status: `ACTIVE_HEALTHY`, `linked: true`
- Recorded in `projects-list.txt`

## 3. Migration Parity
- 25 migrations recorded in remote `supabase_migrations.schema_migrations`
- 25 local files in `supabase/migrations/`
- Parity: Local = Remote across all 25 migrations
- Recorded in `migration-list.txt`

## 4. Migration Hashes
- 25 migration files hashed with SHA256 in `migration-hashes.txt`

## 5. Production Table Counts
- `products`: 0
- `product_variants`: 0
- `product_prices`: 0
- `media_assets`: 1 (beetroot PNG specimen)
- `media_placements`: 0
- `product_media`: 0
- `blog_posts`: 0
- Recorded in `production-counts.json`

## Exit Criterion: PASSED
All commands succeeded, every count is recorded, and migration hashes are written.
Evidence Classification: STATIC.
