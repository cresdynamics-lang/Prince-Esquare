require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');

(async () => {
  const [products, sales, sellers, linked, prices] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS c FROM pos_products'),
    db.query('SELECT COUNT(*)::int AS c FROM pos_sales WHERE is_voided = false'),
    db.query(`SELECT full_name, email FROM pos_profiles WHERE role = 'SELLER' ORDER BY email`),
    db.query('SELECT COUNT(*)::int AS c FROM products WHERE pos_stock_product_id IS NOT NULL'),
    db.query('SELECT name, shop_price, sku FROM pos_products ORDER BY name'),
  ]);
  console.log(JSON.stringify({
    posProducts: products.rows[0].c,
    activeSales: sales.rows[0].c,
    sellers: sellers.rows,
    linkedEcommerce: linked.rows[0].c,
    prices: prices.rows,
  }, null, 2));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
