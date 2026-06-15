/**
 * Import khaki trousers from backend/data/khaki-trousers.json
 *
 * Usage:
 *   node scripts/generate-khaki-specs.js
 *   node scripts/build-khaki-catalog.js
 *   node scripts/import-khaki-catalog.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const SIZES = ['30', '32', '34', '36', '38', '40'];
const STOCK_PER_SIZE = 6;

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'khaki-trousers.json');
const IMAGES_DIR = path.join(__dirname, '..', 'data', 'khaki-trouser-images');

async function ensureCategory(name, parentId = null) {
  const byParent = await db.query(
    'SELECT id FROM categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2',
    [name, parentId]
  );
  if (byParent.rows.length) return byParent.rows[0].id;

  let slug = slugify(name);
  if (parentId) {
    const parent = await db.query('SELECT slug FROM categories WHERE id = $1', [parentId]);
    const parentSlug = parent.rows[0]?.slug || 'category';
    slug = `${parentSlug}-${slugify(name)}`;
  }

  const found = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;

  const result = await db.query(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, slug, `${name} — Prince Esquire`, parentId]
  );
  return result.rows[0].id;
}

async function ensureBrand(name) {
  const brandName = name || 'Prince Esquire';
  const slug = slugify(brandName);
  const found = await db.query('SELECT id FROM brands WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;
  const result = await db.query(
    'INSERT INTO brands (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [brandName, slug, brandName]
  );
  return result.rows[0].id;
}

async function uploadImage(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await uploadToCloudinary(buffer, undefined, 'image/png');
  return result.secure_url || result.url;
}

async function run() {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error('Missing catalog. Run: node scripts/build-khaki-catalog.js');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const trousersParentId = await ensureCategory('Trousers');
  const khakiId = await ensureCategory('Khaki', trousersParentId);

  let imported = 0;
  let skipped = 0;

  for (const item of products) {
    const imagePath = path.join(IMAGES_DIR, item.image);
    if (!fs.existsSync(imagePath)) {
      console.warn(`SKIP (missing image): ${item.name}`);
      skipped += 1;
      continue;
    }

    console.log(`[Khaki] ${item.name}`);

    const imageUrl = await uploadImage(imagePath);
    const brandId = await ensureBrand(item.brand);
    const productSku = generateProductSku({ name: item.name, slug: item.slug });

    const result = await db.query(
      `INSERT INTO products (name, slug, sku, description, price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         sku = EXCLUDED.sku,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         category_id = EXCLUDED.category_id,
         brand_id = EXCLUDED.brand_id,
         thumbnail = EXCLUDED.thumbnail,
         images = EXCLUDED.images,
         is_featured = EXCLUDED.is_featured,
         is_active = true
       RETURNING id`,
      [
        item.name,
        item.slug,
        productSku,
        item.description,
        item.price,
        khakiId,
        brandId,
        SIZES.length * STOCK_PER_SIZE,
        Boolean(item.featured),
        imageUrl,
        JSON.stringify([{ url: imageUrl, alt: item.name }]),
      ]
    );

    const productId = result.rows[0].id;
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

    for (const size of SIZES) {
      const variant = { size, color: item.color, image_url: imageUrl };
      const variantSku = generateVariantSku(productSku, variant);
      await db.query(
        `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id)
         VALUES ($1, 'Variant', $2, 0, $3, $4, $5, $6, $7, $8)`,
        [
          productId,
          `Waist ${size} / ${item.color}`,
          STOCK_PER_SIZE,
          imageUrl,
          item.color,
          size,
          variantSku,
          variantSku,
        ]
      );
    }

    imported += 1;
  }

  invalidateCatalogueCache();
  console.log(`Done. Imported/updated ${imported} khaki trousers (${skipped} skipped).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('import-khaki-catalog failed:', err);
  process.exit(1);
});
