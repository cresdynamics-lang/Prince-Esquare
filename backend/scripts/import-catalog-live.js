/**
 * Replace live catalog with catalog-live-sync.json.
 * Keeps existing categories/brands on server; remaps FKs by slug.
 * Usage: node scripts/import-catalog-live.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../src/config/db');

const filePath = path.join(__dirname, '..', 'data', 'catalog-live-sync.json');

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

async function upsertRow(table, row, conflictKey) {
  const { names, jsonb } = await getColumnMeta(table);
  const keys = Object.keys(row).filter((k) => names.has(k));
  const values = keys.map((k) => serialize(row[k], jsonb.has(k)));
  const placeholders = keys.map((k, i) => (jsonb.has(k) ? `$${i + 1}::jsonb` : `$${i + 1}`));
  const updates = keys.filter((k) => k !== conflictKey).map((k) => `${k} = EXCLUDED.${k}`).join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
    ON CONFLICT (${conflictKey}) DO UPDATE SET ${updates}`;
  await db.query(sql, values);
}

async function upsertMany(table, rows, conflictKey) {
  let ok = 0;
  let err = 0;
  for (const row of rows) {
    try {
      await upsertRow(table, row, conflictKey);
      ok += 1;
    } catch (e) {
      err += 1;
      if (err <= 3) console.error(`  ${table} error:`, e.message);
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

  const localCats = bundle.tables.categories || [];
  const localBrands = bundle.tables.brands || [];
  const localCatIdToSlug = Object.fromEntries(localCats.map((c) => [c.id, c.slug]));
  const localBrandIdToSlug = Object.fromEntries(localBrands.map((b) => [b.id, b.slug]));

  const prodCats = await db.query('SELECT id, slug FROM categories');
  const prodBrands = await db.query('SELECT id, slug FROM brands');
  const catSlugToId = Object.fromEntries(prodCats.rows.map((c) => [c.slug, c.id]));
  const brandSlugToId = Object.fromEntries(prodBrands.rows.map((b) => [b.slug, b.id]));

  const mapCat = (localId) => {
    const slug = localCatIdToSlug[localId];
    return slug ? catSlugToId[slug] : null;
  };
  const mapBrand = (localId) => {
    const slug = localBrandIdToSlug[localId];
    return slug ? brandSlugToId[slug] : null;
  };

  // Insert missing categories/brands by slug (new items from local only)
  for (const c of localCats) {
    if (catSlugToId[c.slug]) continue;
    try {
      await upsertRow('categories', c, 'id');
      catSlugToId[c.slug] = c.id;
    } catch (e) {
      console.warn(`  skip new category ${c.slug}:`, e.message);
    }
  }
  for (const b of localBrands) {
    if (brandSlugToId[b.slug]) continue;
    try {
      await upsertRow('brands', b, 'id');
      brandSlugToId[b.slug] = b.id;
    } catch (e) {
      console.warn(`  skip new brand ${b.slug}:`, e.message);
    }
  }

  execSync('node scripts/wipe-catalog-fresh.js --confirm WIPE_ALL --skip-backup', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  const products = (bundle.tables.products || []).map((p) => ({
    ...p,
    pos_stock_product_id: null,
    category_id: mapCat(p.category_id),
    brand_id: mapBrand(p.brand_id),
  }));

  await upsertMany('products', products, 'id');
  await upsertMany('product_variants', bundle.tables.product_variants || [], 'id');
  await upsertMany('pos_products', bundle.tables.pos_products || [], 'id');
  await upsertMany('pos_stock_levels', bundle.tables.pos_stock_levels || [], 'product_id');
  await upsertMany('pos_store_stock_levels', bundle.tables.pos_store_stock_levels || [], 'product_id');

  for (const p of bundle.tables.products || []) {
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

  // Remove products on live that are not in local bundle
  const keepIds = products.map((p) => p.id);
  const removed = await db.query(
    `DELETE FROM products WHERE NOT (id = ANY($1::uuid[])) RETURNING id`,
    [keepIds]
  );
  console.log(`  removed orphan products: ${removed.rowCount}`);

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
