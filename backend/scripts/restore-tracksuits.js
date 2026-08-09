#!/usr/bin/env node
/**
 * Restore KES 8,000 tracksuits (featured) from pos_products.website_details + Moncler pair.
 * Usage: node scripts/restore-tracksuits.js
 */
require('dotenv').config();
const db = require('../src/config/db');

const PRICE = 8000;
const CATEGORY_ID = 'cc0c59b4-394e-47fd-8da2-d465d764303a'; // Track Suits

const SLUGS = {
  'PRADA BLACK ZIP-UP TRACKSUIT SET': 'prada-black-tracksuit-753',
  'PRADA WHITE RED-STRIPE TRACKSUIT SET': 'prada-white-red-stripe-tracksuit-a68',
  'PRADA WHITE ZIP-UP TRACKSUIT SET': 'prada-white-tracksuit-753',
  'STEFANO RICCI DARK GREEN TRACKSUIT SET': 'stefano-ricci-dark-green-tracksuit-20303',
  'ZEGNA BLACK HOODED TRACKSUIT SET': 'zegna-black-hooded-tracksuit-m024',
};

const MONCLER = [
  {
    name: 'Moncler Tricolor Zip-Up Sportswear Tracksuit - Alpine White',
    slug: 'moncler-tricolor-zip-up-tracksuit-alpine-white',
    thumbnail: '/images/products/WhatsApp Image 2026-07-01 at 17.48.56.jpg',
    description:
      'Moncler tricolor zip tracksuit in alpine white with signature sleeve stripes — premium sport-luxe for travel and elevated casual wear.\n\nAvailable at Prince Esquire, Nairobi.',
    brandName: 'Prince Esquire',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    name: 'Moncler Tricolor Zip-Up Sportswear Tracksuit - Onyx Black',
    slug: 'moncler-tricolor-zip-up-tracksuit-onyx-black',
    thumbnail: '/images/products/WhatsApp Image 2026-07-01 at 17.48.57.jpg',
    description:
      'Moncler tricolor zip tracksuit in onyx black with iconic contrast stripes — refined athleisure for weekends and travel.\n\nAvailable at Prince Esquire, Nairobi.',
    brandName: 'Prince Esquire',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
];

function imagesJson(thumbnail) {
  return JSON.stringify([
    { url: thumbnail, optimized: thumbnail, thumbnail },
  ]);
}

async function getBrandId(name) {
  const r = await db.query('SELECT id FROM brands WHERE name ILIKE $1 LIMIT 1', [name]);
  return r.rows[0]?.id || null;
}

async function insertVariants(productId, variants, defaultImage, client = db) {
  for (const v of variants) {
    const size = v.size || v.value || 'One Size';
    const color = v.color || 'Default';
    const stock = Number(v.stock ?? v.stock_quantity ?? 0);
    await client.query(
      `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, color, size, image_url)
       VALUES ($1, 'Size', $2, 0, $3, $4, $2, $5)`,
      [productId, size, stock, color, v.image_url || defaultImage]
    );
  }
}

async function restoreFromPos(row, client) {
  const wd = row.website_details;
  if (!wd) return null;

  const slug = SLUGS[row.name];
  if (!slug) return null;

  const existing = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
  const stockTotal = sumStock(wd.variants);

  if (existing.rows.length) {
    const upd = await client.query(
      `UPDATE products SET price = $1, is_featured = true, is_active = true, stock_quantity = $2,
       thumbnail = $3, images = $4, description = COALESCE($5, description), brand_id = COALESCE($6, brand_id),
       category_id = COALESCE($7, category_id), updated_at = NOW()
       WHERE slug = $8 RETURNING id`,
      [
        PRICE,
        stockTotal,
        wd.thumbnail,
        imagesJson(wd.thumbnail),
        wd.description,
        wd.brand_id,
        wd.category_id || CATEGORY_ID,
        slug,
      ]
    );
    productId = upd.rows[0].id;
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
    await insertVariants(productId, wd.variants || [], wd.thumbnail, client);
    await client.query('UPDATE pos_products SET ecommerce_product_id = $1, online_price = $2 WHERE id = $3', [
      productId,
      PRICE,
      row.id,
    ]);
    return { slug, productId, action: 'updated' };
  }

  const ins = await client.query(
    `INSERT INTO products (
      name, slug, description, price, discount_price, category_id, brand_id,
      stock_quantity, is_featured, is_active, thumbnail, images
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true,$9,$10)
    RETURNING id`,
    [
      row.name,
      slug,
      wd.description || row.name,
      PRICE,
      wd.discount_price || null,
      wd.category_id || CATEGORY_ID,
      wd.brand_id,
      stockTotal,
      wd.thumbnail,
      imagesJson(wd.thumbnail),
    ]
  );
  const newId = ins.rows[0].id;
  await insertVariants(newId, wd.variants || [], wd.thumbnail, client);
  await client.query('UPDATE pos_products SET ecommerce_product_id = $1, online_price = $2 WHERE id = $3', [
    newId,
    PRICE,
    row.id,
  ]);
  return { slug, productId: newId, action: 'created' };
}

function sumStock(variants = []) {
  return variants.reduce((n, v) => n + Number(v.stock ?? v.stock_quantity ?? 0), 0);
}

async function restoreMoncler(item, client) {
  const existing = await client.query('SELECT id FROM products WHERE slug = $1', [item.slug]);
  const brandId = await getBrandId(item.brandName);
  const stock = item.sizes.length * 8;

  if (existing.rows.length) {
    const upd = await client.query(
      `UPDATE products SET price = $1, is_featured = true, is_active = true, stock_quantity = $2,
       thumbnail = $3, images = $4, description = $5, brand_id = $6, updated_at = NOW()
       WHERE slug = $7 RETURNING id`,
      [PRICE, stock, item.thumbnail, imagesJson(item.thumbnail), item.description, brandId, item.slug]
    );
    const productId = upd.rows[0].id;
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
    for (const size of item.sizes) {
      await client.query(
        `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, color, size, image_url)
         VALUES ($1, 'Size', $2, 0, 8, 'Default', $2, $3)`,
        [productId, size, item.thumbnail]
      );
    }
    return { slug: item.slug, productId, action: 'updated' };
  }

  const ins = await client.query(
    `INSERT INTO products (
      name, slug, description, price, category_id, brand_id,
      stock_quantity, is_featured, is_active, thumbnail, images
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,true,$8,$9)
    RETURNING id`,
    [
      item.name,
      item.slug,
      item.description,
      PRICE,
      CATEGORY_ID,
      brandId,
      stock,
      item.thumbnail,
      imagesJson(item.thumbnail),
    ]
  );
  const productId = ins.rows[0].id;
  for (const size of item.sizes) {
    await client.query(
      `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, color, size, image_url)
       VALUES ($1, 'Size', $2, 0, 8, 'Default', $2, $3)`,
      [productId, size, item.thumbnail]
    );
  }
  return { slug: item.slug, productId, action: 'created' };
}

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const pos = await client.query(
      `SELECT id, name, website_details FROM pos_products WHERE name ILIKE '%TRACKSUIT%' ORDER BY name`
    );

    const results = [];
    for (const row of pos.rows) {
      const r = await restoreFromPos(row, client);
      if (r) results.push(r);
    }

    for (const item of MONCLER) {
      results.push(await restoreMoncler(item, client));
    }

    // Demote other featured in track suits category so these lead the row
    await client.query(
      `UPDATE products SET is_featured = false
       WHERE category_id = $1
         AND slug NOT IN (
           'prada-black-tracksuit-753','prada-white-red-stripe-tracksuit-a68',
           'prada-white-tracksuit-753','stefano-ricci-dark-green-tracksuit-20303',
           'zegna-black-hooded-tracksuit-m024',
           'moncler-tricolor-zip-up-tracksuit-alpine-white',
           'moncler-tricolor-zip-up-tracksuit-onyx-black'
         )`,
      [CATEGORY_ID]
    );

    await client.query('COMMIT');
    console.log('Restored tracksuits:', results.length);
    results.forEach((r) => console.log(' ', r.action, r.slug));
    process.exit(0);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
  }
}

main();
