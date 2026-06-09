/**
 * Import full-sync.json onto live DB (UPSERT — does not drop tables).
 * Run AFTER: npm run db:migrate
 *
 * Usage: node scripts/import-all-sync.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const filePath = path.join(__dirname, '..', 'data', 'full-sync.json');

const TABLE_ORDER = [
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

const CONFLICT_KEY = {
  categories: 'id',
  brands: 'id',
  products: 'id',
  product_variants: 'id',
  pos_profiles: 'id',
  pos_products: 'id',
  pos_product_variants: 'id',
  pos_stock_levels: 'product_id',
  pos_store_stock_levels: 'product_id',
  banners: 'id',
  settings: 'id',
  coupons: 'id',
  orders: 'id',
  order_items: 'id',
  reviews: 'id',
  pos_shifts: 'id',
  pos_sales: 'id',
  pos_sale_items: 'id',
};

async function getColumns(table) {
  const r = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  return new Set(r.rows.map((x) => x.column_name));
}

function serialize(val) {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

async function upsertRows(table, rows) {
  if (!rows?.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return 0;
  }

  const targetCols = await getColumns(table);
  const conflict = CONFLICT_KEY[table] || 'id';
  let count = 0;

  for (const row of rows) {
    const keys = Object.keys(row).filter((k) => targetCols.has(k));
    if (!keys.length) continue;

    const values = keys.map((k) => serialize(row[k]));
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const updates = keys
      .filter((k) => k !== conflict)
      .map((k) => `${k} = EXCLUDED.${k}`)
      .join(', ');

    const sql = updates
      ? `INSERT INTO ${table} (${keys.join(', ')})
         VALUES (${placeholders.join(', ')})
         ON CONFLICT (${conflict}) DO UPDATE SET ${updates}`
      : `INSERT INTO ${table} (${keys.join(', ')})
         VALUES (${placeholders.join(', ')})
         ON CONFLICT (${conflict}) DO NOTHING`;

    await db.query(sql, values);
    count += 1;
  }

  console.log(`  ${table}: ${count} rows upserted`);
  return count;
}

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error('Missing', filePath);
    console.error('Export on your PC: node scripts/export-all-sync.js');
    console.error('Upload to this path via WinSCP/FileZilla.');
    process.exit(1);
  }

  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('Import bundle from', bundle.exported_at || 'unknown');
  console.log('Running migrations first…');
  const { execSync } = require('child_process');
  execSync('node src/db/migrate.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  console.log('\nImporting (upsert — existing live rows updated, not deleted)…');
  await db.query('BEGIN');
  try {
    await db.query("SET session_replication_role = 'replica'");
    for (const table of TABLE_ORDER) {
      await upsertRows(table, bundle.tables?.[table] || []);
    }
    await db.query("SET session_replication_role = 'origin'");
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  console.log('\nRe-linking website ↔ POS…');
  const { autoLinkAllProducts } = require('../src/services/productPosLink');
  const link = await autoLinkAllProducts();
  console.log(`Linked ${link.linked} products, reconciled ${link.reconciled}`);

  console.log('\nImport complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
