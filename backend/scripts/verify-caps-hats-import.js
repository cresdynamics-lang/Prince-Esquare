/**
 * Verify caps & hats import counts.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'caps-hats.json');

async function run() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const expected = catalog.length;

  const cat = await db.query(
    `SELECT id FROM categories WHERE name = 'Caps & Hats' AND parent_id IS NULL`
  );
  if (!cat.rows.length) {
    console.error('Caps & Hats category not found');
    process.exit(1);
  }

  const count = await db.query(
    'SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1 AND is_active = true',
    [cat.rows[0].id]
  );

  const n = count.rows[0].n;
  console.log(`Catalog entries: ${expected}`);
  console.log(`Live caps & hats: ${n}`);
  if (n < expected) {
    console.warn(`WARNING: ${expected - n} caps & hats missing from DB`);
    process.exit(1);
  }
  console.log('Caps & hats import OK');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
