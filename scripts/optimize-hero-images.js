/**
 * Generates optimized WebP hero/tile images into frontend/public/hero.
 * Run on the server: node optimize-hero-images.js /var/www/Prince-Esquare/frontend/public
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const PUBLIC_DIR = process.argv[2] || path.join(__dirname, '../frontend/public');
const OUT_DIR = path.join(PUBLIC_DIR, 'hero');

const MAP = [
  ['WhatsApp Image 2026-05-12 at 8.07.30 PM.jpeg', 'presidential'],
  ['WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg', 'suits'],
  ['WhatsApp Image 2026-05-12 at 8.07.12 PM.jpeg', 'santoni'],
  ['WhatsApp Image 2026-05-12 at 8.07.21 PM.jpeg', 'linen'],
  ['WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg', 'tracksuits'],
  ['WhatsApp Image 2026-05-12 at 8.07.41 PM.jpeg', 'polos'],
  ['WhatsApp Image 2026-05-12 at 8.07.37 PM.jpeg', 'shoe-atelier'],
  ['WhatsApp Image 2026-05-12 at 8.07.20 PM.jpeg', 'trousers'],
  ['WhatsApp Image 2026-05-12 at 8.07.33 PM.jpeg', 'outerwear'],
  ['polo light blue.jpeg', 'polo-salon'],
  ['belt-001.jpeg', 'belts'],
];

const SIZES = [
  { width: 1600, quality: 72, suffix: '1600' },
  { width: 800, quality: 68, suffix: '800' },
];

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [src, name] of MAP) {
    const srcPath = path.join(PUBLIC_DIR, src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`SKIP (missing): ${src}`);
      continue;
    }
    for (const { width, quality, suffix } of SIZES) {
      const outPath = path.join(OUT_DIR, `${name}-${suffix}.webp`);
      await sharp(srcPath)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);
      const kb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`${name}-${suffix}.webp  ${kb} KB`);
    }
  }
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
