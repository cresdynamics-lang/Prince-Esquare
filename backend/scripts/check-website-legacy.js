require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  const r = await db.query(`
    SELECT p.id, p.name, p.sku, pp.id as pos_id, pp.sku as pos_sku, pp.category as pos_cat,
           COALESCE(sl.current_qty,0) as pos_shop
    FROM products p
    JOIN pos_products pp ON pp.id = p.pos_stock_product_id OR pp.id = (SELECT pos_stock_product_id FROM products p2 WHERE p2.id = p.id)
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    WHERE pp.sku LIKE 'POS-%'
  `);
  console.log('Website products linked to legacy POS buckets:', r.rows.length);
  r.rows.forEach((x) => console.log(x.name, '|', x.pos_sku, '| pos shop', x.pos_shop));

  const pe = await db.query(`
    SELECT category, SUM(COALESCE(s.current_qty,0))::int as shop
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id=p.id
    WHERE p.sku LIKE 'PE-CAT-%' AND p.sku NOT LIKE '%-W-%'
    GROUP BY category ORDER BY category
  `);
  console.log('\nPE-CAT shop totals by category:');
  pe.rows.forEach((x) => console.log(' ', x.category, x.shop));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
