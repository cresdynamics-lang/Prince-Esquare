/**
 * Import Ferragamo-style pebbled leather casual slip-ons from WhatsApp images.
 *
 * Usage: node scripts/import-casual-slip-ons.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');

const SIZES = ['40', '41', '42', '43', '44', '45', '46'];
const STOCK_PER_SIZE = 4;

const ASSETS = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);

const CATALOG = [
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.57-5672539c-648f-49e1-b2de-78ff33a26858.png',
    name: 'BLACK PEBBLED LEATHER CASUAL SLIP-ON LOAFERS',
    slug: 'black-pebbled-leather-casual-slip-on-loafers',
    color: 'Black',
    brand: 'Salvatore Ferragamo',
    price: 17500,
    featured: true,
    description:
      'Black pebbled leather casual slip-on loafers with a thick white rubber sole and vibrant orange lining. Moc-toe stitching and minimalist laceless profile for smart-casual weekend wear.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.56-e41d7e11-3878-42ff-b01a-8ca391260cf4.png',
    name: 'NAVY PEBBLED LEATHER CASUAL SLIP-ON LOAFERS',
    slug: 'navy-pebbled-leather-casual-slip-on-loafers',
    color: 'Navy',
    brand: 'Salvatore Ferragamo',
    price: 17500,
    description:
      'Navy pebbled leather casual slip-on loafers with white midsole and orange grip outsole. Contrast orange stitch detail, moc-toe construction, and premium designer casual styling.',
  },
];

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function ensureCategory(name, parentId = null) {
  const found = await db.query(
    'SELECT id FROM categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2',
    [name, parentId]
  );
  if (found.rows.length) return found.rows[0].id;
  let slug = slugify(name);
  if (parentId) {
    const parent = await db.query('SELECT slug FROM categories WHERE id = $1', [parentId]);
    slug = `${parent.rows[0]?.slug || 'shoes'}-${slugify(name)}`;
  }
  const bySlug = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (bySlug.rows.length) return bySlug.rows[0].id;
  const r = await db.query(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, slug, `${name} — Prince Esquire`, parentId]
  );
  return r.rows[0].id;
}

async function ensureBrand(name) {
  const slug = slugify(name);
  const found = await db.query('SELECT id FROM brands WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;
  const r = await db.query(
    'INSERT INTO brands (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [name, slug, name]
  );
  return r.rows[0].id;
}

const buildDescription = (item) =>
  `${item.description}\n\nKey features:\n• Pebbled leather upper with moc-toe stitching.\n• Thick white rubber sole for comfort and contrast.\n• Vibrant orange lining and outsole accents.\n• Slip-on laceless design for easy wear.\n• Smart-casual hybrid loafer-sneaker styling.\n\nAvailable EU sizes 40–46. Exclusively at Prince Esquire.`;

(async () => {
  const shoesParentId = await ensureCategory('Shoes');
  const casualId = await ensureCategory('Casual', shoesParentId);

  let imported = 0;
  for (const item of CATALOG) {
    const src = path.join(ASSETS, item.image);
    if (!fs.existsSync(src)) {
      console.warn(`SKIP missing image: ${item.name}`);
      continue;
    }

    console.log(`Importing: ${item.name}`);
    const buffer = fs.readFileSync(src);
    const uploaded = await uploadToCloudinary(buffer, undefined, 'image/png');
    const imageUrl = uploaded.secure_url || uploaded.url;
    const brandId = await ensureBrand(item.brand);
    const productSku = generateProductSku({ name: item.name, slug: item.slug });
    const totalStock = SIZES.length * STOCK_PER_SIZE;

    const result = await db.query(
      `INSERT INTO products (name, slug, sku, description, price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, sku = EXCLUDED.sku, description = EXCLUDED.description,
         price = EXCLUDED.price, category_id = EXCLUDED.category_id, brand_id = EXCLUDED.brand_id,
         thumbnail = EXCLUDED.thumbnail, images = EXCLUDED.images, is_featured = EXCLUDED.is_featured,
         is_active = true, stock_quantity = EXCLUDED.stock_quantity
       RETURNING *`,
      [
        item.name,
        item.slug,
        productSku,
        buildDescription(item),
        item.price,
        casualId,
        brandId,
        totalStock,
        Boolean(item.featured),
        imageUrl,
        JSON.stringify([{ url: imageUrl, alt: item.name }]),
      ]
    );

    const product = result.rows[0];
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [product.id]);

    for (const size of SIZES) {
      const variant = { size, color: item.color, image_url: imageUrl };
      const variantSku = generateVariantSku(productSku, variant);
      await db.query(
        `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id)
         VALUES ($1, 'Variant', $2, 0, $3, $4, $5, $6, $7, $8)`,
        [
          product.id,
          `EU ${size} / ${item.color}`,
          STOCK_PER_SIZE,
          imageUrl,
          item.color,
          size,
          variantSku,
          variantSku,
        ]
      );
    }

    const posRow = await ensurePosForEcommerceProduct(product);
    await seedPosOpeningStockIfEmpty(posRow?.id, totalStock);
    imported += 1;
  }

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} casual slip-on loafers.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
