// HOEOS R7: Browser decode test for all uploaded formats
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

globalThis.WebSocket = WebSocket;
dotenv.config();

const supa = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: WebSocket } }
);

const TENANT_ID = '42d36cee-4cd6-43d1-af5d-334e5a07e37c';
const BUCKET = 'cp-public';

console.log('=== HOEOS R7: BROWSER DECODE TEST ===\n');

// Fetch the R7 assets we just uploaded
const { data: assets, error } = await supa
  .from('media_assets')
  .select('id, filename, mime_type, media_type, bucket, path, size_bytes')
  .eq('tenant_id', TENANT_ID)
  .eq('bucket', BUCKET)
  .eq('status', 'active')
  .in('filename', ['test-product.png', 'test-jpeg.jpg', 'test-animated.webp', 'test-animation.gif', 'test-video.mp4'])
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Failed to fetch assets:', error);
  process.exit(1);
}

// Deduplicate by filename (take most recent)
const latest = {};
for (const a of assets) {
  if (!latest[a.filename]) latest[a.filename] = a;
}

console.log(`Found ${Object.keys(latest).length} distinct formats\n`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('about:blank');

const results = [];

for (const [filename, asset] of Object.entries(latest)) {
  const { data: urlData } = supa.storage.from(BUCKET).getPublicUrl(asset.path);
  const url = urlData.publicUrl;

  let decode;
  if (asset.media_type === 'video' || asset.mime_type?.startsWith('video/')) {
    decode = await page.evaluate((u) => new Promise(resolve => {
      const v = document.createElement('video');
      v.muted = true;
      v.preload = 'metadata';
      const timer = setTimeout(() => resolve({ status: 'TIMEOUT' }), 10000);
      v.onloadedmetadata = () => {
        clearTimeout(timer);
        resolve({
          status: 'LOADED',
          w: v.videoWidth,
          h: v.videoHeight,
          duration: Math.round(v.duration * 100) / 100
        });
      };
      v.onerror = () => {
        clearTimeout(timer);
        resolve({ status: 'DECODE_FAILED' });
      };
      v.src = u;
    }), url);
  } else {
    decode = await page.evaluate((u) => new Promise(resolve => {
      const img = new Image();
      const timer = setTimeout(() => resolve({ status: 'TIMEOUT' }), 10000);
      img.onload = () => {
        clearTimeout(timer);
        resolve({ status: 'LOADED', w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve({ status: 'DECODE_FAILED' });
      };
      img.src = u;
    }), url);
  }

  results.push({
    filename,
    mime: asset.mime_type,
    media_type: asset.media_type,
    bytes: asset.size_bytes,
    url,
    ...decode
  });
}

await browser.close();

console.log('=== DECODE RESULTS ===\n');
for (const r of results) {
  const marker = r.status === 'LOADED' ? 'OK' : 'X ';
  const dims = r.w ? `${r.w}x${r.h}` : 'n/a';
  const dur = r.duration ? ` (${r.duration}s)` : '';
  console.log(`${marker} ${r.filename.padEnd(25)} ${(r.mime || '').padEnd(12)} ${r.status.padEnd(15)} ${dims}${dur}`);
}

const evidencePath = `evidence/r7-decode-test-${Date.now()}.json`;
const fs = await import('fs');
fs.writeFileSync(evidencePath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));

const allPassed = results.every(r => r.status === 'LOADED');
console.log(`\n=== ${allPassed ? 'ALL PASS - 5/5' : 'SOME FAILED'} ===`);
console.log(`Evidence: ${evidencePath}`);

process.exit(allPassed ? 0 : 1);