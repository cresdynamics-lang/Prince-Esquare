/**
 * Replace live catalog with catalog-live-sync.json (includes categories/brands).
 * Usage: node scripts/import-catalog-live.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../src/config/db');

const filePath = path.join(__dirname, '..', 'data', 'catalog-live-sync.json');
const BATCH = 75;

const TABLE_ORDER = [
  'categories',
  'brands',
  'products',
  'product_variants',
  'pos_products',
  'pos_stock_levels',
  'pos_store_stock_levels',
];

const CONFLICT_KEY = {
  categories: 'id',
  brands: 'id',
  products: 'id',
  product_variants: 'id',
  pos_products: 'id',
  pos_stock_levels: 'product_id',
  pos_store_stock_levels: 'product_id',
};

const columnCache = new Map();

async function getColumnMeta(table) {
  if (columnCache.has(table)) return columnCache.get(table);
  const r = await db.query(
    `SELECT column_name, udt_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  const meta = {
    names: new Set(r.rows.map((x) => x.column_name)),
    jsonb: new Set(r.rows.filter((x) => x.udt_name === 'jsonb').map((x) => x.column_name)),
  };
  columnCache.set(table, meta);
  return meta;
}

function serialize(val, isJsonb) {
  if (val == null) return null;
  if (val instanceof Date) return val.toISOString();
  if (isJsonb && typeof val === 'object') return JSON.stringify(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

async function upsertRows(table, rows) {
  if (!rows?.length) {
    console.log(`  ${table}: 0 rows`);
    return;
  }
  const { names, jsonb } = await getColumnMeta(table);
  const conflict = CONFLICT_KEY[table];
  let ok = 0;
  let err = 0;

  for (const row of rows) {
    const copy = { ...row };
    if (table === 'products') copy.pos_stock_product_id = null;
    const keys = Object.keys(copy).filter((k) => names.has(k));
    const values = keys.map((k) => serialize(copy[k], jsonb.has(k)));
    const placeholders = keys.map((k, i) => (jsonb.has(k) ? `$${i + 1}::jsonb` : `$${i + 1}`));
    const updates = keys.filter((k) => k !== conflict).map((k) => `${k} = EXCLUDED.${k}`).join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
      ON CONFLICT (${conflict}) DO UPDATE SET ${updates}`;
    try {
      await db.query(sql, values);
      ok += 1;
    } catch (e) {
      err += 1;
      if (err <= 5) console.error(`  ${table} error:`, e.message);
    }
  }
  console.log(`  ${table}: ${ok} ok, ${err} errors`);
}

(async () => {
  if (!fs.existsSync(filePath)) {
    console.error('Missing', filePath);
    process.exit(1);
  }
  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('Import catalog from', bundle.exported_at);

  execSync('node scripts/wipe-catalog-fresh.js --confirm WIPE_ALL --skip-backup', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  console.log('Importing tables…');
  for (const table of TABLE_ORDER) {
    await upsertRows(table, bundle.tables[table] || []);
  }

  // Re-link product ↔ POS from source bundle
  const products = bundle.tables.products || [];
  for (const p of products) {
    if (!p.pos_stock_product_id) continue;
    await db.query(`UPDATE products SET pos_stock_product_id = $1 WHERE id = $2`, [
      p.pos_stock_product_id,
      p.id,
    ]);
    await db.query(`UPDATE pos_products SET ecommerce_product_id = $1 WHERE id = $2`, [
      p.id,
      p.pos_stock_product_id,
    ]);
  }

  try {
    const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
    invalidateCatalogueCache();
  } catch {
    /* optional */
  }

  const count = await db.query('SELECT COUNT(*)::int n FROM products');
  console.log(`Done. ${count.rows[0].n} products on live.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
