/**
 * Replace entire suits catalog with 11 two-piece suits only (Tedd Terry + Fabio Bironin).
 *
 * Usage:
 *   node scripts/replace-suits-with-two-piece.js --dry-run
 *   node scripts/replace-suits-with-two-piece.js --confirm REPLACE_SUITS
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
const confirmed = process.argv.includes('--confirm') && process.argv.includes('REPLACE_SUITS');

if (!dryRun && !confirmed) {
  console.error('Use --dry-run or --confirm REPLACE_SUITS');
  process.exit(1);
}

const SIZES = ['46', '48', '50', '52', '54', '56', '58'];
const STOCK_PER_SIZE = 2;

const ASSETS = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);
const DATA_IMAGES = path.join(__dirname, '..', 'data', 'showroom-two-piece-suits-images');

const priceForSlug = (slug) => {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return 13000 + (h % 2001);
};

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
    localImage: 'suit-01.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36__3_-5b9b9f2d-6d93-4333-861b-32dec6e2a6bc.png',
    name: 'TEDD TERRY LONDON BLACK SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-black-slim-fit-wool-two-piece',
    color: 'Black',
    brand: 'Tedd Terry London',
    featured: true,
    intro:
      'Tedd Terry London black two-piece slim-fit suit in 100% wool (220s quality). Single-breasted jacket with notch lapels and matching trousers — sizes 46–58.',
    features: [
      '100% wool suiting, 220s quality premium hand-feel.',
      'Slim-fit two-piece: jacket + matching trousers.',
      'Single-breasted two-button closure with flap pockets.',
      'Premium Quality London collection tailoring.',
      'Black tie, wedding, and boardroom ready.',
    ],
  },
  {
    localImage: 'suit-02.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37__2_-5180574e-cd5d-4a65-bde2-e5312459c5c2.png',
    name: 'TEDD TERRY LONDON GRAY 5 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-gray-5-slim-fit-wool-two-piece',
    color: 'Gray',
    brand: 'Tedd Terry London',
    featured: true,
    intro:
      'Charcoal-gray Tedd Terry London two-piece slim-fit suit — fine-grid wool texture, 220s quality, European sizes 46–58.',
    features: [
      'Gray 5 colourway with subtle fine-grid weave.',
      '100% wool, 220s quality breathable suiting.',
      'Notch lapels, flap pockets, slim tailored silhouette.',
      'Styled with white shirt and gold geometric tie.',
      'Executive and wedding versatile neutral tone.',
    ],
  },
  {
    localImage: 'suit-03.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37__3_-2bcac723-f9ee-46c1-ac76-589b3d93623a.png',
    name: 'TEDD TERRY LONDON NAVY BLUE 2 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-navy-blue-2-slim-fit-wool-two-piece',
    color: 'Navy',
    brand: 'Tedd Terry London',
    featured: true,
    intro:
      'Deep navy Tedd Terry London two-piece slim-fit suit in 100% wool (220s). Classic groom and executive styling.',
    features: [
      'Navy Blue 2 — rich dark navy with fine suiting texture.',
      'Single-breasted two-button jacket with welt chest pocket.',
      'Four-button sleeve cuffs, slim-fit cut.',
      '100% wool, sizes 46–58.',
      'Ideal for weddings, church, and formal dinners.',
    ],
  },
  {
    localImage: 'suit-04.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37-9b06c85b-1994-4c43-afed-07a49b8a7527.png',
    name: 'TEDD TERRY LONDON BLUE 5 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-5-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    intro:
      'Tedd Terry London Blue 5 two-piece slim-fit wool suit — medium blue with refined woven texture, 220s quality.',
    features: [
      'Blue 5 colour — professional mid-tone blue suiting.',
      '100% wool with breathable lightweight construction.',
      'Notch lapels, flap pockets, premium London label.',
      'Slim-fit jacket and matching trousers.',
      'Sizes 46–58.',
    ],
  },
  {
    localImage: 'suit-05.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.37__1_-8ad4925b-6d6d-4981-bfed-fbe5c1be41e0.png',
    name: 'TEDD TERRY LONDON BLUE 4 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-4-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    intro:
      'Tedd Terry London Blue 4 two-piece slim-fit suit — medium blue wool with geometric tie-ready styling.',
    features: [
      'Blue 4 shade with visible fine weave texture.',
      '100% wool, 220s quality, slim-fit cut.',
      'Two-button single-breasted jacket.',
      'Matching flat-front trousers included.',
      'European sizing 46–58.',
    ],
  },
  {
    localImage: 'suit-06.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36-162453e3-4179-47a4-a9cd-1b29f2ea328d.png',
    name: 'TEDD TERRY LONDON BLUE 3 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-3-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    intro:
      'Tedd Terry London Blue 3 two-piece slim-fit suit in premium 100% wool (220s) with notch lapels and flap pockets.',
    features: [
      'Blue 3 — balanced medium blue for year-round wear.',
      'Premium Quality tag — breathable, travel-friendly wool.',
      'Single-breasted slim-fit tailoring.',
      'Matching two-piece trouser set.',
      'Sizes 46–58.',
    ],
  },
  {
    localImage: 'suit-07.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36__2_-e60813d3-a977-44d2-8ef2-1ae53a9b3430.png',
    name: 'TEDD TERRY LONDON BLUE 6 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-6-slim-fit-wool-two-piece',
    color: 'Blue',
    brand: 'Tedd Terry London',
    intro:
      'Vibrant royal blue Tedd Terry London two-piece slim-fit suit — statement colour in 100% wool (220s quality).',
    features: [
      'Blue 6 — saturated royal blue suiting.',
      'Fine-textured 100% wool with slim silhouette.',
      'Notch lapel, single-breasted two-button front.',
      'Premium London collection finishing.',
      'Sizes 46–58.',
    ],
  },
  {
    localImage: 'suit-08.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.36__1_-fc783bc6-e31f-4344-b553-37aebb336d53.png',
    name: 'TEDD TERRY LONDON BLUE 2 SLIM-FIT WOOL TWO-PIECE SUIT',
    slug: 'tedd-terry-london-blue-2-slim-fit-wool-two-piece',
    color: 'Light Blue',
    brand: 'Tedd Terry London',
    intro:
      'Light blue Tedd Terry London two-piece slim-fit suit — fresh summer-wedding and cocktail styling in 220s wool.',
    features: [
      'Blue 2 — lighter sky-blue tone with heathered weave.',
      '100% wool, breathable slim-fit construction.',
      'Two-button jacket with flap pockets.',
      'Pairs with white shirt and patterned tie.',
      'Sizes 46–58.',
    ],
  },
  {
    localImage: 'suit-09.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.38__1_-7e19ae58-886b-4baf-a47b-6e9484c3299b.png',
    name: 'FABIO BIRONIN NAVY WOOL TWO-PIECE SUIT',
    slug: 'fabio-bironin-navy-wool-two-piece-suit-pg0003-2-06',
    color: 'Navy',
    brand: 'Fabio Bironin',
    featured: true,
    intro:
      'Fabio Bironin navy two-piece suit — Drop 4, code 657, reference PG0003/2/06. Sizes 50–60.',
    features: [
      'Deep navy wool two-piece with fine suiting texture.',
      'Single-breasted two-button jacket, notch lapels.',
      'Welt chest pocket and flap side pockets.',
      'Diagonal striped tie styling shown — formal elegance.',
      'European sizes 50–60.',
    ],
  },
  {
    localImage: 'suit-10.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.39-3575d885-3159-4a79-aa88-a473ca97a15f.png',
    name: 'FABIO BIRONIN CHARCOAL WOOL TWO-PIECE SUIT',
    slug: 'fabio-bironin-charcoal-wool-two-piece-suit-459',
    color: 'Charcoal',
    brand: 'Fabio Bironin',
    intro:
      'Fabio Bironin charcoal two-piece suit — code 459, CLR 20/2, sizes 46–56. Versatile executive formalwear.',
    features: [
      'Charcoal grey wool with subtle fine weave.',
      'Single-breasted jacket with gold lapel pin detail.',
      'Matching trousers, two-button closure.',
      'Diagonal navy and grey striped tie compatible styling.',
      'Sizes 46–56.',
    ],
  },
  {
    localImage: 'suit-11.png',
    image:
      'c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_WhatsApp_Image_2026-06-15_at_09.18.38-59f50913-6f90-4bbe-afe8-916659aec781.png',
    name: 'FABIO BIRONIN DARK NAVY WOOL TWO-PIECE SUIT',
    slug: 'fabio-bironin-dark-navy-wool-two-piece-suit-pg0003-3-03',
    color: 'Dark Navy',
    brand: 'Fabio Bironin',
    intro:
      'Fabio Bironin dark navy two-piece suit — Drop 4, code 657, reference PG0003/3/03. Sizes 50–60.',
    features: [
      'Dark navy solid wool suiting with refined texture.',
      'Single-breasted two-button jacket, notch lapels.',
      'Gold decorative lapel pin, premium brand tag.',
      'Matching trousers for complete formal ensemble.',
      'Sizes 50–60.',
    ],
  },
];

const buildDescription = (item) =>
  `${item.intro}\n\nKey features:\n${item.features.map((f) => `• ${f}`).join('\n')}\n\nFit & styling: Pair with a crisp dress shirt and silk tie for weddings, church, boardrooms, and gala events. Add a pocket square for celebration-ready polish.\n\nCare: Dry clean recommended. Hang on a wide-shoulder hanger. Steam between wears. Store in a breathable garment bag.\n\nAvailable sizes 46–58. Exclusively at Prince Esquire.`;

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function findSuitProductIds() {
  const r = await db.query(`
    SELECT p.id, p.name, p.slug, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON c.parent_id = parent.id
    WHERE c.slug IN ('suits', 'two-piece', 'three-piece')
       OR parent.slug = 'suits'
  `);
  return r.rows;
}

async function ensureTwoPieceCategory() {
  const suits = await db.query("SELECT id FROM categories WHERE slug = 'suits'");
  const parentId = suits.rows[0]?.id || null;

  const found = await db.query("SELECT id FROM categories WHERE slug = 'two-piece'");
  if (found.rows.length) return found.rows[0].id;

  const r = await db.query(
    `INSERT INTO categories (name, slug, description, parent_id)
     VALUES ('Two piece', 'two-piece', 'Two piece — Prince Esquire', $1)
     RETURNING id`,
    [parentId]
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

async function deleteSuitProducts(rows) {
  if (!rows.length) return 0;
  const ids = rows.map((r) => r.id);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const posR = await client.query(
      `SELECT DISTINCT pos_stock_product_id AS id FROM products
       WHERE id = ANY($1::uuid[]) AND pos_stock_product_id IS NOT NULL
       UNION
       SELECT id FROM pos_products WHERE ecommerce_product_id = ANY($1::uuid[])`,
      [ids]
    );
    const posIds = posR.rows.map((r) => r.id).filter(Boolean);

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

    if (posIds.length) {
      await client.query('DELETE FROM pos_store_stock_levels WHERE product_id = ANY($1::uuid[])', [posIds]);
      await client.query('DELETE FROM pos_stock_levels WHERE product_id = ANY($1::uuid[])', [posIds]);
      await client.query('DELETE FROM pos_products WHERE id = ANY($1::uuid[])', [posIds]);
    }

    await client.query('COMMIT');
    return del.rowCount;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function relinkOrCreatePos(product, price) {
  const existingPos = await db.query('SELECT * FROM pos_products WHERE sku = $1', [product.sku]);
  if (existingPos.rows.length) {
    const pos = existingPos.rows[0];
    await db.query(
      `UPDATE pos_products SET name = $1, shop_price = $2, online_price = $3, ecommerce_product_id = $4 WHERE id = $5`,
      [product.name, price, price, product.id, pos.id]
    );
    await db.query(`UPDATE products SET pos_stock_product_id = $1 WHERE id = $2`, [pos.id, product.id]);
    return pos;
  }
  return ensurePosForEcommerceProduct(product);
}

(async () => {
  const existing = await findSuitProductIds();
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Suits to remove: ${existing.length}`);
  for (const row of existing.slice(0, 6)) {
    console.log(`  ${row.category_slug} | ${row.name}`);
  }
  if (existing.length > 6) console.log(`  ... and ${existing.length - 6} more`);

  if (dryRun) {
    console.log(`Would import ${CATALOG.length} two-piece suits (KSh 13,000–15,000).`);
    process.exit(0);
  }

  const removed = await deleteSuitProducts(existing);
  console.log(`Deleted ${removed} suit products.`);

  const categoryId = await ensureTwoPieceCategory();
  let imported = 0;

  for (const item of CATALOG) {
    const src = resolveImagePath(item);
    if (!src) {
      console.warn(`SKIP missing image: ${item.name}`);
      continue;
    }

    const price = priceForSlug(item.slug);
    console.log(`Importing: ${item.name} @ KSh ${price}`);
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
        price,
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

    const posRow = await relinkOrCreatePos(product, price);
    await seedPosOpeningStockIfEmpty(posRow?.id, totalStock);
    imported += 1;
  }

  const verify = await db.query(`
    SELECT c.slug, COUNT(*)::int n
    FROM products p JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON c.parent_id = parent.id
    WHERE c.slug IN ('two-piece','three-piece','suits') OR parent.slug = 'suits'
    GROUP BY c.slug ORDER BY c.slug
  `);

  invalidateCatalogueCache();
  console.log(`Done. Imported ${imported} two-piece suits.`);
  console.table(verify.rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
