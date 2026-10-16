import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supa = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '42d36cee-4cd6-43d1-af5d-334e5a07e37c';
const PRODUCT_ID = '84ff8050-8c5c-4e5f-ad4d-25449f978b56';
const BUCKET = 'cp-public';

console.log('=== HOEOS STORAGE FIXTURE REPLACEMENT ===\n');

// Step 1: List current media_assets rows to know what to replace
const { data: assets, error: listErr } = await supa
  .from('media_assets')
  .select('id, filename, path, mime_type, size_bytes')
  .eq('tenant_id', TENANT_ID)
  .eq('bucket', BUCKET)
  .eq('status', 'active');

if (listErr) {
  console.error('Failed to list assets:', listErr);
  process.exit(1);
}

console.log(`Found ${assets.length} active assets to consider:\n`);
assets.forEach(a => console.log(`  ${a.filename.padEnd(30)} ${a.path}`));

// Step 2: For each fixture file, upload to the corresponding path
const mapping = [
  { local: 'test-product.png',    matchName: 'test-product.png',    contentType: 'image/png' },
  { local: 'test-hero.png',       matchName: 'test-hero.png',       contentType: 'image/png' },
  { local: 'test-animation.gif',  matchName: 'test-animation.gif',  contentType: 'image/gif' },
  { local: 'test-video.mp4',      matchName: 'test-video.mp4',      contentType: 'video/mp4' },
  { local: 'test-animated.webp',  matchName: 'test-animated.webp',  contentType: 'image/webp' },
];

console.log('\n=== UPLOADING ===\n');

for (const { local, matchName, contentType } of mapping) {
  const localPath = path.join('tests/fixtures/media', local);

  if (!fs.existsSync(localPath)) {
    console.warn(`  SKIP ${local} — not found locally`);
    continue;
  }

  // Find the target asset(s) by filename
  const matchingAssets = assets.filter(a => a.filename === matchName);

  if (matchingAssets.length === 0) {
    console.warn(`  SKIP ${local} — no matching asset in DB`);
    continue;
  }

  const buf = fs.readFileSync(localPath);

  for (const asset of matchingAssets) {
    const { error: uploadErr } = await supa.storage
      .from(BUCKET)
      .upload(asset.path, buf, { contentType, upsert: true });

    if (uploadErr) {
      console.error(`  FAIL ${local} → ${asset.path}: ${uploadErr.message}`);
      continue;
    }

    // Update size_bytes in media_assets
    const { error: updateErr } = await supa
      .from('media_assets')
      .update({ size_bytes: buf.length })
      .eq('id', asset.id);

    if (updateErr) {
      console.warn(`  WARN ${local}: uploaded but DB update failed: ${updateErr.message}`);
    } else {
      console.log(`  OK   ${local} → ${asset.path} (${buf.length} bytes)`);
    }
  }
}

console.log('\n=== DONE ===');
