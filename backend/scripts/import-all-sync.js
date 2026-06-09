/**
 * Import full-sync.json onto live DB (UPSERT — does not drop tables).
 * Usage: node scripts/import-all-sync.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const filePath = path.join(__dirname, '..', 'data', 'full-sync.json');
const BATCH = 75;

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

const columnCache = new Map();

async function getColumnMeta(table) {
  if (columnCache.has(table)) return columnCache.get(table);
  const r = await db.query(
    `SELECT column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  const names = new Set(r.rows.map((x) => x.column_name));
  const jsonb = new Set(r.rows.filter((x) => x.udt_name === 'jsonb').map((x) => x.column_name));
  const meta = { names, jsonb };
  columnCache.set(table, meta);
  return meta;
}

function serialize(val, isJsonb) {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  if (isJsonb && typeof val === 'object') return JSON.stringify(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

async function upsertRows(table, rows) {
  if (!rows?.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return { ok: 0, err: 0 };
  }

  const { names: targetCols, jsonb: jsonbCols } = await getColumnMeta(table);
  const conflict = CONFLICT_KEY[table] || 'id';
  let ok = 0;
  let err = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    for (const row of chunk) {
      const keys = Object.keys(row).filter((k) => targetCols.has(k));
      if (!keys.length) continue;

      const values = keys.map((k) => serialize(row[k], jsonbCols.has(k)));
      const placeholders = keys.map((k, idx) =>
        jsonbCols.has(k) ? `$${idx + 1}::jsonb` : `$${idx + 1}`
      );
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

      try {
        await db.query(sql, values);
        ok += 1;
      } catch (e) {
        err += 1;
        if (err <= 3) {
          console.error(`  ${table} row error:`, e.message);
        }
      }
    }
    if (rows.length > BATCH) {
      process.stdout.write(`\r  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }
  if (rows.length > BATCH) process.stdout.write('\n');
  console.log(`  ${table}: ${ok} ok, ${err} errors`);
  return { ok, err };
}

async function countTable(table) {
  const r = await db.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
  return r.rows[0].c;
}

async function printCounts(label) {
  const tables = ['products', 'product_variants', 'pos_products', 'pos_stock_levels'];
  const parts = [];
  for (const t of tables) {
    try {
      parts.push(`${t}=${await countTable(t)}`);
    } catch {
      parts.push(`${t}=?`);
    }
  }
  console.log(`${label}: ${parts.join(', ')}`);
}

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error('\n❌ MISSING FILE:', filePath);
    console.error('\nOn your PC run:  cd backend && npm run sync:export');
    console.error('Upload full-sync.json to server with WinSCP:');
    console.error('  Local:  backend/data/full-sync.json');
    console.error('  Server: /var/www/Prince-Esquare/backend/data/full-sync.json\n');
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  console.log(`Bundle: ${filePath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('Exported:', bundle.exported_at || 'unknown');

  console.log('\nBefore import:');
  await printCounts('');

  console.log('\nRunning migrations…');
  const { execSync } = require('child_process');
  execSync('node src/db/migrate.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  console.log('\nImporting…');
  let totalErr = 0;
  for (const table of TABLE_ORDER) {
    const { err } = await upsertRows(table, bundle.tables?.[table] || []);
    totalErr += err;
  }

  console.log('\nAfter import:');
  await printCounts('');

  const peCat = await db.query(
    `SELECT COUNT(*)::int AS c FROM pos_products WHERE sku LIKE 'PE-CAT-%'`
  );
  const linked = await db.query(
    `SELECT COUNT(*)::int AS c FROM products WHERE pos_stock_product_id IS NOT NULL`
  );
  const inStock = await db.query(
    `SELECT COUNT(*)::int AS c FROM pos_stock_levels WHERE current_qty > 0`
  );
  console.log(
    `PE-CAT pieces: ${peCat.rows[0].c}, linked website products: ${linked.rows[0].c}, shop qty>0: ${inStock.rows[0].c}`
  );

  if (totalErr > 0) {
    console.warn(`\n⚠ ${totalErr} row errors — check messages above.`);
  }

  console.log('\nRe-linking website ↔ POS…');
  const { autoLinkAllProducts } = require('../src/services/productPosLink');
  const link = await autoLinkAllProducts();
  console.log(`Linked ${link.linked}, reconciled ${link.reconciled}`);

  if (peCat.rows[0].c === 0) {
    console.error('\n❌ No PE-CAT inventory on server. Import did not load pos_products.');
    process.exit(1);
  }

  console.log('\n✅ Import complete. Restart API: pm2 restart all');
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
