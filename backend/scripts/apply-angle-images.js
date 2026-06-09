/**
 * Apply generated angle images to all variants of each product.
 * Usage: node scripts/apply-angle-images.js
 *
 * Expects manifest at scripts/angle-images-manifest.json:
 * { "product-slug": { "front": "/generated-products/slug/front.png", ... } }
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../src/config/db');

const manifestPath = path.join(__dirname, 'angle-images-manifest.json');

async function main() {
  if (!fs.existsSync(manifestPath)) {
    console.log('angle-images-manifest.json not found — generating from catalog...');
    execSync('node scripts/generate-angle-manifest.js', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
    if (!fs.existsSync(manifestPath)) {
      console.error('Could not generate angle-images-manifest.json');
      process.exit(1);
    }
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let updated = 0;

  for (const [slug, angles] of Object.entries(manifest)) {
    const productResult = await db.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (!productResult.rows.length) {
      console.warn(`Skipping unknown product: ${slug}`);
      continue;
    }

    const productId = productResult.rows[0].id;
    const angleImages = ['front', 'side', 'back'].map((angle) => ({
      angle,
      label: angle.charAt(0).toUpperCase() + angle.slice(1) + ' View',
      url: angles[angle],
    }));

    const frontUrl = angles.front || null;

    await db.query(
      `UPDATE product_variants
       SET angle_images = $1::jsonb,
           image_url = COALESCE($2, image_url)
       WHERE product_id = $3`,
      [JSON.stringify(angleImages), frontUrl, productId]
    );

    await db.query(
      `UPDATE products
       SET thumbnail = COALESCE($1, thumbnail),
           images = $2::jsonb
       WHERE id = $3`,
      [frontUrl, JSON.stringify(angleImages), productId]
    );

    updated += 1;
    console.log(`Updated angles for ${slug}`);
  }

  console.log(`Done. ${updated} products updated.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
