require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  const r = await db.query(`
    SELECT p.id, p.name, p.sku, p.category, p.ecommerce_product_id,
           COALESCE(s.current_qty,0) as shop, COALESCE(st.current_qty,0) as store
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id=p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id=p.id
    WHERE p.sku LIKE 'POS-%'
    ORDER BY p.category, p.sku
  `);
  console.log('Legacy rows:', r.rows.length);
  r.rows.forEach((x) => console.log(x.category, x.sku, 'shop', x.shop, 'web', x.ecommerce_product_id || 'none'));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
