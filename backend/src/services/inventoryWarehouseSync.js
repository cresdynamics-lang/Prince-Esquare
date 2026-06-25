/**
 * Backfill warehouse (store) inventory and align shop / store / website stock.
 * Idempotent — safe to run after seed or on existing catalog data.
 */
const db = require('../config/db');
const posStockCatalog = require('../db/seeds/posStockCatalog');
const { createPosInventoryItem } = require('./inventoryChannel');
const { setShopQty, setStoreQty } = require('./inventoryMovement');
const { groupVariantsByColor } = require('./inventoryProductDetail');
const {
  SKU_PREFIX,
  slugPart,
  warehouseCountFor,
  pickUnitSpec,
  buildDescription,
} = require('./inventoryCatalogSeed');

const WAREHOUSE_SKU = `${SKU_PREFIX}-%W-%`;

/** Old Excel-import bucket SKUs → stock-sheet category (for website aggregate sync). */
const LEGACY_SKU_TO_CATEGORY = {
  'POS-SHIRTS': 'Shirts',
  'POS-KHAKIS': 'Khakis',
  'POS-KNITTED-POLLOS': 'Knitted Pollos',
  'POS-POLOS': 'Polos',
  'POS-OFFICE-SHOES': 'Office Shoes',
  'POS-CASUAL-SHOES': 'Casual Shoes',
  'POS-LINEN-TROUSERS': 'Linen Trousers',
  'POS-BLAZERS': 'Blazers',
  'POS-SUITS': 'Suits',
  'POS-TRACK-SUITS': 'Track Suits',
  'POS-VESTS': 'Vests',
  'POS-CAPES': 'Capes',
  'POS-HATS': 'Hats',
  'POS-TIES': 'Ties',
  'POS-BELTS': 'Belts',
  'POS-JACKETS': 'Jackets',
  'POS-HALF-JACKETS': 'Half-Jackets',
  'POS-SWEAT-SHIRTS': 'Sweat Shirts',
  'POS-SOCKS': 'Socks',
  'POS-SWEATERS': 'Sweaters',
  'POS-JEANS': 'Jeans',
  'POS-T-SHIRTS': 'T-Shirts',
  'POS-GURKHA-PANTS': 'Gurkha Pants',
  'POS-LOAFERS': 'Loafers',
};

const padWidth = (n) => (n >= 1000 ? 5 : 4);

const flattenVariants = (colorGroups) => {
  const variants = [];
  for (const g of colorGroups || []) {
    for (const s of g.sizes || []) {
      variants.push({
        color: g.color,
        size: s.size,
        stock: s.stock,
        price_override: 0,
        image_url: null,
      });
    }
  }
  return variants;
};

const buildWarehouseTemplate = (categoryName, index, shopOffset = 0) => {
  const spec = pickUnitSpec(categoryName, shopOffset + index);
  const unitNumber = index + 1;
  const color_groups = [{
    color: spec.color,
    image_url: '',
    sizes: [{ size: spec.size, stock: 1, price_override: 0 }],
  }];
  return {
    name: `${spec.name} (Warehouse)`,
    color: spec.color,
    size: spec.size,
    shopPrice: spec.shopPrice,
    unitNumber,
    description: buildDescription(spec.name, categoryName, unitNumber, spec.size, spec.color, { warehouse: true }),
    color_groups,
  };
};

/** Ensure every POS product has shop + store level rows. */
const ensureStockLevelRows = async (client = db) => {
  const shop = await client.query(`
    INSERT INTO pos_stock_levels (product_id, current_qty)
    SELECT p.id, 0 FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    WHERE s.product_id IS NULL
  `);
  const store = await client.query(`
    INSERT INTO pos_store_stock_levels (product_id, current_qty)
    SELECT p.id, 0 FROM pos_products p
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    WHERE st.product_id IS NULL
  `);
  return { shopRows: shop.rowCount, storeRows: store.rowCount };
};

/** Fix warehouse SKUs that lost store qty or have stock on the wrong side. */
const repairWarehousePieces = async (client = db) => {
  const r = await client.query(`
    SELECT p.id,
           COALESCE(s.current_qty, 0)::int AS shop_qty,
           COALESCE(st.current_qty, 0)::int AS store_qty
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    WHERE p.sku LIKE $1
       OR (p.website_details->>'location') = 'store'
  `, [WAREHOUSE_SKU]);

  let repaired = 0;
  for (const row of r.rows) {
    const shouldBeStore = row.store_qty < 1 || row.shop_qty > 0;
    if (!shouldBeStore) continue;
    await setShopQty(row.id, 0, { client });
    await setStoreQty(row.id, Math.max(1, row.store_qty), { client });
    repaired += 1;
  }
  return { repaired };
};

const createWarehousePiece = async (client, categoryName, closing, warehouseIndex, skuPad) => {
  const code = slugPart(categoryName);
  const t = buildWarehouseTemplate(categoryName, warehouseIndex - 1, closing);
  const sku = `${SKU_PREFIX}-${code}-W-${String(warehouseIndex).padStart(skuPad, '0')}`;
  const variants = flattenVariants(t.color_groups);

  const pos = await createPosInventoryItem(
    {
      name: t.name,
      sku,
      category: categoryName,
      shopPrice: t.shopPrice,
      onlinePrice: t.shopPrice,
      ecommerceProductId: null,
    },
    client
  );

  const websiteDetails = {
    category_name: categoryName,
    unit_number: t.unitNumber,
    location: 'store',
    description: t.description,
    price: t.shopPrice,
    thumbnail: null,
    images: [],
    variants,
    color_groups: t.color_groups || groupVariantsByColor(variants),
  };

  await client.query(
    `UPDATE pos_products SET website_details = $1::jsonb, ecommerce_product_id = NULL WHERE id = $2`,
    [JSON.stringify(websiteDetails), pos.id]
  );

  await setShopQty(pos.id, 0, { client });
  await setStoreQty(pos.id, 1, { client });

  return pos;
};

/** Add missing warehouse pieces per stock-sheet category (~25% backup). */
const syncWarehouseInventory = async ({ client: extClient } = {}) => {
  const client = extClient || (await db.pool.connect());
  const release = !extClient;
  const summary = { categories: [], created: 0 };

  try {
    if (release) await client.query('BEGIN');

    for (const row of posStockCatalog) {
      const closing = row.closing ?? 0;
      if (closing <= 0) continue;

      const target = warehouseCountFor(closing);
      const code = slugPart(row.name);
      const skuPad = padWidth(Math.max(closing, target));

      const existingR = await client.query(
        `SELECT COUNT(*)::int AS n FROM pos_products
         WHERE category = $1 AND sku LIKE $2`,
        [row.name, `${SKU_PREFIX}-${code}-W-%`]
      );
      const have = existingR.rows[0]?.n ?? 0;
      const need = target - have;
      let created = 0;

      for (let i = 0; i < need; i++) {
        await createWarehousePiece(client, row.name, closing, have + i + 1, skuPad);
        created += 1;
        summary.created += 1;
      }

      summary.categories.push({
        name: row.name,
        targetShopQty: closing,
        targetStoreQty: target,
        warehousePieces: have + created,
        created,
      });
    }

    if (release) await client.query('COMMIT');
    return summary;
  } catch (e) {
    if (release) await client.query('ROLLBACK');
    throw e;
  } finally {
    if (release) client.release();
  }
};

/** Sync old POS-* bucket rows from PE-CAT category shop totals (keeps website listings accurate). */
const syncLegacyBucketsFromPeCatalog = async (client = db) => {
  const categoryShop = await client.query(`
    SELECT p.category,
           SUM(COALESCE(s.current_qty, 0))::int AS shop
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    WHERE p.sku LIKE 'PE-CAT-%' AND p.sku NOT LIKE '%-W-%'
    GROUP BY p.category
  `);
  const shopByCat = Object.fromEntries(categoryShop.rows.map((r) => [r.category, r.shop]));

  const legacy = await client.query(`SELECT id, sku FROM pos_products WHERE sku LIKE 'POS-%'`);
  let updated = 0;
  for (const row of legacy.rows) {
    const cat = LEGACY_SKU_TO_CATEGORY[row.sku];
    if (!cat) continue;
    const shopTotal = shopByCat[cat] ?? 0;
    await setShopQty(row.id, shopTotal, { client });
    updated += 1;
  }
  return { updated };
};

const applyWebsiteStockRow = async (client, row) => {
  const posSku = String(row.pos_sku || '');
  let shopQty = Math.max(0, row.shop_qty);
  if (posSku.includes('-W-')) shopQty = 0;

  const varR = await client.query(
    `SELECT id FROM product_variants WHERE product_id = $1 ORDER BY id`,
    [row.web_id]
  );
  const variants = varR.rows;
  const isLegacyBucket = posSku.startsWith('POS-');

  if (!variants.length) {
    await client.query(
      `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`,
      [shopQty, row.web_id]
    );
    return 1;
  }

  if (isLegacyBucket) {
    const perVariant = shopQty > 0
      ? Math.max(1, Math.floor(shopQty / variants.length))
      : 0;
    for (const v of variants) {
      await client.query(
        `UPDATE product_variants SET stock_quantity = $1 WHERE id = $2`,
        [perVariant, v.id]
      );
    }
    await client.query(
      `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`,
      [shopQty, row.web_id]
    );
  } else {
    const sumR = await client.query(
      `SELECT COALESCE(SUM(stock_quantity), 0)::int AS total
       FROM product_variants WHERE product_id = $1`,
      [row.web_id]
    );
    const total = sumR.rows[0]?.total ?? 0;
    const resolvedTotal = total > 0 ? total : shopQty;
    await client.query(
      `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`,
      [resolvedTotal, row.web_id]
    );
  }
  return 1;
};

const webRowsForPosProduct = async (client, productId) => {
  const r = await client.query(
    `SELECT DISTINCT ON (p.id)
            pp.id AS pos_id,
            pp.sku AS pos_sku,
            p.id AS web_id,
            COALESCE(sl.current_qty, 0)::int AS shop_qty
     FROM pos_products pp
     JOIN products p ON p.id = pp.ecommerce_product_id OR p.pos_stock_product_id = pp.id
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     WHERE pp.id = $1
     ORDER BY p.id, (pp.sku LIKE 'PE-CAT-%') DESC`,
    [productId]
  );
  return r.rows;
};

const webRowsForLegacySku = async (client, legacySku) => {
  const r = await client.query(
    `SELECT DISTINCT ON (p.id)
            pp.id AS pos_id,
            pp.sku AS pos_sku,
            p.id AS web_id,
            COALESCE(sl.current_qty, 0)::int AS shop_qty
     FROM pos_products pp
     JOIN products p ON p.id = pp.ecommerce_product_id OR p.pos_stock_product_id = pp.id
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     WHERE pp.sku = $1
     ORDER BY p.id`,
    [legacySku]
  );
  return r.rows;
};

/** Recompute one legacy POS-* bucket from PE-CAT shop totals for a category. */
const syncLegacyBucketForCategory = async (client, categoryName) => {
  const legacySku = Object.entries(LEGACY_SKU_TO_CATEGORY).find(([, v]) => v === categoryName)?.[0];
  if (!legacySku) return null;

  const shopR = await client.query(
    `SELECT COALESCE(SUM(sl.current_qty), 0)::int AS shop
     FROM pos_products pp
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     WHERE pp.category = $1
       AND pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'`,
    [categoryName]
  );
  const shopTotal = shopR.rows[0]?.shop ?? 0;

  const legacyR = await client.query(`SELECT id FROM pos_products WHERE sku = $1`, [legacySku]);
  if (!legacyR.rows.length) return null;

  await setShopQty(legacyR.rows[0].id, shopTotal, { client });
  return legacySku;
};

/** Sync website stock for products linked to one POS piece (and its category legacy bucket). */
const syncWebsiteStockForPosProduct = async (productId) => {
  const pieceR = await db.query(`SELECT sku, category FROM pos_products WHERE id = $1`, [productId]);
  const piece = pieceR.rows[0];
  if (!piece) return { updated: 0 };

  let updated = 0;
  const directRows = await webRowsForPosProduct(db, productId);
  for (const row of directRows) {
    updated += await applyWebsiteStockRow(db, row);
  }

  if (String(piece.sku || '').startsWith('PE-CAT-') && piece.category) {
    const legacySku = await syncLegacyBucketForCategory(db, piece.category);
    if (legacySku) {
      const legacyRows = await webRowsForLegacySku(db, legacySku);
      for (const row of legacyRows) {
        updated += await applyWebsiteStockRow(db, row);
      }
    }
  }

  return { updated };
};

/** Sync published website stock from linked POS shop floor qty. */
const syncWebsiteStockFromPosShop = async (client = db) => {
  const r = await client.query(`
    SELECT DISTINCT ON (p.id)
           pp.id AS pos_id,
           pp.sku AS pos_sku,
           p.id AS web_id,
           COALESCE(sl.current_qty, 0)::int AS shop_qty
    FROM products p
    JOIN pos_products pp ON p.id = pp.ecommerce_product_id OR p.pos_stock_product_id = pp.id
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    ORDER BY p.id, (pp.sku LIKE 'PE-CAT-%') DESC
  `);

  let updated = 0;
  for (const row of r.rows) {
    updated += await applyWebsiteStockRow(client, row);
  }
  return { updated };
};

/** Full alignment: link website products, stock rows, warehouse backfill, website sync. */
const syncInventoryAlignment = async () => {
  const { ensureAllEcommerceProductsInPos } = require('./inventoryChannel');
  const websiteLinks = await ensureAllEcommerceProductsInPos();

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const levels = await ensureStockLevelRows(client);
    const warehouse = await syncWarehouseInventory({ client });
    const repaired = await repairWarehousePieces(client);
    const legacy = await syncLegacyBucketsFromPeCatalog(client);
    await client.query('COMMIT');

    const website = await syncWebsiteStockFromPosShop();

    return {
      websiteLinks,
      levels,
      warehouse,
      repaired,
      legacy,
      website,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  ensureStockLevelRows,
  repairWarehousePieces,
  syncWarehouseInventory,
  syncLegacyBucketsFromPeCatalog,
  syncLegacyBucketForCategory,
  syncWebsiteStockForPosProduct,
  syncWebsiteStockFromPosShop,
  syncInventoryAlignment,
  warehouseCountFor,
  LEGACY_SKU_TO_CATEGORY,
};
