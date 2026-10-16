const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('tests/fixtures/media');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. 100x100 solid PNG
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAK8AAACvABQqw0mAAAAB50RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACvSURBVHic7cExAQAAAMKg9U9tDQ8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgIsBIcAAAS2ZqZAAAAAASUVORK5CYII=',
  'base64'
);
fs.writeFileSync(path.join(targetDir, 'test-product.png'), pngBuffer);
fs.writeFileSync(path.join(targetDir, 'test-hero.png'), pngBuffer);

// 2. Small valid GIF89a (animated 2-frame 10x10 GIF)
const gifBuffer = Buffer.from(
  'R0lGODlhCgAKAIABAP///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQBAAABACwAAAAACgAKAAACE4yPB5vtvxhqS856g266850QACH5BAEAAAEALAAAAAAKAAoAAAISjI8Hm+2/GGpLznqDbprzrRAAOw==',
  'base64'
);
fs.writeFileSync(path.join(targetDir, 'test-animation.gif'), gifBuffer);

// 3. Small valid WebP (1x1 transparent/lossless WebP)
const webpBuffer = Buffer.from(
  'UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AAA/v5/3001v////718yP////3////+8n663f/3kAAAAA==',
  'base64'
);
fs.writeFileSync(path.join(targetDir, 'test-hero.webp'), webpBuffer);
fs.writeFileSync(path.join(targetDir, 'test-animated.webp'), webpBuffer);

// 4. Minimal valid MP4 container
// Hex of a minimal ftyp isom + moov container:
const mp4Hex = 
  '000000206674797069736f6d0000020069736f6d69736f32617663316d703431' +
  '0000000866726565' +
  '000000606d6f6f760000006c6d76686400000000' +
  'd0a7a300d0a7a300000003e8000003e800010000' +
  '0100000000000000000000000001000000000000' +
  '0000000000000000000100000000000000000000' +
  '0000000040000000000000000000000000000000' +
  '0000000000000000000000000000000000000002';
const mp4Buffer = Buffer.from(mp4Hex, 'hex');
fs.writeFileSync(path.join(targetDir, 'test-video.mp4'), mp4Buffer);

console.log('Test media assets created in ' + targetDir + ':');
fs.readdirSync(targetDir).forEach(f => {
  const stat = fs.statSync(path.join(targetDir, f));
  console.log(`- ${f} (${stat.size} bytes)`);
});
