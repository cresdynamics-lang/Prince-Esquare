/**
 * Import presidential shirt products from backend/data/presidential-shirts.json
 * Images are read from Cursor assets folder (or backend/data/presidential-images/).
 *
 * Usage: node scripts/import-presidential-shirts.js
 *        node scripts/import-presidential-shirts.js --assets "C:\path\to\assets"
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');

const SIZES = ['M', 'L', 'XL', '2XL', '3XL'];
const STOCK_PER_SIZE = 8;

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const defaultAssetsDir = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);

const resolveAssetsDir = () => {
  const flag = process.argv.indexOf('--assets');
  if (flag !== -1 && process.argv[flag + 1]) {
    return path.resolve(process.argv[flag + 1]);
  }
  const envDir = process.env.PRESIDENTIAL_ASSETS_DIR;
  if (envDir && fs.existsSync(envDir)) return path.resolve(envDir);
  if (fs.existsSync(defaultAssetsDir)) return defaultAssetsDir;
  const fallback = path.join(__dirname, '..', 'data', 'presidential-images');
  return fallback;
};

async function ensureCategory(name, parentId = null) {
  const slug = slugify(name);
  const found = await db.query('SELECT id, parent_id FROM categories WHERE slug = $1', [slug]);
  if (found.rows.length) {
    if (parentId && !found.rows[0].parent_id) {
      await db.query('UPDATE categories SET parent_id = $1 WHERE id = $2', [parentId, found.rows[0].id]);
    }
    return found.rows[0].id;
  }
  const result = await db.query(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, slug, `${name} — Prince Esquire`, parentId]
  );
  return result.rows[0].id;
}

async function ensureBrand(name) {
  const brandName = name || 'Presidential';
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
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  const result = await uploadToCloudinary(buffer, undefined, mime);
  return result.secure_url || result.url;
}

async function run() {
  const catalogPath = path.join(__dirname, '..', 'data', 'presidential-shirts.json');
  const assetsDir = resolveAssetsDir();

  if (!fs.existsSync(catalogPath)) {
    console.error('Missing catalog:', catalogPath);
    process.exit(1);
  }
  if (!fs.existsSync(assetsDir)) {
    console.error('Assets folder not found:', assetsDir);
    console.error('Pass --assets "C:\\path\\to\\assets" or set PRESIDENTIAL_ASSETS_DIR');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const shirtsParentId = await ensureCategory('Shirts');
  const categoryId = await ensureCategory('Presidential', shirtsParentId);

  let imported = 0;
  let skipped = 0;

  for (const item of products) {
    const candidates = [
      path.join(assetsDir, item.image),
      path.join(__dirname, '..', 'data', item.image),
    ];
    const imagePath = candidates.find((p) => fs.existsSync(p));
    if (!imagePath) {
      console.warn(`SKIP (image missing): ${item.name}`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading: ${item.name}`);
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

  console.log(`Done. Imported/updated ${imported} presidential shirts (${skipped} skipped).`);
  console.log(`Category: Shirts → Presidential (id ${categoryId})`);
  process.exit(0);
}

run().catch((err) => {
  console.error('import-presidential-shirts failed:', err);
  process.exit(1);
});
