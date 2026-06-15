/**
 * Verify loafers import counts.
 * Usage: node scripts/verify-loafers-import.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'loafers.json');

async function run() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const expected = catalog.length;

  const cat = await db.query(
    `SELECT c.id FROM categories c
     JOIN categories p ON c.parent_id = p.id
     WHERE c.name = 'Loafers' AND p.name = 'Shoes'`
  );
  if (!cat.rows.length) {
    console.error('Loafers category not found under Shoes');
    process.exit(1);
  }

  const count = await db.query(
    'SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1 AND is_active = true',
    [cat.rows[0].id]
  );

  const n = count.rows[0].n;
  console.log(`Catalog entries: ${expected}`);
  console.log(`Live loafers:    ${n}`);
  if (n < expected) {
    console.warn(`WARNING: ${expected - n} loafers missing from DB`);
    process.exit(1);
  }
  console.log('Loafers import OK');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
