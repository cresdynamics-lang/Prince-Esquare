/**
 * Import Tedd Terry London + Fabio Bironin two-piece suits from WhatsApp batch images.
 *
 * Usage: node scripts/import-tedd-terry-suits.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const STOCK_PER_SIZE = 3;

const ASSETS = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);

const CATALOG = [
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36__3_-1a9297fd-6e4c-47d8-835a-fe3d5d5e229d.png',
    name: 'TEDD TERRY LONDON BLACK SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-black-slim-fit-wool-two-piece',
    color: 'Black',
    brand: 'Tedd Terry London',
    price: 38500,
    featured: true,
    description:
      'Premium Tedd Terry London black two-piece slim-fit suit in 100% wool (220s quality). European sizing 46–58. Wedding, boardroom, and black-tie ready.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37__1_-e3995716-4443-45d6-b56e-50cd8350929b.png',
    name: 'TEDD TERRY LONDON BLUE 4 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-4-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    price: 38500,
    description:
      'Tedd Terry London blue two-piece slim-fit suit — 100% wool, 220s quality, sizes 46–58. Single-breasted jacket with matching trousers.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36-0eea0686-0cc0-43dc-86a6-dbbfb4c90268.png',
    name: 'TEDD TERRY LONDON BLUE 3 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-3-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    price: 38500,
    description:
      'Tedd Terry London blue 3 two-piece slim-fit suit in premium 100% wool (220s). Notch lapels, flap pockets, tailored for formal occasions.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37__2_-6c3e5ecc-1836-474b-96a3-2f9cc7a15b35.png',
    name: 'TEDD TERRY LONDON GRAY 5 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-gray-5-slim-fit-wool-two-piece',
    color: 'Gray',
    brand: 'Tedd Terry London',
    price: 38500,
    description:
      'Charcoal-gray Tedd Terry London two-piece slim-fit suit — 100% wool, 220s quality. Versatile executive and wedding styling.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37__3_-948c1491-ffb3-49b0-add2-afdbddcea6b2.png',
    name: 'TEDD TERRY LONDON NAVY BLUE 2 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-navy-blue-2-slim-fit-wool-two-piece',
    color: 'Navy',
    brand: 'Tedd Terry London',
    price: 38500,
    featured: true,
    description:
      'Deep navy Tedd Terry London two-piece slim-fit suit in 100% wool (220s). Classic single-breasted cut for groom and executive wear.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37-bb35efce-af0f-495b-94b5-179589089dbf.png',
    name: 'TEDD TERRY LONDON BLUE 5 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-5-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    price: 38500,
    description:
      'Tedd Terry London blue 5 two-piece slim-fit wool suit — breathable premium fabric, sizes 46–58.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36__1_-65897a2a-adac-49b7-bf42-7dfab5d74070.png',
    name: 'TEDD TERRY LONDON BLUE 2 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-2-slim-fit-wool-two-piece',
    color: 'Light Blue',
    brand: 'Tedd Terry London',
    price: 38500,
    description:
      'Light blue Tedd Terry London two-piece slim-fit suit in 100% wool (220s). Fresh summer-wedding and cocktail styling.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36__2_-c757f5f8-68cf-4909-9d49-40dda304e88a.png',
    name: 'TEDD TERRY LONDON BLUE 6 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-6-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    price: 38500,
    description:
      'Vibrant blue Tedd Terry London two-piece slim-fit suit — 100% wool, 220s quality, premium London collection tailoring.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.39-a19dd29b-514e-4b92-b98b-dcd873b199c4.png',
    name: 'FABIO BIRONIN CHARCOAL WOOL TWO-PIECE SUIT',
    slug: 'fabio-bironin-charcoal-wool-two-piece-suit-459',
    color: 'Charcoal',
    brand: 'Fabio Bironin',
    price: 36500,
    description:
      'Fabio Bironin charcoal two-piece suit — code 459, sizes 46–56. Single-breasted jacket with matching trousers. CLR 20/2.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.38__1_-0cbce45d-e494-4601-9674-f0784a71a693.png',
    name: 'FABIO BIRONIN NAVY WOOL TWO-PIECE SUIT',
    slug: 'fabio-bironin-navy-wool-two-piece-suit-pg0003-2-06',
    color: 'Navy',
    brand: 'Fabio Bironin',
    price: 36500,
    featured: true,
    description:
      'Fabio Bironin navy two-piece suit — drop 4, code 657, sizes 50–60. Reference PG0003/2/06. Classic formal tailoring.',
  },
  {
    image: 'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.38-61bc4249-ca4a-4de5-accc-a61d529b42ee.png',
    name: 'FABIO BIRONIN DARK NAVY WOOL TWO-PIECE SUIT',
    slug: 'fabio-bironin-dark-navy-wool-two-piece-suit-pg0003-3-03',
    color: 'Dark Navy',
    brand: 'Fabio Bironin',
    price: 36500,
    description:
      'Fabio Bironin dark navy two-piece suit — drop 4, code 657, sizes 50–60. Reference PG0003/3/03. Peak formal presence.',
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
    slug = `${parent.rows[0]?.slug || 'suits'}-${slugify(name)}`;
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
  `${item.description}\n\nKey features:\n• Two-piece jacket and trouser set (slim fit).\n• 100% wool premium suiting.\n• Single-breasted notch-lapel jacket.\n• Matching flat-front trousers.\n• Ideal for weddings, galas, and executive occasions.\n\nAvailable sizes S–3XL at Prince Esquire.`;

(async () => {
  const suitsParentId = await ensureCategory('Suits');
  const twoPieceId = await ensureCategory('Two piece', suitsParentId);

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
        twoPieceId,
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

    const posRow = await ensurePosForEcommerceProduct(product);
    await seedPosOpeningStockIfEmpty(posRow?.id, totalStock);
    imported += 1;
  }

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} new two-piece suits.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
