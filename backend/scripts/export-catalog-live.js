/**
 * Export local catalog tables for live sync (categories + products + POS).
 * Usage: node scripts/export-catalog-live.js
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
  'pos_products',
  'pos_stock_levels',
  'pos_store_stock_levels',
];

const outPath = path.join(__dirname, '..', 'data', 'catalog-live-sync.json');

(async () => {
  const bundle = { exported_at: new Date().toISOString(), tables: {} };
  for (const table of TABLES) {
    const r = await db.query(`SELECT * FROM ${table}`);
    bundle.tables[table] = r.rows;
    console.log(`  ${table}: ${r.rows.length}`);
  }
  fs.writeFileSync(outPath, JSON.stringify(bundle));
  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${outPath} (${mb} MB)`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
