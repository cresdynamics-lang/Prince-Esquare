/**
 * Quick check — is inventory data on this server?
 * Usage: node scripts/check-sync-status.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function main() {
  const syncPath = path.join(__dirname, '..', 'data', 'full-sync.json');
  console.log('=== Prince Esquare data check ===\n');
  console.log('DB:', process.env.DB_NAME || 'prince_esquare');
  if (fs.existsSync(syncPath)) {
    const mb = (fs.statSync(syncPath).size / 1024 / 1024).toFixed(2);
    console.log(`full-sync.json: YES (${mb} MB)`);
  } else {
    console.log('full-sync.json: ❌ MISSING — upload from your PC first');
  }

  const queries = [
    ['Website products (active)', `SELECT COUNT(*)::int AS c FROM products WHERE is_active = true`],
    ['Product variants', `SELECT COUNT(*)::int AS c FROM product_variants`],
    ['POS pieces (PE-CAT)', `SELECT COUNT(*)::int AS c FROM pos_products WHERE sku LIKE 'PE-CAT-%'`],
    ['Shop stock rows', `SELECT COUNT(*)::int AS c FROM pos_stock_levels`],
    ['Shop qty > 0', `SELECT COUNT(*)::int AS c FROM pos_stock_levels WHERE current_qty > 0`],
    ['Website ↔ POS linked', `SELECT COUNT(*)::int AS c FROM products WHERE pos_stock_product_id IS NOT NULL`],
  ];

  for (const [label, sql] of queries) {
    const r = await db.query(sql);
    const c = r.rows[0].c;
    const flag = c === 0 ? '❌' : '✅';
    console.log(`${flag} ${label}: ${c}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
