/**
 * Restore products removed by purge-placeholder-products.js
 * Uses backend/data/products-export.json (export from dev DB).
 *
 * Usage: node scripts/restore-deleted-products.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const DELETED_SLUGS = [
  'classic-pique-polo-black',
  'santoni-dark-brown-leather-monk-strap',
  'clarks-gereld-tie-tan',
  'prince-esquire-polo-dark-black',
  'prince-esquire-polo-brown',
  'prince-esquire-polo-red',
  'clarks-gereld-tie-black',
  'prince-esquire-polo-white',
  'prince-esquire-polo-light-blue',
  'clarks-gereld-tie-black-v2',
  'dockers-tapered-fit-pants-v2',
  'zegna-tracksuit-grey',
  'santoni-black-slip-on-loafers',
  'prada-tracksuit-black',
  'dockers-tapered-fit-pants',
  'santoni-black-leather-loafers',
  'santoni-navy-blue-loafers',
  'clarks-gereld-tie-tan-v3',
  'presidential-patterned-shirt-green',
  'prada-tracksuit-navy',
  'clarks-gereld-tie-dark-brown-v2',
  'clarks-gereld-tie-dark-brown',
  'santoni-black-slip-on-loafers-v2',
  'santoni-dark-brown-loafers',
  'dockers-tapered-fit-pants-v3',
  'santoni-dark-brown-slip-on-loafers',
  'presidential-paisley-shirt-blue',
  'clarks-black-cap-toe-oxford',
  'santoni-grey-suede-monk-strap',
  'black-puffer-vest',
  'santoni-grey-suede-monk-strap-v2',
  'clarks-dark-brown-penny-loafers',
  'clarks-black-penny-loafers',
  'santoni-dark-brown-monk-strap-v2',
  'santoni-dark-brown-monk-strap',
  'clarks-navy-blue-bit-loafers',
  'clarks-dark-brown-oxford',
  'clarks-dark-brown-bit-loafers',
  'presidential-paisley-shirt-grey',
  'santoni-black-oxford',
  'clarks-black-wingtip-brogue',
  'clarks-dark-brown-wingtip-brogue',
  'clarks-tan-wingtip-brogue',
  'zegna-tracksuit-dark-green',
  'presidential-patterned-shirt-white',
  'clarks-black-textured-bit-loafers',
  'clarks-gereld-tie-tan-v2',
  'clarks-dark-brown-cap-toe-oxford',
];

const filePath = path.join(__dirname, '..', 'data', 'products-export.json');

const resolveCategoryId = async (name) => {
  if (!name) return null;
  const r = await db.query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($2) LIMIT 1`,
    [name, name.replace(/\s+/g, '-').toLowerCase()]
  );
  return r.rows[0]?.id || null;
};

const resolveBrandId = async (name) => {
  if (!name) return null;
  const r = await db.query(
    `SELECT id FROM brands WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  return r.rows[0]?.id || null;
};

(async () => {
  if (!fs.existsSync(filePath)) {
    console.error('Missing', filePath);
    process.exit(1);
  }

  const { products } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const slugSet = new Set(DELETED_SLUGS);
  const toRestore = products.filter((p) => slugSet.has(p.slug));

  console.log(`Found ${toRestore.length} / ${DELETED_SLUGS.length} products in export`);
  const missing = DELETED_SLUGS.filter((s) => !toRestore.some((p) => p.slug === s));
  if (missing.length) console.warn('Missing from export:', missing);

  let restored = 0;
  for (const p of toRestore) {
    const categoryId = await resolveCategoryId(p.category_name);
    const brandId = await resolveBrandId(p.brand_name);
    const images =
      typeof p.images === 'string' ? p.images : JSON.stringify(p.images || []);

    const result = await db.query(
      `INSERT INTO products (
         name, slug, sku, description, price, discount_price, pos_sell_price,
         category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         discount_price = EXCLUDED.discount_price,
         category_id = EXCLUDED.category_id,
         brand_id = EXCLUDED.brand_id,
         stock_quantity = EXCLUDED.stock_quantity,
         is_featured = EXCLUDED.is_featured,
         is_active = EXCLUDED.is_active,
         thumbnail = EXCLUDED.thumbnail,
         images = EXCLUDED.images,
         sku = COALESCE(EXCLUDED.sku, products.sku)
       RETURNING id`,
      [
        p.name,
        p.slug,
        p.sku || null,
        p.description,
        p.price || 0,
        p.discount_price,
        p.pos_sell_price || null,
        categoryId,
        brandId,
        p.stock_quantity || 0,
        p.is_featured || false,
        p.is_active !== false,
        p.thumbnail,
        images,
      ]
    );

    const productId = result.rows[0].id;
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

    for (const v of p.variants || []) {
      const value = `${v.size || ''} / ${v.color || ''}`;
      await db.query(
        `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id)
         VALUES ($1, 'Variant', $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          productId,
          value,
          v.price_override || 0,
          v.stock || 0,
          v.image_url || null,
          v.color || null,
          v.size || null,
          v.stock_id || v.sku || null,
          v.stock_id || v.sku || null,
        ]
      );
    }
    restored += 1;
    console.log(`Restored: ${p.name}`);
  }

  const total = await db.query('SELECT COUNT(*)::int AS c FROM products WHERE is_active = true');
  console.log(`Done. Restored ${restored} products. Active on site: ${total.rows[0].c}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
