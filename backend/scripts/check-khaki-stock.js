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
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
