require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  const shirt = await db.query(`
    SELECT p.id, p.name, p.stock_quantity, pp.sku, COALESCE(sl.current_qty,0)::int as pos_shop
    FROM products p
    JOIN pos_products pp ON pp.id = p.pos_stock_product_id
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    WHERE pp.sku = 'POS-SHIRTS'
    LIMIT 1
  `);
  if (!shirt.rows[0]) return console.log('No shirt product');
  const pid = shirt.rows[0].id;
  console.log('Product:', shirt.rows[0]);
  const vars = await db.query(
    `SELECT id, size, color, stock_quantity FROM product_variants WHERE product_id = $1 ORDER BY size`,
    [pid]
  );
  console.log('Variants:', vars.rows);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
