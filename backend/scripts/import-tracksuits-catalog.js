/**
 * Import tracksuits from backend/data/tracksuits.json
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const STOCK_PER_SIZE = 5;

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'tracksuits.json');
const IMAGES_DIR = path.join(__dirname, '..', 'data', 'tracksuits-images');

async function ensureTracksuitsCategory() {
  const found = await db.query("SELECT id FROM categories WHERE slug = 'track-suits'");
  if (found.rows.length) return found.rows[0].id;

  const byName = await db.query("SELECT id FROM categories WHERE name ILIKE '%track%suit%' OR name ILIKE '%track%suit%' LIMIT 1");
  if (byName.rows.length) return byName.rows[0].id;

  const result = await db.query(
    "INSERT INTO categories (name, slug, description, parent_id) VALUES ('Track suits', 'track-suits', 'Track suits — Prince Esquire', NULL) RETURNING id"
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
    console.error('Missing catalog. Run: node scripts/build-tracksuits-catalog.js');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const categoryId = await ensureTracksuitsCategory();

  let imported = 0;
  let skipped = 0;

  for (const item of products) {
    const imagePath = path.join(IMAGES_DIR, item.image);
    if (!fs.existsSync(imagePath)) {
      console.warn(`SKIP (missing image): ${item.name}`);
      skipped += 1;
      continue;
    }

    console.log(`[Tracksuits] ${item.name}`);

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
        categoryId,
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
          `${size} / ${item.color}`,
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
  console.log(`Done. Imported/updated ${imported} tracksuits (${skipped} skipped).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('import-tracksuits-catalog failed:', err);
  process.exit(1);
});
