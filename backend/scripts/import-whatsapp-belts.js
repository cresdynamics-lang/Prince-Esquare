/**
 * Import 4 dress belts from WhatsApp batch image (group photo).
 *
 * Usage: node scripts/import-whatsapp-belts.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');

const SIZES = ['32', '34', '36', '38', '40', '42'];
const STOCK_PER_SIZE = 6;

const ASSETS = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);

const CATALOG = [
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-14_at_00.07.12-1ed63341-7870-4c0d-916f-0bb5fc880880.png',
    name: 'BLACK SMOOTH LEATHER DRESS BELT',
    slug: 'black-smooth-leather-dress-belt',
    color: 'Black',
    price: 2100,
    description:
      'Classic black smooth leather dress belt with brushed silver-tone rectangular pin buckle. Clean formal profile for suits and office wear.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-14_at_00.07.12-1ed63341-7870-4c0d-916f-0bb5fc880880.png',
    name: 'DARK BROWN PEBBLED LEATHER DRESS BELT',
    slug: 'dark-brown-pebbled-leather-dress-belt',
    color: 'Brown',
    price: 2100,
    description:
      'Dark chocolate brown pebbled leather dress belt with brushed silver-tone rectangular buckle. Fine grain texture for smart-casual and formal styling.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-14_at_00.07.13-aba73202-8b90-4c23-86ee-aa82c66ab226.png',
    name: 'DARK BROWN SAFFIANO LEATHER DRESS BELT',
    slug: 'dark-brown-saffiano-leather-dress-belt',
    color: 'Brown',
    price: 2200,
    featured: true,
    description:
      'Dark brown Saffiano cross-hatch leather dress belt with rounded gunmetal pin buckle. Scratch-resistant textured finish with silver logo keeper accent.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-14_at_00.07.13-aba73202-8b90-4c23-86ee-aa82c66ab226.png',
    name: 'BLACK PEBBLED LEATHER DRESS BELT',
    slug: 'black-pebbled-leather-dress-belt',
    color: 'Black',
    price: 2100,
    description:
      'Black coarse-pebbled leather dress belt with brushed silver-tone rectangular buckle. Durable textured strap for daily formal and business wear.',
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
    slug = `${parent.rows[0]?.slug || 'accessories'}-${slugify(name)}`;
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
  `${item.description}\n\nKey features:\n• Genuine leather strap with tonal edge stitching.\n• Classic dress width for suit trousers and chinos.\n• Pin buckle closure with leather keeper loop(s).\n• Formal-to-smart-casual versatility.\n\nCare: Wipe with a damp cloth. Condition leather periodically. Store flat or coiled loosely.\n\nAvailable waist sizes 32–42. Exclusively at Prince Esquire.`;

(async () => {
  const beltsId = await ensureCategory('Belts & Ties');
  const brandId = await ensureBrand('Prince Esquire');

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
        beltsId,
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

    const posRow = await ensurePosForEcommerceProduct(product);
    await seedPosOpeningStockIfEmpty(posRow?.id, totalStock);
    imported += 1;
  }

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} belts.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
