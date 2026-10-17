// HOEOS R7: Multi-format upload test with Node 20 WebSocket polyfill
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Node.js 20 WebSocket polyfill for @supabase/supabase-js
globalThis.WebSocket = WebSocket;

dotenv.config();

const supa = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: WebSocket,
    },
  }
);

const TENANT_ID = '42d36cee-4cd6-43d1-af5d-334e5a07e37c';
const BUCKET = 'cp-public';

const fixtures = [
  { file: 'test-product.png',   mime: 'image/png',  media_type: 'image' },
  { file: 'test-jpeg.jpg',      mime: 'image/jpeg', media_type: 'image' },
  { file: 'test-animated.webp', mime: 'image/webp', media_type: 'image' },
  { file: 'test-animation.gif', mime: 'image/gif',  media_type: 'image' },
  { file: 'test-video.mp4',     mime: 'video/mp4',  media_type: 'video' },
];

console.log('=== HOEOS R7: MULTI-FORMAT UPLOAD TEST ===\n');

const results = [];

for (const { file, mime, media_type } of fixtures) {
  const localPath = path.join('tests/fixtures/media', file);
  if (!fs.existsSync(localPath)) {
    console.log(`SKIP ${file}: local fixture not found`);
    results.push({ file, mime, status: 'SKIP' });
    continue;
  }

  const buf = fs.readFileSync(localPath);
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 8);
  const storagePath = `media/${TENANT_ID}/${timestamp}_${nonce}_${file}`;

  console.log(`\n--- ${file} (${mime}, ${buf.length} bytes) ---`);

  const { error: uploadErr } = await supa.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: false });

  if (uploadErr) {
    console.log(`  X Storage upload failed: ${uploadErr.message}`);
    results.push({ file, mime, status: 'STORAGE_FAIL', error: uploadErr.message });
    continue;
  }
  console.log(`  OK Storage upload`);

  const assetRecord = {
    tenant_id: TENANT_ID,
    bucket: BUCKET,
    path: storagePath,
    media_type,
    mime_type: mime,
    filename: file,
    size_bytes: buf.length,
    alt_text: `R7 test ${file}`,
    status: 'active',
  };

  const { data: asset, error: assetErr } = await supa
    .from('media_assets')
    .insert(assetRecord)
    .select('*')
    .single();

  if (assetErr || !asset) {
    console.log(`  X media_assets insert failed: ${assetErr?.message}`);
    await supa.storage.from(BUCKET).remove([storagePath]);
    results.push({ file, mime, status: 'DB_FAIL', error: assetErr?.message });
    continue;
  }
  console.log(`  OK media_assets row: ${asset.id}`);

  const { data: urlData } = supa.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const headRes = await fetch(publicUrl, { method: 'HEAD' });
  console.log(`  HEAD: HTTP ${headRes.status} ${headRes.headers.get('content-type')} ${headRes.headers.get('content-length')} bytes`);

  results.push({
    file,
    mime,
    media_type,
    status: 'OK',
    assetId: asset.id,
    publicUrl,
    httpStatus: headRes.status,
    contentType: headRes.headers.get('content-type'),
    bytes: headRes.headers.get('content-length'),
  });
}

console.log('\n=== SUMMARY ===\n');
for (const r of results) {
  if (r.status === 'OK') {
    console.log(`OK ${r.file.padEnd(25)} ${r.mime.padEnd(12)} HTTP ${r.httpStatus} ${r.contentType}`);
  } else {
    console.log(`X  ${r.file.padEnd(25)} ${r.mime.padEnd(12)} ${r.status}: ${r.error || 'unknown'}`);
  }
}

const evidencePath = `evidence/r7-upload-test-${Date.now()}.json`;
fs.writeFileSync(evidencePath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
console.log(`\nEvidence: ${evidencePath}`);