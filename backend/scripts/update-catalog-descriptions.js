/**
 * Push catalog descriptions from JSON into products table (no image re-upload).
 * Usage: node scripts/update-catalog-descriptions.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const CATALOGS = [
  path.join(__dirname, '..', 'data', 'formal-casual-shirts.json'),
  path.join(__dirname, '..', 'data', 'two-piece-suits.json'),
  path.join(__dirname, '..', 'data', 'three-piece-suits.json'),
  path.join(__dirname, '..', 'data', 'khaki-trousers.json'),
];

(async () => {
  let updated = 0;
  let missing = 0;

  for (const file of CATALOGS) {
    if (!fs.existsSync(file)) {
      console.warn('Skip missing:', file);
      continue;
    }
    const items = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const item of items) {
      if (!item.slug || !item.description) continue;
      const r = await db.query(
        'UPDATE products SET description = $1, updated_at = NOW() WHERE slug = $2 RETURNING id',
        [item.description, item.slug]
      );
      if (r.rows.length) updated += 1;
      else missing += 1;
    }
  }

  invalidateCatalogueCache();
  console.log(`Updated ${updated} product descriptions (${missing} slugs not found in DB).`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
