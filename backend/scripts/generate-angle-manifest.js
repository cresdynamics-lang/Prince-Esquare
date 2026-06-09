/**
 * Build angle-images-manifest.json from product-angle-catalog.json and
 * frontend/public/generated-products/{slug}/angle.png files.
 *
 * Usage: node scripts/generate-angle-manifest.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const catalogPath = path.join(__dirname, 'product-angle-catalog.json');
const publicRoot = path.join(__dirname, '..', '..', 'frontend', 'public', 'generated-products');
const manifestPath = path.join(__dirname, 'angle-images-manifest.json');

const fileExists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};

const angleUrl = (slug, angle) => `/generated-products/${slug}/${angle}.png`;

async function main() {
  if (!fileExists(catalogPath)) {
    console.error('Missing product-angle-catalog.json');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const manifest = {};
  let fromFiles = 0;
  let fromDb = 0;
  let skipped = 0;

  const slugs = catalog.map((p) => p.slug).filter(Boolean);
  const dbBySlug = {};

  if (slugs.length) {
    const r = await db.query(
      `SELECT slug, thumbnail, images FROM products WHERE slug = ANY($1::text[])`,
      [slugs]
    );
    for (const row of r.rows) {
      dbBySlug[row.slug] = row;
    }
  }

  for (const entry of catalog) {
    const slug = entry.slug;
    if (!slug) continue;

    const dir = path.join(publicRoot, slug);
    const hasFront = fileExists(path.join(dir, 'front.png'));
    const hasSide = fileExists(path.join(dir, 'side.png'));
    const hasBack = fileExists(path.join(dir, 'back.png'));

    if (hasFront && hasSide && hasBack) {
      manifest[slug] = {
        front: angleUrl(slug, 'front'),
        side: angleUrl(slug, 'side'),
        back: angleUrl(slug, 'back'),
      };
      fromFiles += 1;
      continue;
    }

    const dbRow = dbBySlug[slug];
    const thumb = dbRow?.thumbnail || null;
    if (thumb) {
      manifest[slug] = { front: thumb, side: thumb, back: thumb };
      fromDb += 1;
      continue;
    }

    skipped += 1;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifest written: ${manifestPath}`);
  console.log(`  from generated files: ${fromFiles}`);
  console.log(`  from DB thumbnails:   ${fromDb}`);
  console.log(`  skipped (no images):  ${skipped}`);
  console.log(`  total entries:        ${Object.keys(manifest).length}`);

  if (!Object.keys(manifest).length) {
    console.warn('No angle images found. Run organize-angle-images.ps1 after generating product images.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
