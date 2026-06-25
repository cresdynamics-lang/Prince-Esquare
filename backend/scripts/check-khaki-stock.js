require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const variants = await db.query(`
    SELECT p.name, p.slug, pv.color, pv.size, pv.stock_quantity,
           pp.id AS pos_id, pp.sku AS pos_sku, s.current_qty AS pos_shop_qty
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
    LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
    WHERE p.is_active = true
      AND (c.slug ILIKE '%khaki%' OR c.name ILIKE '%khaki%' OR p.name ILIKE '%khaki%')
    ORDER BY p.name, pv.color, pv.size
    LIMIT 40
  `);

  const high = await db.query(`
    SELECT p.name, p.slug, pv.color, pv.size, pv.stock_quantity
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND (c.slug ILIKE '%khaki%' OR c.name ILIKE '%khaki%')
      AND pv.stock_quantity > 20
    ORDER BY pv.stock_quantity DESC
    LIMIT 20
  `);

  console.log('=== Khaki variants (sample) ===');
  console.table(variants.rows);
  console.log('=== Khaki variants with stock > 20 ===');
  console.table(high.rows);

  const posAll = await db.query(`
    SELECT pp.name, pp.sku, pp.category, s.current_qty
    FROM pos_products pp
    LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
    WHERE pp.category ILIKE '%khaki%' OR pp.sku ILIKE '%KHAKI%'
    ORDER BY s.current_qty DESC NULLS LAST
    LIMIT 30
  `);
  console.log('=== All POS khaki-related rows ===');
  console.table(posAll.rows);

  const peCat = await db.query(`
    SELECT pp.name, pp.sku, s.current_qty
    FROM pos_products pp
    LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
    WHERE pp.sku LIKE 'PE-CAT-%'
      AND (pp.category ILIKE '%khaki%' OR pp.name ILIKE '%khaki%')
    ORDER BY s.current_qty DESC
    LIMIT 20
  `);
  console.log('=== PE-CAT khaki pieces ===');
  console.table(peCat.rows);

  const legacy = await db.query(`
    SELECT pp.sku, s.current_qty
    FROM pos_products pp
    LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
    WHERE pp.sku IN ('POS-KHAKIS', 'POS-KHAKI')
  `);
  console.log('=== Legacy POS-KHAKIS bucket ===');
  console.table(legacy.rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
