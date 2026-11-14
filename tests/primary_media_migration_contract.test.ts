import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20261114000000_atomic_product_primary_media.sql',
  'utf8'
);

assert.match(migration, /create unique index if not exists product_media_one_primary_per_product/i);
assert.match(migration, /on public\.product_media\s*\(product_id\)\s*where is_primary = true/i);
assert.match(migration, /having count\(\*\) > 1/i);
assert.match(migration, /returns setof public\.product_media/i);
assert.match(migration, /security definer/i);
assert.match(migration, /set search_path = pg_catalog/i);
assert.match(migration, /v_actor_id := auth\.uid\(\)/i);
assert.match(migration, /for update/i);
assert.match(migration, /for share/i);
assert.match(migration, /tm\.status = 'active'/i);
assert.match(migration, /r\.name = any/i);
assert.match(migration, /v_asset_status <> 'active'/i);
assert.match(migration, /on conflict \(product_id, media_id\)/i);
assert.match(migration, /revoke all on function public\.set_product_primary_media/i);
assert.match(migration, /grant execute on function public\.set_product_primary_media[\s\S]*to authenticated/i);

console.log('[PASS] Primary-media migration contract: transaction, authorization, row locks, and uniqueness guards are present.');
