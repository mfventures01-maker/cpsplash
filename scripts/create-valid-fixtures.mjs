import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dir = 'tests/fixtures/media';
fs.mkdirSync(dir, { recursive: true });

console.log('=== HOEOS FIXTURE REGENERATION ===\n');

// --- 1. Valid PNG: test-product.png (400x400 solid rose) ---
await sharp({
  create: { width: 400, height: 400, channels: 4, background: { r: 200, g: 50, b: 80, alpha: 1 } }
})
  .png({ compressionLevel: 9 })
  .toFile(path.join(dir, 'test-product.png'));

console.log('✓ Generated test-product.png (400x400 PNG)');

// --- 2. Valid PNG: test-hero.png (800x600 gradient) ---
// Use a raw pixel buffer for a gradient
const heroW = 800, heroH = 600;
const heroBuf = Buffer.alloc(heroW * heroH * 3);
for (let y = 0; y < heroH; y++) {
  for (let x = 0; x < heroW; x++) {
    const i = (y * heroW + x) * 3;
    heroBuf[i]     = Math.floor(60 + (x / heroW) * 80);   // R
    heroBuf[i + 1] = Math.floor(80 + (y / heroH) * 60);   // G
    heroBuf[i + 2] = Math.floor(120 + ((x + y) / (heroW + heroH)) * 60); // B
  }
}
await sharp(heroBuf, { raw: { width: heroW, height: heroH, channels: 3 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(dir, 'test-hero.png'));

console.log('✓ Generated test-hero.png (800x600 PNG gradient)');

// --- 3. Valid GIF: test-animation.gif (100x100 still) ---
await sharp({
  create: { width: 100, height: 100, channels: 4, background: { r: 100, g: 200, b: 100, alpha: 1 } }
})
  .gif()
  .toFile(path.join(dir, 'test-animation.gif'));

console.log('✓ Generated test-animation.gif (100x100 GIF)');

// --- 4. Valid WebP: test-animated.webp (400x400) ---
await sharp({
  create: { width: 400, height: 400, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } }
})
  .webp({ quality: 80 })
  .toFile(path.join(dir, 'test-animated.webp'));

console.log('✓ Generated test-animated.webp (400x400 WebP)');

// --- 5. Valid WebP: test-hero.webp (800x600) ---
await sharp({
  create: { width: 800, height: 600, channels: 4, background: { r: 60, g: 80, b: 120, alpha: 1 } }
})
  .webp({ quality: 80 })
  .toFile(path.join(dir, 'test-hero.webp'));

console.log('✓ Generated test-hero.webp (800x600 WebP)');

// --- 6. Valid MP4: test-video.mp4 (via ffmpeg if available) ---
const mp4Path = path.join(dir, 'test-video.mp4');
let mp4Generated = false;
try {
  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x4060c0:s=640x480:d=2 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`,
    { stdio: 'pipe' }
  );
  mp4Generated = true;
  console.log('✓ Generated test-video.mp4 via ffmpeg (2s, 640x480)');
} catch (err) {
  console.warn('✗ ffmpeg not available — skipping MP4 generation');
  console.warn('  Install ffmpeg, or download a sample MP4 manually to:', mp4Path);
}

// --- Verify all fixtures ---
console.log('\n=== VERIFICATION ===');
const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
for (const file of files) {
  const fullPath = path.join(dir, file);
  const buf = fs.readFileSync(fullPath);
  let detail = '';

  try {
    if (file.endsWith('.mp4')) {
      // Just confirm size
      detail = buf.length > 1000 ? 'plausible size' : 'SUSPICIOUSLY SMALL';
    } else {
      const meta = await sharp(buf).metadata();
      detail = `${meta.width}x${meta.height} ${meta.format}`;
    }
  } catch (e) {
    detail = 'SHARP CANNOT PARSE — INVALID';
  }

  console.log(`  ${file.padEnd(28)} ${String(buf.length).padStart(8)} bytes  ${detail}`);
}

console.log('\n=== DONE ===');
