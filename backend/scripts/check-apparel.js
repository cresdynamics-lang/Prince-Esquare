require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const cat = await db.query(`
    SELECT p.category,
           COUNT(*)::int AS pieces,
           SUM(COALESCE(s.current_qty,0))::int AS shop_qty,
           SUM(COALESCE(snap.opening_qty, s.current_qty, 0))::int AS opening_sum,
           SUM(COALESCE(snap.closing_qty, s.current_qty, 0))::int AS closing_sum
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_daily_stock_snapshots snap ON snap.product_id = p.id AND snap.date = CURRENT_DATE
    WHERE p.category ILIKE '%apparel%'
    GROUP BY p.category
  `);
  console.log('Apparel categories:', JSON.stringify(cat.rows, null, 2));

  const sample = await db.query(`
    SELECT p.name, p.sku, p.category, s.current_qty, snap.opening_qty, snap.closing_qty
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_daily_stock_snapshots snap ON snap.product_id = p.id AND snap.date = CURRENT_DATE
    WHERE p.category = 'Apparel'
    ORDER BY COALESCE(snap.opening_qty,0) DESC
    LIMIT 25
  `);
  console.log('Apparel products:', JSON.stringify(sample.rows, null, 2));

  const overlap = await db.query(`
    SELECT p.category, p.sku LIKE 'PE-CAT-%' AS is_catalog,
           COUNT(*)::int AS cnt,
           SUM(COALESCE(s.current_qty,0))::int AS shop_qty
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    WHERE p.sku LIKE 'POS-%' OR p.sku LIKE 'PE-CAT-%'
    GROUP BY p.category, (p.sku LIKE 'PE-CAT-%')
    ORDER BY p.category, is_catalog
  `);
  console.log('Legacy vs catalog by category:', JSON.stringify(overlap.rows, null, 2));

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
