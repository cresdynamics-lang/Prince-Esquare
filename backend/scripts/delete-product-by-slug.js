/**
 * Delete a product (and cascaded variants) by slug.
 * Usage: node scripts/delete-product-by-slug.js <slug>
 */
require('dotenv').config();
const db = require('../src/config/db');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/delete-product-by-slug.js <slug>');
  process.exit(1);
}

(async () => {
  const result = await db.query('DELETE FROM products WHERE slug = $1 RETURNING id, name', [slug]);
  if (!result.rows.length) {
    console.log(`No product found with slug: ${slug}`);
    process.exit(0);
  }
  invalidateCatalogueCache();
  console.log(`Deleted: ${result.rows[0].name} (${result.rows[0].id})`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
