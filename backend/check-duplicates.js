require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

const PRODUCTS_JSON = path.join(__dirname, '..', 'frontend', 'public', 'products.json');
const raw = fs.readFileSync(PRODUCTS_JSON, 'utf8');
const products = JSON.parse(raw);

async function check() {
  for (const row of products) {
    const r = await db.query('SELECT id, name, slug, price, thumbnail FROM products WHERE name = $1 ORDER BY created_at', [row.name]);
    if (r.rows.length > 1) {
      console.log(`DUPLICATE: ${row.name}`);
      r.rows.forEach(row => console.log(`  ${row.id} | ${row.slug} | ${row.price} | ${row.thumbnail}`));
    }
  }
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
