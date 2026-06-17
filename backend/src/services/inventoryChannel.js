/**
 * Dual-channel inventory: POS shop stock vs website catalogue.
 * Same item can exist in both with different prices (shop_price vs products.price).
 */
const db = require('../config/db');
const { generateProductSku } = require('../utils/sku');
const { upsertWebsiteVariants } = require('./websiteVariants');
const { skuFromName } = require('../utils/stockExcelParser');
const {
  linkProductPair,
  inferPosBucketName,
} = require('./productPosLink');
const { ensureStoreStockRow } = require('./inventoryMovement');

const slugify = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'product';

const uniqueSlug = async (base, client = db) => {
  let slug = base;
  let suffix = 0;
  while (true) {
    const r = await client.query('SELECT 1 FROM products WHERE slug = $1', [slug]);
    if (!r.rows.length) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
};

const ensurePosStockRow = async (posProductId, client = db) => {
  await client.query(
    `INSERT INTO pos_stock_levels (product_id, current_qty)
     VALUES ($1, 0)
     ON CONFLICT (product_id) DO NOTHING`,
    [posProductId]
  );
};

const createPosInventoryItem = async (
  { name, sku, category, shopPrice, onlinePrice, storePrice = null, ecommerceProductId = null },
  client = db
) => {
  const resolvedStorePrice = storePrice != null ? storePrice : shopPrice;
  const r = await client.query(
    `INSERT INTO pos_products (name, sku, category, shop_price, online_price, store_price, ecommerce_product_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      name,
      sku || skuFromName(name),
      category || 'General',
      shopPrice,
      onlinePrice ?? shopPrice,
      resolvedStorePrice,
      ecommerceProductId,
    ]
  );
  await ensurePosStockRow(r.rows[0].id, client);
  await ensureStoreStockRow(client, r.rows[0].id);
  return r.rows[0];
};

/** When an admin creates a website product, ensure a dedicated POS inventory row exists. */
const ensurePosForEcommerceProduct = async (product, options = {}) => {
  const shopPriceOverride = options.shop_price ?? options.shopPrice;
  if (product.pos_stock_product_id) {
    const linked = await db.query('SELECT * FROM pos_products WHERE id = $1', [product.pos_stock_product_id]);
    if (linked.rows.length) return linked.rows[0];
  }

  const byEcom = await db.query(`SELECT * FROM pos_products WHERE ecommerce_product_id = $1`, [product.id]);
  if (byEcom.rows.length) {
    if (!product.pos_stock_product_id) {
      await linkProductPair(product.id, byEcom.rows[0].id, { syncPrices: false });
    }
    return byEcom.rows[0];
  }

  let categorySlug = null;
  let categoryName = 'General';
  if (product.category_id) {
    const c = await db.query('SELECT slug, name FROM categories WHERE id = $1', [product.category_id]);
    categorySlug = c.rows[0]?.slug || null;
    categoryName = c.rows[0]?.name || inferPosBucketName(product.name, categorySlug) || 'General';
  } else {
    categoryName = inferPosBucketName(product.name, categorySlug) || 'General';
  }

  const sellPrice = parseFloat(product.discount_price || product.price || 0);
  const listPrice = parseFloat(product.price || 0);
  const shopPrice = shopPriceOverride != null ? parseFloat(shopPriceOverride) : sellPrice;

  const created = await createPosInventoryItem({
    name: product.name,
    sku: product.sku,
    category: categoryName,
    shopPrice,
    onlinePrice: listPrice,
    ecommerceProductId: product.id,
  });
  await linkProductPair(product.id, created.id, { syncPrices: false });
  return created;
};

const syncPosMetadataFromEcommerce = async (product, posRow = null) => {
  const posId = posRow?.id || product.pos_stock_product_id;
  if (!posId) return null;

  let categoryName = 'General';
  if (product.category_id) {
    const c = await db.query('SELECT name, slug FROM categories WHERE id = $1', [product.category_id]);
    categoryName = c.rows[0]?.name || inferPosBucketName(product.name, c.rows[0]?.slug) || categoryName;
  } else {
    categoryName = inferPosBucketName(product.name, null) || categoryName;
  }

  const shopPrice = parseFloat(product.pos_sell_price ?? product.discount_price ?? product.price ?? 0);
  const listPrice = parseFloat(product.price ?? shopPrice);

  await db.query(
    `UPDATE pos_products
     SET name = $1, category = $2, shop_price = $3, online_price = $4,
         ecommerce_product_id = COALESCE(ecommerce_product_id, $5)
     WHERE id = $6`,
    [product.name, categoryName, shopPrice, listPrice, product.id, posId]
  );
  return { id: posId, categoryName, shopPrice, listPrice };
};

/** One-time seed: copy website stock_quantity into POS shop when POS qty is still zero. */
const seedPosOpeningStockIfEmpty = async (posProductId, qty) => {
  const amount = parseInt(qty, 10);
  if (!posProductId || amount < 1) return { seeded: false };

  const currentR = await db.query(
    `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
    [posProductId]
  );
  const current = currentR.rows[0]?.current_qty ?? 0;
  if (current > 0) return { seeded: false, currentQty: current };

  const { setShopQty, afterInventoryChange, ensureStoreStockRow } = require('./inventoryMovement');
  await ensureStoreStockRow(db, posProductId);
  const shopQty = await setShopQty(posProductId, amount);
  const levels = { shopQty, storeQty: 0 };
  await afterInventoryChange(posProductId, levels);
  return { seeded: true, shopQty };
};

/** Backfill POS rows for every website product — safe to run repeatedly. */
const needsDedicatedInventoryRow = async (product) => {
  if (!product.pos_stock_product_id) return false;

  const posR = await db.query(
    `SELECT id, sku, ecommerce_product_id FROM pos_products WHERE id = $1`,
    [product.pos_stock_product_id]
  );
  const pos = posR.rows[0];
  if (!pos) return false;

  if (String(pos.sku || '').startsWith('POS-')) return true;
  if (pos.ecommerce_product_id && pos.ecommerce_product_id !== product.id) return true;

  const shareR = await db.query(
    `SELECT COUNT(*)::int AS n FROM products WHERE pos_stock_product_id = $1`,
    [product.pos_stock_product_id]
  );
  return (shareR.rows[0]?.n ?? 0) > 1;
};

const ensureAllEcommerceProductsInPos = async () => {
  const products = await db.query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at ASC`
  );

  let linked = 0;
  let split = 0;
  let stockSeeded = 0;

  for (const product of products.rows) {
    const hadLink = Boolean(product.pos_stock_product_id);
    let posRow;

    if (await needsDedicatedInventoryRow(product)) {
      await db.query(`UPDATE products SET pos_stock_product_id = NULL WHERE id = $1`, [product.id]);
      posRow = await ensurePosForEcommerceProduct({ ...product, pos_stock_product_id: null });
      split += 1;
      linked += 1;
    } else {
      posRow = await ensurePosForEcommerceProduct(product);
      if (!hadLink) linked += 1;
    }

    if (!posRow?.id) continue;

    await syncPosMetadataFromEcommerce(product, posRow);

    const websiteQty = parseInt(product.stock_quantity, 10) || 0;
    const seed = await seedPosOpeningStockIfEmpty(posRow.id, websiteQty);
    if (seed.seeded) stockSeeded += 1;
  }

  return { scanned: products.rows.length, linked, split, stockSeeded };
};

/** Publish an inventory-only POS item to the website (or re-activate an existing link). */
const publishPosToWebsite = async (posProductId, body = {}) => {
  const posR = await db.query('SELECT * FROM pos_products WHERE id = $1', [posProductId]);
  if (!posR.rows.length) {
    throw Object.assign(new Error('Inventory item not found'), { statusCode: 404 });
  }
  const pos = posR.rows[0];

  const {
    thumbnail,
    images = [],
    price,
    discount_price,
    description,
    category_id,
    brand_id,
    stock_quantity,
    is_active = true,
    variants = [],
  } = body;

  const webPrice = price != null ? parseFloat(price) : parseFloat(pos.online_price || pos.shop_price);
  const webDiscount = discount_price != null ? parseFloat(discount_price) : null;
  const imagesJson = images?.length ? JSON.stringify(images) : null;
  const variantStockTotal = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
  const resolvedStock =
    stock_quantity != null ? parseInt(stock_quantity, 10) : variantStockTotal || null;

  if (pos.ecommerce_product_id) {
    const upd = await db.query(
      `UPDATE products SET
        is_active = $1,
        thumbnail = COALESCE($2, thumbnail),
        images = COALESCE($3::jsonb, images),
        price = $4,
        discount_price = $5,
        description = COALESCE($6, description),
        category_id = COALESCE($7, category_id),
        brand_id = COALESCE($8, brand_id),
        stock_quantity = COALESCE($9, stock_quantity),
        updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        is_active !== false,
        thumbnail || null,
        imagesJson,
        webPrice,
        webDiscount,
        description || null,
        category_id || null,
        brand_id || null,
        resolvedStock,
        pos.ecommerce_product_id,
      ]
    );
    const productSku = generateProductSku({ name: pos.name, sku: pos.sku });
    if (variants.length) {
      await upsertWebsiteVariants(pos.ecommerce_product_id, variants, productSku);
    }
    await db.query(`UPDATE pos_products SET online_price = $1, shop_price = $1 WHERE id = $2`, [webPrice, posProductId]);
    return { product: upd.rows[0], posProductId, published: true, created: false };
  }

  const slug = await uniqueSlug(slugify(body.slug || pos.name));
  const sku = generateProductSku({ name: pos.name, slug, sku: pos.sku });

  const ins = await db.query(
    `INSERT INTO products (name, slug, sku, description, price, discount_price, category_id, brand_id, stock_quantity, is_active, thumbnail, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      pos.name,
      slug,
      sku,
      description || `Premium ${pos.name} from Prince Esquire.`,
      webPrice,
      webDiscount,
      category_id || null,
      brand_id || null,
      resolvedStock ?? 0,
      is_active !== false,
      thumbnail || null,
      JSON.stringify(images || []),
    ]
  );

  if (variants.length) {
    await upsertWebsiteVariants(ins.rows[0].id, variants, sku);
  }

  await linkProductPair(ins.rows[0].id, posProductId, { syncPrices: false });
  await db.query(`UPDATE pos_products SET online_price = $1, shop_price = $1 WHERE id = $2`, [webPrice, posProductId]);

  return { product: ins.rows[0], posProductId, published: true, created: true };
};

/** Hide from website without removing POS inventory or the link. */
const unpublishFromWebsite = async (posProductId) => {
  const posR = await db.query(
    'SELECT ecommerce_product_id FROM pos_products WHERE id = $1',
    [posProductId]
  );
  if (!posR.rows.length || !posR.rows[0].ecommerce_product_id) {
    return { unpublished: false, reason: 'not_linked' };
  }
  await db.query(
    `UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1`,
    [posR.rows[0].ecommerce_product_id]
  );
  return { unpublished: true, ecommerceProductId: posR.rows[0].ecommerce_product_id };
};

module.exports = {
  ensurePosForEcommerceProduct,
  ensureAllEcommerceProductsInPos,
  syncPosMetadataFromEcommerce,
  seedPosOpeningStockIfEmpty,
  publishPosToWebsite,
  unpublishFromWebsite,
  createPosInventoryItem,
  ensurePosStockRow,
};
