require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

const PRODUCTS_JSON = path.join(__dirname, '..', 'frontend', 'public', 'products.json');
const raw = fs.readFileSync(PRODUCTS_JSON, 'utf8');
const products = JSON.parse(raw);

async function clean() {
  for (const row of products) {
    const r = await db.query('SELECT id, slug FROM products WHERE name = $1 ORDER BY created_at', [row.name]);
    for (const p of r.rows) {
      if (!p.slug.includes('-PROD-')) {
        await db.query('DELETE FROM product_variants WHERE product_id = $1', [p.id]);
        await db.query('DELETE FROM products WHERE id = $1', [p.id]);
        console.log(`Deleted duplicate: ${row.name} (${p.slug})`);
      }
    }
  }
  console.log('Cleanup complete.');
  process.exit(0);
}

clean().catch(e => { console.error(e); process.exit(1); });
