/**
 * Import showroom knitted polos from WhatsApp batch (June 2026).
 * Usage: node scripts/import-showroom-knitted-polos.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');

const SIZES = ['M', 'L', 'XL', '2XL', '3XL'];
const STOCK_PER_SIZE = 8;
const PRICE = 3000;

const ASSETS = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);
const DATA_IMAGES = path.join(__dirname, '..', 'data', 'showroom-knitted-polos-images');

const resolveImagePath = (item) => {
  if (item.localImage) {
    const p = path.join(DATA_IMAGES, item.localImage);
    if (fs.existsSync(p)) return p;
  }
  const p = path.join(ASSETS, item.image);
  return fs.existsSync(p) ? p : null;
};

const CATALOG = [
  {
    localImage: 'showroom-knit-01.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.29__1_-e8155dc8-ec52-4016-87ee-eb4642d4fbc6.png',
    name: 'BURGUNDY CLASSIC KNITTED POLO',
    slug: 'burgundy-classic-knitted-polo-showroom',
    color: 'Burgundy',
    featured: true,
    description:
      'Deep burgundy classic knitted polo with ribbed collar and three-button placket. Fine-gauge knit with a smooth matte finish — smart-casual essential for Nairobi weekends and office-casual dressing.',
  },
  {
    localImage: 'showroom-knit-02.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.30__2_-2dc167ce-95c6-4351-ae43-3cfc39f0a164.png',
    name: 'MAUVE QUARTER-ZIP KNITTED POLO',
    slug: 'mauve-quarter-zip-knitted-polo-showroom',
    color: 'Mauve',
    featured: true,
    description:
      'Dusty mauve quarter-zip knitted polo with metallic zip closure and structured collar. Modern slim profile with breathable knit — elevated casual for dinners, travel, and smart weekend wear.',
  },
  {
    localImage: 'showroom-knit-03.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.30__1_-1e8f0fd7-ade5-4eaa-925c-9c6c6a950fbd.png',
    name: 'OLIVE GREEN CLASSIC KNITTED POLO',
    slug: 'olive-green-classic-knitted-polo-showroom',
    color: 'Olive Green',
    featured: true,
    description:
      'Dark olive green classic knitted polo with ribbed collar and button placket. Versatile earth tone pairs with khaki, denim, or black trousers for refined everyday style.',
  },
  {
    localImage: 'showroom-knit-04.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.30-f2c4fd0f-da53-4988-8639-bdc0a0de1022.png',
    name: 'CREAM QUARTER-ZIP KNITTED POLO',
    slug: 'cream-quarter-zip-knitted-polo-showroom',
    color: 'Cream',
    featured: true,
    description:
      'Off-white cream quarter-zip knitted polo with contrast trim at the zip and ribbed cuffs. Clean minimalist knit for warm-weather smart-casual and layered under blazers.',
  },
  {
    localImage: 'showroom-knit-05.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.30__3_-59a041d1-bb62-4d28-b30f-d97d0a464b0f.png',
    name: 'PURPLE CLASSIC KNITTED POLO',
    slug: 'purple-classic-knitted-polo-showroom',
    color: 'Purple',
    featured: true,
    description:
      'Rich purple classic knitted polo with smooth fine-gauge texture and three-button placket. Statement colour with understated Prince Esquire finishing for events and casual Fridays.',
  },
  {
    localImage: 'showroom-knit-06.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.31__1_-c1e4ebbf-8377-4653-9d98-b43f2ea7742c.png',
    name: 'OLIVE GREEN KNITTED POLO — PE 02',
    slug: 'olive-green-knitted-polo-pe-02',
    color: 'Olive Green',
    description:
      'Olive green knitted polo in a soft fine-gauge knit with classic collar styling. Comfortable regular fit through the body with ribbed sleeve cuffs.',
  },
  {
    localImage: 'showroom-knit-07.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.31-52f9558a-7141-48b8-ae53-74483da640ea.png',
    name: 'OLIVE GREEN KNITTED POLO — PE 03',
    slug: 'olive-green-knitted-polo-pe-03',
    color: 'Olive Green',
    description:
      'Olive green knitted polo with clean placket lines and breathable knit construction. Pairs effortlessly with chinos, denim, or tailored black trousers.',
  },
  {
    localImage: 'showroom-knit-08.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.31__2_-da561055-0693-410c-b1ff-1628ccf0f9ed.png',
    name: 'OLIVE GREEN KNITTED POLO — PE 04',
    slug: 'olive-green-knitted-polo-pe-04',
    color: 'Olive Green',
    description:
      'Olive green knitted polo with structured collar and lightweight knit hand-feel. Ideal for layered smart-casual looks across Nairobi seasons.',
  },
  {
    localImage: 'showroom-knit-09.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-14_at_00.08.00__1_-db0b7a82-cb99-4604-bacf-a266a1a6729e.png',
    name: 'PURPLE KNITTED POLO — PE 02',
    slug: 'purple-knitted-polo-pe-02',
    color: 'Purple',
    description:
      'Purple knitted polo with classic collar and soft breathable jersey-knit body. Polished colour option for weekend outings and casual office days.',
  },
  {
    localImage: 'showroom-knit-10.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-13_at_19.02.29-b22cfaa8-871a-4d8c-94f4-2ecbd9e05832.png',
    name: 'WHITE CLASSIC KNITTED POLO',
    slug: 'white-classic-knitted-polo-showroom',
    color: 'White',
    featured: true,
    description:
      'Crisp white classic knitted polo with ribbed collar and clean button placket. Fresh summer staple that layers under jackets or wears solo with denim and chinos.',
  },
  {
    localImage: 'showroom-knit-11.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-14_at_00.08.00-157c7718-3348-44a2-b5a1-db0dae9d803d.png',
    name: 'PURPLE KNITTED POLO — PE 03',
    slug: 'purple-knitted-polo-pe-03',
    color: 'Purple',
    description:
      'Purple knitted polo in a smooth fine-knit finish with structured short sleeves. Easy smart-casual piece for travel, brunch, and evening plans.',
  },
];

const buildDescription = (item) =>
  `${item.description}\n\nKey features:\n• Fine-gauge knitted fabric with breathable comfort.\n• Classic or quarter-zip collar with refined ribbed finish.\n• Short sleeves with structured ribbed cuffs.\n• Soft hand-feel with comfortable regular-to-relaxed fit.\n• Suitable for office-casual, weekends, and warm-weather layering.\n• Additional colours available in-store — ask our team.\n\nFit & styling: Pair with chinos, denim, or tailored trousers. Layer under blazers for elevated everyday dressing.\n\nCare: Machine wash cold on gentle cycle. Lay flat or tumble dry low. Do not bleach.\n\nAvailable sizes M–3XL. Exclusively at Prince Esquire.`;

async function ensureKnittedPolosCategory() {
  const found = await db.query("SELECT id FROM categories WHERE slug = 'knitted-polos'");
  if (found.rows.length) return found.rows[0].id;

  const polo = await db.query("SELECT id FROM categories WHERE slug = 'polo-t-shirts'");
  const parentId = polo.rows[0]?.id || null;
  const r = await db.query(
    `INSERT INTO categories (name, slug, description, parent_id)
     VALUES ('Knitted Polos', 'knitted-polos', 'Knitted Polos — Prince Esquire', $1)
     RETURNING id`,
    [parentId]
  );
  return r.rows[0].id;
}

async function ensureBrand() {
  const found = await db.query("SELECT id FROM brands WHERE slug = 'prince-esquire'");
  if (found.rows.length) return found.rows[0].id;
  const r = await db.query(
    `INSERT INTO brands (name, slug, description) VALUES ('Prince Esquire', 'prince-esquire', 'Prince Esquire') RETURNING id`
  );
  return r.rows[0].id;
}

(async () => {
  const categoryId = await ensureKnittedPolosCategory();
  const brandId = await ensureBrand();
  let imported = 0;

  for (const item of CATALOG) {
    const src = resolveImagePath(item);
    if (!src) {
      console.warn(`SKIP missing: ${item.name}`);
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
        PRICE,
        categoryId,
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
        [product.id, `${size} / ${item.color}`, STOCK_PER_SIZE, imageUrl, item.color, size, variantSku, variantSku]
      );
    }

    const posRow = await ensurePosForEcommerceProduct(product);
    await seedPosOpeningStockIfEmpty(posRow?.id, totalStock);
    imported += 1;
  }

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} showroom knitted polos at KSh ${PRICE}.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
