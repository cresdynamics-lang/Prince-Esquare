/**
 * Export products + variants to JSON (for backup / Ubuntu sync).
 * Run: node scripts/export-products-json.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { applyProductImageOptimization } = require('../src/utils/cloudinaryImage');

async function run() {
  const productsRes = await db.query(
    `SELECT p.*, c.name AS category_name, b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     ORDER BY p.created_at DESC`
  );

  const variantsRes = await db.query('SELECT * FROM product_variants ORDER BY product_id, color, size');
  const byProduct = {};
  for (const v of variantsRes.rows) {
    if (!byProduct[v.product_id]) byProduct[v.product_id] = [];
    byProduct[v.product_id].push({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock_quantity,
      price_override: v.price_modifier,
      image_url: v.image_url,
      stock_id: v.stock_id,
    });
  }

  const catalog = productsRes.rows.map((p) => {
    const product = applyProductImageOptimization({ ...p });
    product.variants = byProduct[p.id] || [];
    return product;
  });

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'products-export.json');
  fs.writeFileSync(outPath, JSON.stringify({ exported_at: new Date().toISOString(), products: catalog }, null, 2));

  console.log(`Exported ${catalog.length} products → ${outPath}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
