require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  const web = await db.query(`
    SELECT COUNT(*) FILTER (WHERE stock_quantity = 0)::int AS zero,
           COUNT(*) FILTER (WHERE stock_quantity > 0)::int AS instock,
           COUNT(*)::int AS total
    FROM products WHERE is_active = true
  `);
  console.log('Active website products:', web.rows[0]);

  const byLink = await db.query(`
    SELECT pp.sku,
           COUNT(p.id)::int AS web_count,
           MIN(p.stock_quantity)::int AS min_stock,
           MAX(p.stock_quantity)::int AS max_stock,
           MAX(COALESCE(sl.current_qty, 0))::int AS pos_shop
    FROM products p
    JOIN pos_products pp ON pp.id = p.pos_stock_product_id
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    WHERE p.is_active = true
    GROUP BY pp.sku
    ORDER BY web_count DESC
    LIMIT 15
  `);
  console.log('\nWebsite stock by POS link:');
  byLink.rows.forEach((r) =>
    console.log(`  ${r.sku}: ${r.web_count} products, web stock ${r.min_stock}-${r.max_stock}, pos shop ${r.pos_shop}`)
  );

  const variants = await db.query(`
    SELECT COUNT(*) FILTER (WHERE pv.stock_quantity = 0)::int AS zero,
           COUNT(*) FILTER (WHERE pv.stock_quantity > 0)::int AS instock
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id AND p.is_active = true
  `);
  console.log('\nActive variant rows:', variants.rows[0]);

  const sample = await db.query(`
    SELECT p.name, p.stock_quantity, pp.sku, COALESCE(sl.current_qty,0)::int as pos_shop
    FROM products p
    LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    WHERE p.is_active = true
    ORDER BY p.stock_quantity ASC, p.name
    LIMIT 8
  `);
  console.log('\nSample low-stock website products:');
  sample.rows.forEach((r) => console.log(`  ${r.name} | web ${r.stock_quantity} | ${r.sku} pos ${r.pos_shop}`));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
