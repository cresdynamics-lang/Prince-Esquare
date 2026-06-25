require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const web = await db.query(`
    SELECT p.id, p.name, p.slug, p.sku, p.is_active, p.pos_stock_product_id, c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND (c.slug = 'belts-ties' OR p.slug ILIKE '%belt%')
    ORDER BY p.name
  `);
  console.log('=== Active website belts ===');
  console.table(web.rows);

  const pos = await db.query(`
    SELECT pp.id, pp.name, pp.sku, pp.category, pp.ecommerce_product_id,
           s.current_qty,
           p.slug AS web_slug, p.pos_stock_product_id
    FROM pos_products pp
    LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
    LEFT JOIN products p ON p.id = pp.ecommerce_product_id
    WHERE pp.ecommerce_product_id IN (
      SELECT id FROM products WHERE slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
         OR (is_active = true AND category_id IN (SELECT id FROM categories WHERE slug = 'belts-ties'))
    )
       OR pp.name ILIKE '%belt%'
       OR pp.category ILIKE '%belt%'
  `);
  console.log('=== POS belt rows ===');
  console.table(pos.rows);

  const managed = await db.query(`
    SELECT pp.id, pp.name, pp.sku, pp.category, pp.ecommerce_product_id, s.current_qty
    FROM pos_products pp
    LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
    WHERE pp.sku NOT LIKE 'POS-%' AND pp.ecommerce_product_id IS NOT NULL
      AND (pp.category ILIKE '%belt%' OR pp.name ILIKE '%belt%')
  `);
  console.log('=== Managed inventory filter (belts) ===');
  console.table(managed.rows);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
