require('dotenv').config({ quiet: true });
const db = require('../src/config/db');

(async () => {
  const r = await db.query(`
    SELECT p.id, p.is_active, p.slug, p.stock_quantity, c.name AS cat, c.slug AS cat_slug,
           (SELECT COUNT(*)::int FROM product_variants pv WHERE pv.product_id = p.id) AS variant_count,
           (SELECT COALESCE(SUM(stock_quantity), 0)::bigint FROM product_variants pv WHERE pv.product_id = p.id) AS variant_sum
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug ILIKE '%black-smart%' OR p.name ILIKE '%black smart%'
  `);
  console.log(JSON.stringify(r.rows, null, 2));

  for (const row of r.rows) {
    const v = await db.query(
      `SELECT id, color, size, stock_quantity FROM product_variants WHERE product_id = $1 ORDER BY size LIMIT 20`,
      [row.id]
    );
    console.log('variants', row.slug, v.rows);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
