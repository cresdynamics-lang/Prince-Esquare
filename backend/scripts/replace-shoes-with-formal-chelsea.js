/**
 * Replace entire shoes catalog with 4 formal Chelsea boots only.
 * Deletes casual, loafers, boots, sandals, and existing formal shoes.
 *
 * Usage:
 *   node scripts/replace-shoes-with-formal-chelsea.js --dry-run
 *   node scripts/replace-shoes-with-formal-chelsea.js --confirm REPLACE_SHOES
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');
const { generateProductSku, generateVariantSku } = require('../src/utils/sku');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');

const dryRun = process.argv.includes('--dry-run');
const confirmed = process.argv.includes('--confirm') && process.argv.includes('REPLACE_SHOES');

if (!dryRun && !confirmed) {
  console.error('Use --dry-run or --confirm REPLACE_SHOES');
  process.exit(1);
}

const SIZES = ['40', '41', '42', '43', '44', '45', '46'];
const STOCK_PER_SIZE = 4;
const PRICE = 7000;

const ASSETS = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);
const DATA_IMAGES = path.join(__dirname, '..', 'data', 'formal-chelsea-boots-images');

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
    localImage: 'chelsea-01.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.35__2_-366319ac-550c-42a1-935f-1550b5c50d33.png',
    name: 'BLACK WINGTIP BROGUE CHELSEA BOOT',
    slug: 'black-wingtip-brogue-chelsea-boot',
    color: 'Black',
    featured: true,
    intro:
      'Polished black leather wingtip Chelsea boot with classic brogue perforations along the toe cap and elastic side gussets for slip-on ease.',
    features: [
      'Smooth polished black leather upper with wingtip toe detailing.',
      'Decorative brogue perforations across the toe and midfoot seams.',
      'Black elastic side panels for flexible, laceless entry.',
      'Fabric pull tab at the heel collar for quick on/off.',
      'Slim formal sole with low block heel — ideal with suits and dress trousers.',
    ],
  },
  {
    localImage: 'chelsea-02.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.34-cd735ea4-643f-4b88-94a2-01c1aa2c80c6.png',
    name: 'BLACK CROCODILE-EMBOSSED CHELSEA BOOT',
    slug: 'black-croc-embossed-chelsea-boot',
    color: 'Black',
    featured: true,
    intro:
      'Statement black Chelsea boot in crocodile-embossed leather with an almond toe and refined dress-boot silhouette.',
    features: [
      'Luxury croc-effect embossed leather across the full upper.',
      'Sleek almond toe for a modern formal profile.',
      'Matching black elastic gusset and rear pull tab.',
      'Thin black sole with low stacked heel for boardroom-ready polish.',
      'Visible welt stitching for crafted dress-shoe character.',
    ],
  },
  {
    localImage: 'chelsea-03.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.35-c8f940ea-ebd5-4e05-845b-7d891aef5455.png',
    name: 'BURNISHED TAN LEATHER CHELSEA BOOT',
    slug: 'burnished-tan-leather-chelsea-boot',
    color: 'Tan',
    featured: true,
    intro:
      'Hand-burnished cognac tan Chelsea boot with a high-shine patina — warmer alternative to black for smart formal and dress-casual looks.',
    features: [
      'Premium burnished tan leather with darker toe and heel patina.',
      'High-shine polished finish with rich cognac mid-tone.',
      'Dark brown elastic side panel for contrast and flexibility.',
      'Leather pull tab at the back heel.',
      'Slim formal black sole — pairs with navy, grey, and earth-tone tailoring.',
    ],
  },
  {
    localImage: 'chelsea-04.png',
    name: 'CLASSIC BLACK LEATHER CHELSEA BOOT',
    slug: 'classic-black-leather-chelsea-boot',
    color: 'Black',
    featured: true,
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.35__1_-ce3e51f4-8ddb-4aa9-bbe4-930732d7b2c7.png',
    intro:
      'Timeless black leather Chelsea boot with a clean almond toe and minimalist elastic-side construction — the essential formal ankle boot.',
    features: [
      'Smooth polished genuine leather in deep black.',
      'Classic Chelsea silhouette with black elastic gussets.',
      'Refined almond toe and slim low-profile sole.',
      'Discrete block heel for understated elevation.',
      'Fine stitching along sole and seams for lasting structure.',
    ],
  },
];

const buildDescription = (item) =>
  `${item.intro}\n\nKey features:\n${item.features.map((f) => `• ${f}`).join('\n')}\n\nFit & styling: Wear with two-piece and three-piece suits, dress trousers, or dark denim for elevated smart-casual. Ideal for weddings, boardrooms, and evening formal occasions in Nairobi.\n\nCare: Wipe with a soft cloth after wear. Use leather conditioner periodically. Store with shoe trees to maintain shape. Avoid prolonged exposure to water.\n\nAvailable EU sizes 40–46. Exclusively at Prince Esquire.`;

async function findShoesProductIds() {
  const r = await db.query(`
    SELECT p.id, p.name, p.slug, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON c.parent_id = parent.id
    WHERE c.slug IN ('shoes', 'formal-shoes', 'casual', 'loafers', 'boots', 'sandals')
       OR parent.slug = 'shoes'
  `);
  return r.rows;
}

async function ensureFormalShoesCategory() {
  const shoes = await db.query("SELECT id FROM categories WHERE slug = 'shoes'");
  const parentId = shoes.rows[0]?.id || null;

  const found = await db.query("SELECT id FROM categories WHERE slug = 'formal-shoes'");
  if (found.rows.length) return found.rows[0].id;

  const r = await db.query(
    `INSERT INTO categories (name, slug, description, parent_id)
     VALUES ('Formal shoes', 'formal-shoes', 'Formal shoes — Prince Esquire', $1)
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

async function deleteShoesProducts(rows) {
  if (!rows.length) return 0;
  const ids = rows.map((r) => r.id);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE pos_products SET ecommerce_product_id = NULL WHERE ecommerce_product_id = ANY($1::uuid[])`,
      [ids]
    );
    await client.query(
      `UPDATE products SET pos_stock_product_id = NULL WHERE id = ANY($1::uuid[])`,
      [ids]
    );
    await client.query('DELETE FROM product_variants WHERE product_id = ANY($1::uuid[])', [ids]);
    const del = await client.query('DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING id', [ids]);
    await client.query('COMMIT');
    return del.rowCount;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

(async () => {
  const existing = await findShoesProductIds();
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Shoes to remove: ${existing.length}`);
  for (const row of existing.slice(0, 8)) {
    console.log(`  ${row.category_slug} | ${row.name}`);
  }
  if (existing.length > 8) console.log(`  ... and ${existing.length - 8} more`);

  if (dryRun) {
    console.log(`Would import ${CATALOG.length} formal Chelsea boots at KSh ${PRICE}.`);
    process.exit(0);
  }

  const removed = await deleteShoesProducts(existing);
  console.log(`Deleted ${removed} shoe products.`);

  const categoryId = await ensureFormalShoesCategory();
  const brandId = await ensureBrand();
  let imported = 0;

  for (const item of CATALOG) {
    const src = resolveImagePath(item);
    if (!src) {
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
        [product.id, `EU ${size} / ${item.color}`, STOCK_PER_SIZE, imageUrl, item.color, size, variantSku, variantSku]
      );
    }

    const posRow = await ensurePosForEcommerceProduct(product);
    await seedPosOpeningStockIfEmpty(posRow?.id, totalStock);
    imported += 1;
  }

  const verify = await db.query(`
    SELECT c.slug, COUNT(*)::int n
    FROM products p JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON c.parent_id = parent.id
    WHERE c.slug IN ('formal-shoes','casual','loafers','boots','sandals') OR parent.slug = 'shoes'
    GROUP BY c.slug ORDER BY c.slug
  `);

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} formal Chelsea boots at KSh ${PRICE}.`);
  console.log('Remaining shoes by category:');
  console.table(verify.rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
