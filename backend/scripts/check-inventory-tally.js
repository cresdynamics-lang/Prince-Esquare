require('dotenv').config();
const db = require('../src/config/db');
const posStockCatalog = require('../src/db/seeds/posStockCatalog');
const { warehouseCountFor } = require('../src/services/inventoryWarehouseSync');

async function main() {
  const r = await db.query(`
    SELECT p.category,
           COUNT(*) FILTER (WHERE p.sku NOT LIKE '%-W-%')::int AS shop_pieces,
           COUNT(*) FILTER (WHERE p.sku LIKE '%-W-%')::int AS wh_pieces,
           SUM(COALESCE(s.current_qty, 0))::int AS shop_qty,
           SUM(COALESCE(st.current_qty, 0))::int AS store_qty,
           COUNT(*)::int AS total_pieces
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    WHERE p.sku NOT LIKE 'POS-%'
    GROUP BY p.category
    ORDER BY p.category
  `);

  const by = Object.fromEntries(r.rows.map((x) => [x.category, x]));

  console.log('\n=== PE-CAT catalog vs stock sheet ===\n');
  console.log('Category'.padEnd(18), 'Target', 'ShopQty', 'StoreQty', 'WhTarget', 'ShopPc', 'WhPc', 'Status');
  console.log('-'.repeat(85));

  let shopMismatch = 0;
  let storeMismatch = 0;
  for (const row of posStockCatalog.filter((c) => c.closing > 0)) {
    const a = by[row.name] || {};
    const whTarget = warehouseCountFor(row.closing);
    const shopOk = (a.shop_qty || 0) === row.closing;
    const storeOk = (a.store_qty || 0) === whTarget;
    if (!shopOk) shopMismatch += 1;
    if (!storeOk) storeMismatch += 1;
    const status = shopOk && storeOk ? 'OK' : [!shopOk && 'SHOP', !storeOk && 'STORE'].filter(Boolean).join('+');
    console.log(
      String(row.name).padEnd(18),
      String(row.closing).padStart(5),
      String(a.shop_qty || 0).padStart(7),
      String(a.store_qty || 0).padStart(8),
      String(whTarget).padStart(8),
      String(a.shop_pieces || 0).padStart(6),
      String(a.wh_pieces || 0).padStart(5),
      status
    );
  }

  const leg = await db.query(`
    SELECT category, COUNT(*)::int AS n, SUM(COALESCE(s.current_qty, 0))::int AS shop_qty
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    WHERE sku LIKE 'POS-%'
    GROUP BY category
    ORDER BY category
  `);

  console.log('\n=== Legacy POS-% bucket rows (excluded from Stock Summary) ===\n');
  if (!leg.rows.length) console.log('  (none)');
  else leg.rows.forEach((x) => console.log(`  ${x.category}: ${x.n} rows, shop qty sum ${x.shop_qty}`));

  const dupCats = await db.query(`
    SELECT category, COUNT(DISTINCT CASE WHEN sku LIKE 'PE-CAT-%' THEN 'pe' WHEN sku LIKE 'POS-%' THEN 'pos' END) AS sources
    FROM pos_products
    GROUP BY category
    HAVING COUNT(DISTINCT CASE WHEN sku LIKE 'PE-CAT-%' THEN 'pe' WHEN sku LIKE 'POS-%' THEN 'pos' END) > 1
  `);
  console.log('\n=== Categories with BOTH legacy + PE-CAT data ===\n');
  if (!dupCats.rows.length) console.log('  (none)');
  else dupCats.rows.forEach((x) => console.log(`  ${x.category}`));

  const today = new Date().toISOString().slice(0, 10);
  const sheet = await db.query(`
    SELECT p.category AS name,
           SUM(COALESCE(lvl.current_qty, 0))::int AS closing_qty,
           SUM(COALESCE(st.current_qty, 0))::int AS store_qty,
           COUNT(*)::int AS piece_count
    FROM pos_products p
    LEFT JOIN pos_stock_levels lvl ON lvl.product_id = p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    WHERE p.sku NOT LIKE 'POS-%'
    GROUP BY p.category
    ORDER BY p.category
  `);

  console.log('\n=== Stock Summary closing vs target (first 5 mismatches) ===\n');
  let mm = 0;
  for (const row of posStockCatalog.filter((c) => c.closing > 0)) {
    const s = sheet.rows.find((x) => x.name === row.name);
    if (s && s.closing_qty !== row.closing) {
      console.log(`  ${row.name}: summary closing ${s.closing_qty} vs target ${row.closing} (pieces listed: ${s.piece_count})`);
      mm += 1;
    }
  }
  if (!mm) console.log('  All closing totals match targets');

  console.log(`\nSummary: ${shopMismatch} shop mismatches, ${storeMismatch} store mismatches\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
