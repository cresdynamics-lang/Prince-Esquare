/**
 * Verify sweatshirts import counts.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'sweatshirts.json');

async function run() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const expected = catalog.length;

  const cat = await db.query(
    `SELECT c.id FROM categories c
     JOIN categories p ON c.parent_id = p.id
     WHERE c.name = 'Sweat-shirts' AND p.name = 'T-shirts'`
  );
  if (!cat.rows.length) {
    console.error('Sweat-shirts category not found under T-shirts');
    process.exit(1);
  }

  const count = await db.query(
    'SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1 AND is_active = true',
    [cat.rows[0].id]
  );

  const n = count.rows[0].n;
  console.log(`Catalog entries: ${expected}`);
  console.log(`Live sweatshirts: ${n}`);
  if (n < expected) {
    console.warn(`WARNING: ${expected - n} sweatshirts missing from DB`);
    process.exit(1);
  }
  console.log('Sweatshirts import OK');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
