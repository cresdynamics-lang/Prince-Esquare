/**
 * Import products from data/products-export.json
 * Run on Ubuntu after migrations: node scripts/import-products-json.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const filePath = path.join(__dirname, '..', 'data', 'products-export.json');

async function run() {
  if (!fs.existsSync(filePath)) {
    console.error('Missing', filePath);
    process.exit(1);
  }

  const { products } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let count = 0;

  for (const p of products) {
    const images =
      typeof p.images === 'string' ? p.images : JSON.stringify(p.images || []);

    const result = await db.query(
      `INSERT INTO products (name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         discount_price = EXCLUDED.discount_price,
         thumbnail = EXCLUDED.thumbnail,
         images = EXCLUDED.images,
         is_active = EXCLUDED.is_active
       RETURNING id`,
      [
        p.name,
        p.slug,
        p.description,
        p.price,
        p.discount_price,
        p.category_id,
        p.brand_id,
        p.stock_quantity || 0,
        p.is_featured || false,
        p.thumbnail,
        images,
        p.is_active !== false,
      ]
    );

    const productId = result.rows[0].id;
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

    for (const v of p.variants || []) {
      const value = `${v.size || ''} / ${v.color || ''}`;
      await db.query(
        `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, stock_id)
         VALUES ($1, 'Variant', $2, $3, $4, $5, $6, $7, $8)`,
        [
          productId,
          value,
          v.price_override || 0,
          v.stock || 0,
          v.image_url,
          v.color,
          v.size,
          v.stock_id,
        ]
      );
    }
    count += 1;
  }

  console.log(`Imported/updated ${count} products from JSON.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
