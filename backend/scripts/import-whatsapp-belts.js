/**
 * Import the two belt products from the uploaded WhatsApp images.
 *
 * Usage: node scripts/import-whatsapp-belts.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');

const STOCK_PER_ITEM = 12;
const ASSETS = path.join(__dirname, '..', '..', 'frontend', 'public');

const CATALOG = [
  {
    image: 'belt-001.jpeg',
    name: 'BLACK LEATHER BELT SET',
    slug: 'black-leather-belt-set',
    color: 'Black',
    price: 2400,
    featured: true,
    description:
      'A clean black leather belt set with mixed buckle shapes and smooth-to-textured finishes for formal and smart-casual dressing. Adjustable and easy to pair with trousers, suits, and weekend tailoring.',
  },
  {
    image: 'belt-002.jpeg',
    name: 'DARK BROWN LEATHER BELT SET',
    slug: 'dark-brown-leather-belt-set',
    color: 'Dark Brown',
    price: 2400,
    featured: true,
    description:
      'A refined dark brown leather belt set with polished metal buckles and balanced grain for office and evening dressing. Versatile with navy, charcoal, and tan tailoring.',
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
    [name, slug, `${name} — Prince Esquare`, parentId]
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
  `${item.description}\n\nKey features:\n• Genuine leather strap with tonal edge stitching.\n• Classic dress width for suit trousers and chinos.\n• Pin buckle closure with leather keeper loop(s).\n• Formal-to-smart-casual versatility.\n\nCare: Wipe with a damp cloth. Condition leather periodically. Store flat or coiled loosely.\n\nExclusively at Prince Esquare.`;

(async () => {
  const beltsId = await ensureCategory('Belts & Ties');
  const brandId = await ensureBrand('Prince Esquare');

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
         is_active = true,
         stock_quantity = EXCLUDED.stock_quantity
       RETURNING *`,
      [
        item.name,
        item.slug,
        productSku,
        buildDescription(item),
        item.price,
        beltsId,
        brandId,
        STOCK_PER_ITEM,
        Boolean(item.featured),
        imageUrl,
        JSON.stringify([{ url: imageUrl, alt: item.name }]),
      ]
    );

    const product = result.rows[0];
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [product.id]);
    const posRow = await ensurePosForEcommerceProduct(product);
    await seedPosOpeningStockIfEmpty(posRow?.id, STOCK_PER_ITEM);
    imported += 1;
  }

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} belts.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});