/**
 * Export local database → backend/data/full-sync.json
 * Safe to run on dev machine. Upload file to server, then import-all-sync.js
 *
 * Usage: node scripts/export-all-sync.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const TABLES = [
  'categories',
  'brands',
  'products',
  'product_variants',
  'pos_profiles',
  'pos_products',
  'pos_product_variants',
  'pos_stock_levels',
  'pos_store_stock_levels',
  'banners',
  'settings',
  'coupons',
  'orders',
  'order_items',
  'reviews',
  'pos_shifts',
  'pos_sales',
  'pos_sale_items',
];

const outDir = path.join(__dirname, '..', 'data');
const outPath = path.join(outDir, 'full-sync.json');

async function tableExists(name) {
  const r = await db.query(`SELECT to_regclass($1) AS t`, [`public.${name}`]);
  return Boolean(r.rows[0]?.t);
}

async function exportTable(name) {
  if (!(await tableExists(name))) {
    console.warn(`Skip ${name} (table missing)`);
    return [];
  }
  const r = await db.query(`SELECT * FROM ${name}`);
  console.log(`  ${name}: ${r.rows.length} rows`);
  return r.rows;
}

async function main() {
  console.log('Exporting local database…');
  const bundle = {
    exported_at: new Date().toISOString(),
    source: process.env.DB_NAME || 'prince_esquare',
    tables: {},
  };

  for (const table of TABLES) {
    bundle.tables[table] = await exportTable(table);
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 0));
  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${outPath} (${mb} MB)`);
  console.log('Upload this file to the server: /var/www/Prince-Esquare/backend/data/full-sync.json');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
