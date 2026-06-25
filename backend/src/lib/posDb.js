// MODIFIED — Raw SQL helpers for POS (no Prisma required)
const db = require('../config/db');
const { groupVariantsByColor } = require('../services/inventoryProductDetail');

const parseDraft = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const mapProduct = (p) => {
  const retailPrice =
    parseFloat(p.shop_price) ||
    parseFloat(p.website_discount_price) ||
    parseFloat(p.website_price) ||
    parseFloat(p.online_price) ||
    0;
  const costRaw = p.cost_price ?? p.website_cost_price;
  const costPrice = costRaw != null ? parseFloat(costRaw) : null;
  return {
    ...p,
    shop_price: parseFloat(p.shop_price),
    online_price: p.online_price != null ? parseFloat(p.online_price) : null,
    store_price: p.store_price != null ? parseFloat(p.store_price) : null,
    website_price: p.website_price != null ? parseFloat(p.website_price) : null,
    website_discount_price:
      p.website_discount_price != null ? parseFloat(p.website_discount_price) : null,
    website_published: Boolean(p.website_published),
    website_product_id: p.website_product_id || null,
    website_thumbnail: p.website_thumbnail || null,
    retailPrice,
    costPrice,
    stock_level: p.current_qty != null ? { current_qty: p.current_qty } : null,
    currentQty: p.current_qty ?? 0,
    isLow: (p.current_qty ?? 0) <= p.low_stock_threshold,
    isOut: (p.current_qty ?? 0) === 0,
  };
};

const enrichStockRows = async (rows) => {
  const webIds = [...new Set(rows.map((r) => r.ecommerce_product_id || r.website_product_id).filter(Boolean))];
  const variantsByProduct = {};

  if (webIds.length) {
    const vr = await db.query(
      `SELECT product_id, id, color, size, stock_quantity, image_url
       FROM product_variants
       WHERE product_id = ANY($1::uuid[])
       ORDER BY color, size`,
      [webIds]
    );
    for (const v of vr.rows) {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
      variantsByProduct[v.product_id].push({
        id: v.id,
        color: v.color,
        size: v.size,
        stock: v.stock_quantity ?? 0,
        image_url: v.image_url,
      });
    }
  }

  return rows.map((p) => {
    const draft = parseDraft(p.website_details);
    const webId = p.ecommerce_product_id || p.website_product_id;
    const liveVariants = webId ? variantsByProduct[webId] : null;
    const variants = liveVariants?.length ? liveVariants : (draft.variants || []);
    const color_groups = variants.length
      ? groupVariantsByColor(variants)
      : (draft.color_groups || []);

    return {
      ...p,
      description: p.website_description || draft.description || '',
      color_groups,
    };
  });
};

/** Excludes legacy Excel aggregate buckets (POS-SHIRTS etc.). */
const MANAGED_INVENTORY_FILTER = `p.sku NOT LIKE 'POS-%' AND p.ecommerce_product_id IS NOT NULL`;
const SHOP_FLOOR_INVENTORY_FILTER = `${MANAGED_INVENTORY_FILTER} AND p.sku NOT LIKE '%-W-%'`;
const SHOP_FLOOR_PP_FILTER = `pp.sku NOT LIKE 'POS-%' AND pp.ecommerce_product_id IS NOT NULL AND pp.sku NOT LIKE '%-W-%'`;

/** Lightweight low-stock list for dashboard overview (no variant enrichment). */
const getLowStockSummary = async ({ limit = 25 } = {}) => {
  const r = await db.query(
    `SELECT p.id, p.name, p.sku, p.category, p.low_stock_threshold,
            COALESCE(s.current_qty, 0)::int AS current_qty
     FROM pos_products p
     LEFT JOIN pos_stock_levels s ON s.product_id = p.id
     WHERE ${MANAGED_INVENTORY_FILTER}
       AND COALESCE(s.current_qty, 0) <= p.low_stock_threshold
     ORDER BY COALESCE(s.current_qty, 0) ASC, p.name ASC
     LIMIT $1`,
    [limit]
  );
  return r.rows.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    currentQty: p.current_qty,
    low_stock_threshold: p.low_stock_threshold,
    isLow: true,
    isOut: p.current_qty === 0,
  }));
};

const getStockLevels = async ({ category = null } = {}) => {
  const params = [];
  let where = `WHERE ${MANAGED_INVENTORY_FILTER}`;
  if (category) {
    params.push(category);
    where = `WHERE p.category = $1 AND ${MANAGED_INVENTORY_FILTER}`;
  }

  const r = await db.query(`
    SELECT p.id, p.name, p.sku, p.category, p.low_stock_threshold, p.ecommerce_product_id,
           p.shop_price, p.online_price, p.store_price, p.cost_price, p.created_at, p.website_details,
           ec.id AS website_product_id,
           ec.is_active AS website_published,
           ec.price AS website_price,
           ec.discount_price AS website_discount_price,
           ec.cost_price AS website_cost_price,
           ec.thumbnail AS website_thumbnail,
           ec.description AS website_description,
           ec.category_id AS website_category_id,
           cat.name AS website_category_name,
           (SELECT COUNT(*)::int FROM product_variants pv WHERE pv.product_id = ec.id) AS variant_count,
           s.current_qty,
           COALESCE(st.current_qty, 0) AS store_qty,
           s.updated_at AS stock_updated_at,
           COALESCE(snap.opening_qty, s.current_qty, 0)::int AS shop_opening,
           COALESCE(snap.sales_qty, 0)::int AS sales_qty,
           COALESCE(snap.stock_out_qty, 0)::int AS stock_out_qty,
           COALESCE(snap.stock_in_qty, 0)::int AS stock_in_qty,
           COALESCE(snap.closing_qty, s.current_qty, 0)::int AS shop_closing
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    LEFT JOIN products ec ON ec.id = p.ecommerce_product_id
    LEFT JOIN categories cat ON cat.id = ec.category_id
    LEFT JOIN pos_daily_stock_snapshots snap
      ON snap.product_id = p.id AND snap.date = CURRENT_DATE
    ${where}
    ORDER BY p.category ASC, p.name ASC
  `, params);
  const enriched = await enrichStockRows(r.rows);
  return enriched.map((p) => {
    const draft = typeof p.website_details === 'object'
      ? p.website_details
      : (() => { try { return JSON.parse(p.website_details || '{}'); } catch { return {}; } })();
    const draftVariants = Array.isArray(draft.variants) ? draft.variants.length : 0;
    return {
      ...mapProduct(p),
      storeQty: p.store_qty ?? 0,
      description: p.description || '',
      color_groups: p.color_groups || [],
      website_category_name: p.website_category_name || draft.category_name || p.category,
      website_category_id: p.website_category_id || draft.category_id || null,
      variant_count: p.variant_count || draftVariants || p.color_groups?.length || 0,
      data_source: p.website_product_id ? 'live' : (draftVariants ? 'draft' : 'basic'),
      on_website: Boolean(p.website_product_id && p.website_published),
      inventory_only: !p.website_product_id || !p.website_published,
      shopOpening: p.shop_opening ?? p.current_qty ?? 0,
      salesQty: p.sales_qty ?? 0,
      stockOutQty: p.stock_out_qty ?? 0,
      stockInQty: p.stock_in_qty ?? 0,
      shopClosing: p.shop_closing ?? p.current_qty ?? 0,
    };
  });
};

const channelMeta = (hasInventory, onWebsite, websiteLive) => {
  if (hasInventory && onWebsite) {
    return {
      channel: 'both',
      websiteStatus: websiteLive ? 'live' : 'hidden',
      publishedOnline: websiteLive,
    };
  }
  if (onWebsite) {
    return {
      channel: 'website',
      websiteStatus: websiteLive ? 'live' : 'hidden',
      publishedOnline: websiteLive,
    };
  }
  return {
    channel: 'inventory',
    websiteStatus: 'none',
    publishedOnline: false,
  };
};

const getShopFloorCategoryTotals = async () => {
  const r = await db.query(`
    SELECT p.category AS name,
           SUM(COALESCE(s.current_qty, 0))::int AS shop_qty,
           COUNT(*) FILTER (WHERE COALESCE(s.current_qty, 0) > 0)::int AS in_stock_pieces
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    WHERE ${SHOP_FLOOR_INVENTORY_FILTER}
    GROUP BY p.category
    ORDER BY p.category ASC
  `);
  return r.rows;
};

/** Website pool per category (legacy POS bucket qty synced from shop floor sum). */
const getCategoryWebsitePools = async () => {
  const { LEGACY_SKU_TO_CATEGORY } = require('../services/inventoryWarehouseSync');
  const legacy = await db.query(`
    SELECT pp.sku, COALESCE(sl.current_qty, 0)::int AS qty
    FROM pos_products pp
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    WHERE pp.sku LIKE 'POS-%'
  `);
  const pools = {};
  for (const row of legacy.rows) {
    const cat = LEGACY_SKU_TO_CATEGORY[row.sku];
    if (cat) pools[cat] = row.qty;
  }
  const published = await db.query(`
    SELECT pp.category,
           SUM(COALESCE(sl.current_qty, 0))::int AS shop
    FROM pos_products pp
    JOIN products ec ON ec.id = pp.ecommerce_product_id AND ec.is_active = true
    LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
    WHERE pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'
    GROUP BY pp.category
  `);
  for (const row of published.rows) {
    if (pools[row.category] == null) pools[row.category] = row.shop;
  }
  return pools;
};

const buildCategoryBalance = (categoryTotals, websitePools) =>
  categoryTotals.map((c) => {
    const shopTotal = c.shop_qty ?? 0;
    const websitePool = websitePools[c.name] ?? null;
    return {
      name: c.name,
      shopTotal,
      websitePool,
      inStockPieces: c.in_stock_pieces ?? 0,
      balanced: websitePool == null ? null : shopTotal === websitePool,
    };
  });

const legacySkusForCategory = (category) => {
  const { LEGACY_SKU_TO_CATEGORY } = require('../services/inventoryWarehouseSync');
  return Object.entries(LEGACY_SKU_TO_CATEGORY)
    .filter(([, cat]) => cat === category)
    .map(([sku]) => sku);
};

const appendSellerCategoryFilter = (category, params, { ppAlias = 'pp', catAlias = null } = {}) => {
  if (!category) return '';
  const legacySkus = legacySkusForCategory(category);
  params.push(category);
  let clause = catAlias
    ? ` AND (${ppAlias}.category = $${params.length} OR ${catAlias}.name = $${params.length}`
    : ` AND (${ppAlias}.category = $${params.length}`;
  if (legacySkus.length) {
    params.push(legacySkus);
    clause += ` OR ${ppAlias}.sku = ANY($${params.length})`;
  }
  clause += ')';
  return clause;
};

const resolveStockCategory = (posSku, stockCategory, categoryName) => {
  const { LEGACY_SKU_TO_CATEGORY } = require('../services/inventoryWarehouseSync');
  return LEGACY_SKU_TO_CATEGORY[posSku] || stockCategory || categoryName || null;
};

const attachVariants = async (items) => {
  const productIds = items.map((c) => c.ecommerceProductId).filter(Boolean);
  if (!productIds.length) return items;
  const variantsR = await db.query(
    `SELECT id, product_id, name, value, size, color, price_modifier, stock_quantity
     FROM product_variants
     WHERE product_id = ANY($1::uuid[])
     ORDER BY product_id, size NULLS LAST, color NULLS LAST, name`,
    [productIds]
  );
  const byProduct = {};
  for (const v of variantsR.rows) {
    if (!byProduct[v.product_id]) byProduct[v.product_id] = [];
    byProduct[v.product_id].push({
      ...v,
      price_modifier: parseFloat(v.price_modifier || 0),
    });
  }
  for (const item of items) {
    if (item.ecommerceProductId) {
      item.variants = byProduct[item.ecommerceProductId] || [];
    }
  }
  return items;
};

const catalogMeta = (items, {
  categoryTotals = [],
  categoryBalance = [],
  totalMatching = 0,
  itemsReturned = 0,
  limit = 100,
  offset = 0,
  websiteLiveTotal = 0,
  inventoryOnlyTotal = 0,
} = {}) => {
  const categories = [...new Set(items.map((p) => p.categoryName || p.stockCategory).filter(Boolean))].sort();
  const inStock = items.filter((p) => p.productId && !p.isOut && (p.currentQty ?? 0) > 0);
  const totalInStock = categoryTotals.length
    ? categoryTotals.reduce((sum, c) => sum + (c.in_stock_pieces ?? 0), 0)
    : totalMatching || inStock.length;
  const isLive = (p) => p.isWebsiteListing || p.pieceOnWebsite || p.websiteStatus === 'live';
  return {
    total: totalMatching || items.length,
    totalInStock,
    itemsReturned,
    limit,
    offset,
    hasMore: offset + itemsReturned < totalMatching,
    page: Math.floor(offset / limit) + 1,
    totalPages: totalMatching ? Math.ceil(totalMatching / limit) : 1,
    inStock: inStock.length,
    inventory: inventoryOnlyTotal || items.filter((p) => !isLive(p)).length,
    website: websiteLiveTotal || items.filter(isLive).length,
    onWebsite: websiteLiveTotal || items.filter(isLive).length,
    filterCounts: {
      all: totalMatching || items.length,
      in_stock: totalInStock,
      inventory: inventoryOnlyTotal,
      website: websiteLiveTotal,
    },
    categories,
    categoryTotals,
    categoryBalance,
    shopFloorOnly: true,
  };
};

const mapWebsiteListingRow = (row, { shopByCat, websitePools, balanceByCat }) => {
  const stock = Number(row.stock_qty ?? 0);
  const cat = resolveStockCategory(row.pos_sku, row.stock_category, row.category_name);
  const balance = balanceByCat[cat];
  const shopPrice = parseFloat(
    row.pos_sell_price != null ? row.pos_sell_price : row.website_sell_price ?? row.shop_price ?? 0
  );
  return {
    id: row.ecommerce_product_id,
    ecommerceProductId: row.ecommerce_product_id,
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || row.pos_sku,
    thumbnail: row.thumbnail,
    shop_price: shopPrice,
    website_price: parseFloat(row.website_sell_price ?? 0),
    list_price: parseFloat(row.website_list_price ?? 0),
    channel: 'website',
    websiteStatus: 'live',
    publishedOnline: true,
    pieceOnWebsite: true,
    isWebsiteListing: true,
    websiteStockQty: Number(row.website_stock ?? stock),
    categoryShopTotal: shopByCat[cat] ?? 0,
    categoryWebsiteStock: websitePools[cat] ?? null,
    categoryBalanced: balance?.balanced ?? null,
    stockCategory: cat,
    categoryName: row.category_name || cat,
    isCategoryFallback: false,
    stock_level: { current_qty: stock },
    currentQty: stock,
    isOut: stock === 0,
    variants: [],
  };
};

const mapShopPieceRow = (row, { shopByCat, websitePools, balanceByCat }) => {
  const stock = Number(row.stock_qty ?? 0);
  const cat = row.stock_category;
  const pieceOnWebsite = Boolean(row.website_product_id && row.website_live);
  const balance = balanceByCat[cat];
  const meta = channelMeta(true, pieceOnWebsite, pieceOnWebsite);
  return {
    id: `pos-${row.product_id}`,
    ecommerceProductId: row.website_product_id || null,
    productId: row.product_id,
    name: row.name,
    slug: row.website_slug || null,
    sku: row.sku,
    thumbnail: null,
    shop_price: parseFloat(row.shop_price),
    website_price: row.online_price != null ? parseFloat(row.online_price) : null,
    list_price: null,
    ...meta,
    publishedOnline: pieceOnWebsite,
    websiteStatus: pieceOnWebsite ? 'live' : 'none',
    pieceOnWebsite,
    isWebsiteListing: false,
    websiteStockQty: pieceOnWebsite ? stock : null,
    categoryShopTotal: shopByCat[cat] ?? 0,
    categoryWebsiteStock: websitePools[cat] ?? null,
    categoryBalanced: balance?.balanced ?? null,
    stockCategory: cat,
    categoryName: cat,
    isCategoryFallback: false,
    stock_level: { current_qty: stock },
    currentQty: stock,
    isOut: stock === 0,
    variants: [],
  };
};

const loadSellerCatalogContext = async () => {
  const [categoryTotals, websitePools] = await Promise.all([
    getShopFloorCategoryTotals(),
    getCategoryWebsitePools(),
  ]);
  const shopByCat = Object.fromEntries(categoryTotals.map((c) => [c.name, c.shop_qty ?? 0]));
  const balanceByCat = Object.fromEntries(
    buildCategoryBalance(categoryTotals, websitePools).map((b) => [b.name, b])
  );
  const categoryBalance = buildCategoryBalance(categoryTotals, websitePools);
  return { categoryTotals, websitePools, shopByCat, balanceByCat, categoryBalance };
};

const buildWebsiteLiveWhere = ({ q, category, inStockOnly, params }) => {
  let where = `WHERE p.is_active = true
    AND p.pos_stock_product_id IS NOT NULL
    AND ${SHOP_FLOOR_PP_FILTER}`;
  if (inStockOnly) where += ' AND COALESCE(sl.current_qty, 0) > 0';
  where += appendSellerCategoryFilter(category, params, { ppAlias: 'pp', catAlias: 'c' });
  if (q) {
    params.push(`%${q}%`, q.toUpperCase());
    where += ` AND (
      p.name ILIKE $${params.length - 1}
      OR p.sku ILIKE $${params.length - 1}
      OR UPPER(COALESCE(p.sku, pp.sku)) = $${params.length}
      OR pp.name ILIKE $${params.length - 1}
      OR pp.sku ILIKE $${params.length - 1}
      OR c.name ILIKE $${params.length - 1}
    )`;
  }
  return where;
};

const buildShopPiecesWhere = ({ q, category, inStockOnly, params, excludeWebsiteLinked = true }) => {
  let where = `WHERE ${SHOP_FLOOR_PP_FILTER}`;
  if (excludeWebsiteLinked) {
    where += ` AND pp.id NOT IN (
      SELECT pos_stock_product_id FROM products
      WHERE is_active = true AND pos_stock_product_id IS NOT NULL
    )`;
  }
  if (inStockOnly) where += ' AND COALESCE(sl.current_qty, 0) > 0';
  where += appendSellerCategoryFilter(category, params);
  if (q) {
    params.push(`%${q}%`, q.toUpperCase());
    where += ` AND (
      pp.name ILIKE $${params.length - 1}
      OR pp.sku ILIKE $${params.length - 1}
      OR UPPER(pp.sku) = $${params.length}
      OR pp.category ILIKE $${params.length - 1}
    )`;
  }
  return where;
};

const WEBSITE_LISTING_SELECT = `
  SELECT p.id AS ecommerce_product_id,
         p.name,
         p.slug,
         p.sku,
         p.thumbnail,
         p.price AS website_list_price,
         COALESCE(NULLIF(p.discount_price, 0), p.price) AS website_sell_price,
         p.pos_sell_price,
         p.stock_quantity AS website_stock,
         pp.id AS product_id,
         pp.sku AS pos_sku,
         pp.category AS stock_category,
         pp.shop_price,
         COALESCE(sl.current_qty, 0)::int AS stock_qty,
         c.name AS category_name
  FROM products p
  INNER JOIN pos_products pp ON pp.id = p.pos_stock_product_id
  LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
  LEFT JOIN categories c ON c.id = p.category_id
`;

const SHOP_PIECE_SELECT = `
  SELECT pp.id AS product_id,
         pp.name,
         pp.sku,
         pp.category AS stock_category,
         pp.shop_price,
         pp.online_price,
         pp.ecommerce_product_id,
         COALESCE(sl.current_qty, 0)::int AS stock_qty,
         ec.id AS website_product_id,
         ec.is_active AS website_live,
         ec.stock_quantity AS website_product_stock,
         ec.slug AS website_slug
  FROM pos_products pp
  LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
  LEFT JOIN products ec ON ec.id = pp.ecommerce_product_id
`;

/** Live website listings only (shared POS pool rows). */
const searchWebsiteLiveCatalog = async (opts) => {
  const { search = '', category = '', limit = 100, offset = 0, inStockOnly = false } = opts;
  const q = search.trim();
  const params = [];
  const where = buildWebsiteLiveWhere({ q, category, inStockOnly, params });
  const ctx = await loadSellerCatalogContext();

  const countR = await db.query(
    `SELECT COUNT(*)::int AS total FROM products p
     INNER JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     LEFT JOIN categories c ON c.id = p.category_id
     ${where}`,
    params
  );
  const totalMatching = countR.rows[0]?.total ?? 0;
  const pageParams = [...params, limit, offset];
  const r = await db.query(
    `${WEBSITE_LISTING_SELECT}
     ${where}
     ORDER BY p.name ASC
     LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams
  );
  const items = r.rows.map((row) => mapWebsiteListingRow(row, ctx));
  await attachVariants(items);
  return {
    items,
    meta: catalogMeta(items, {
      ...ctx,
      totalMatching,
      itemsReturned: items.length,
      limit,
      offset,
      websiteLiveTotal: totalMatching,
      inventoryOnlyTotal: 0,
    }),
  };
};

/** Shop-floor pieces only (excludes rows already shown as website listings). */
const searchShopFloorPiecesCatalog = async (opts) => {
  const { search = '', category = '', limit = 100, offset = 0, inStockOnly = false } = opts;
  const q = search.trim();
  const params = [];
  const where = buildShopPiecesWhere({ q, category, inStockOnly, params, excludeWebsiteLinked: true });
  const ctx = await loadSellerCatalogContext();

  const countR = await db.query(
    `SELECT COUNT(*)::int AS total FROM pos_products pp
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     ${where}`,
    params
  );
  const totalMatching = countR.rows[0]?.total ?? 0;
  const pageParams = [...params, limit, offset];
  const r = await db.query(
    `${SHOP_PIECE_SELECT}
     ${where}
     ORDER BY pp.category ASC, pp.sku ASC
     LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams
  );
  const items = r.rows.map((row) => mapShopPieceRow(row, ctx));
  return {
    items,
    meta: catalogMeta(items, {
      ...ctx,
      totalMatching,
      itemsReturned: items.length,
      limit,
      offset,
      websiteLiveTotal: 0,
      inventoryOnlyTotal: totalMatching,
    }),
  };
};

/**
 * Seller POS catalog: live website listings first, then shop-floor PE-CAT pieces.
 * Website products link to legacy POS-* pools or directly published PE-CAT rows.
 */
const searchSellerCatalog = async ({
  search = '',
  category = '',
  limit = 100,
  offset = 0,
  inStockOnly = false,
  catalogFilter = 'all',
} = {}) => {
  if (catalogFilter === 'website') {
    return searchWebsiteLiveCatalog({ search, category, limit, offset, inStockOnly });
  }
  if (catalogFilter === 'inventory') {
    return searchShopFloorPiecesCatalog({ search, category, limit, offset, inStockOnly });
  }

  const q = search.trim();
  const ctx = await loadSellerCatalogContext();

  const webParams = [];
  const webWhere = buildWebsiteLiveWhere({ q, category, inStockOnly, params: webParams });
  const webCountR = await db.query(
    `SELECT COUNT(*)::int AS total FROM products p
     INNER JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     LEFT JOIN categories c ON c.id = p.category_id
     ${webWhere}`,
    webParams
  );
  const websiteLiveTotal = webCountR.rows[0]?.total ?? 0;

  const pieceParams = [];
  const pieceWhere = buildShopPiecesWhere({
    q,
    category,
    inStockOnly,
    params: pieceParams,
    excludeWebsiteLinked: true,
  });
  const pieceCountR = await db.query(
    `SELECT COUNT(*)::int AS total FROM pos_products pp
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     ${pieceWhere}`,
    pieceParams
  );
  const inventoryOnlyTotal = pieceCountR.rows[0]?.total ?? 0;
  const totalMatching = websiteLiveTotal + inventoryOnlyTotal;

  let items = [];
  if (offset < websiteLiveTotal) {
    const webLimit = Math.min(limit, websiteLiveTotal - offset);
    const webPageParams = [...webParams, webLimit, offset];
    const webR = await db.query(
      `${WEBSITE_LISTING_SELECT}
       ${webWhere}
       ORDER BY p.name ASC
       LIMIT $${webPageParams.length - 1} OFFSET $${webPageParams.length}`,
      webPageParams
    );
    items = webR.rows.map((row) => mapWebsiteListingRow(row, ctx));
    const pieceLimit = limit - items.length;
    if (pieceLimit > 0) {
      const piecePageParams = [...pieceParams, pieceLimit, 0];
      const pieceR = await db.query(
        `${SHOP_PIECE_SELECT}
         ${pieceWhere}
         ORDER BY pp.category ASC, pp.sku ASC
         LIMIT $${piecePageParams.length - 1} OFFSET $${piecePageParams.length}`,
        piecePageParams
      );
      items.push(...pieceR.rows.map((row) => mapShopPieceRow(row, ctx)));
    }
  } else {
    const pieceOffset = offset - websiteLiveTotal;
    const piecePageParams = [...pieceParams, limit, pieceOffset];
    const pieceR = await db.query(
      `${SHOP_PIECE_SELECT}
       ${pieceWhere}
       ORDER BY pp.category ASC, pp.sku ASC
       LIMIT $${piecePageParams.length - 1} OFFSET $${piecePageParams.length}`,
      piecePageParams
    );
    items = pieceR.rows.map((row) => mapShopPieceRow(row, ctx));
  }

  await attachVariants(items);
  return {
    items,
    meta: catalogMeta(items, {
      ...ctx,
      totalMatching,
      itemsReturned: items.length,
      limit,
      offset,
      websiteLiveTotal,
      inventoryOnlyTotal,
    }),
  };
};

/** @deprecated Use searchSellerCatalog */
const searchShopFloorCatalog = searchSellerCatalog;

const rankSearchMatch = (item, q) => {
  if (!q) return 50;
  const qu = q.toUpperCase();
  const sku = String(item.sku || '').toUpperCase();
  const name = String(item.name || '').toUpperCase();
  if (sku === qu) return 0;
  if (sku.startsWith(qu)) return 1;
  if (name.startsWith(qu)) return 2;
  if (name.includes(qu)) return 3;
  if (sku.includes(qu)) return 4;
  return 5;
};

const getCategorySummary = async () => {
  const r = await db.query(`
    SELECT p.category AS name,
           COUNT(*)::int AS product_count,
           COUNT(*) FILTER (WHERE p.sku NOT LIKE '%-W-%')::int AS shop_piece_count,
           COUNT(*) FILTER (WHERE p.sku LIKE '%-W-%')::int AS warehouse_piece_count,
           COALESCE(SUM(s.current_qty), 0)::int AS shop_qty,
           COALESCE(SUM(st.current_qty), 0)::int AS store_qty,
           COUNT(*) FILTER (WHERE ec.id IS NOT NULL AND ec.is_active = true)::int AS live_on_website,
           COUNT(*) FILTER (WHERE ec.id IS NULL OR ec.is_active = false)::int AS inventory_only
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    LEFT JOIN products ec ON ec.id = p.ecommerce_product_id
    WHERE p.sku NOT LIKE 'POS-%' AND p.ecommerce_product_id IS NOT NULL
    GROUP BY p.category
    ORDER BY p.category ASC
  `);
  return r.rows;
};

const searchPosCatalog = async (searchOrOpts = '', limitArg = 500) => {
  const opts =
    typeof searchOrOpts === 'string'
      ? { search: searchOrOpts, limit: limitArg }
      : searchOrOpts || {};
  const {
    search = '',
    limit = 100,
    offset = 0,
    category = '',
    inStockOnly = false,
    shopFloorOnly = false,
    catalogFilter = 'all',
  } = opts;

  if (shopFloorOnly) {
    return searchSellerCatalog({ search, category, limit, offset, inStockOnly, catalogFilter });
  }

  const q = search.trim();
  const catalog = [];
  const posIdsUsedByWeb = new Set();
  const webIdsAdded = new Set();

  const webParams = [];
  let webWhere = '(p.is_active = true OR p.pos_stock_product_id IS NOT NULL)';
  let paramIdx = 1;
  if (shopFloorOnly) {
    webWhere += ` AND pp.id IS NOT NULL AND pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'`;
  }
  if (q) {
    webParams.push(`%${q}%`, q.toUpperCase());
    webWhere += ` AND (
      p.name ILIKE $${paramIdx}
      OR p.sku ILIKE $${paramIdx}
      OR UPPER(p.sku) = $${paramIdx + 1}
      OR c.name ILIKE $${paramIdx}
      OR pp.name ILIKE $${paramIdx}
      OR pp.sku ILIKE $${paramIdx}
    )`;
    paramIdx += 2;
  }
  if (category) {
    webParams.push(category);
    webWhere += ` AND (c.name = $${paramIdx} OR pp.category = $${paramIdx})`;
    paramIdx += 1;
  }

  const webR = await db.query(
    `SELECT
       p.id AS ecommerce_product_id,
       p.name,
       p.slug,
       p.sku,
       p.thumbnail,
       p.is_active,
       p.price AS website_list_price,
       COALESCE(NULLIF(p.discount_price, 0), p.price) AS website_sell_price,
       p.pos_stock_product_id,
       p.pos_sell_price,
       pp.id AS pos_id,
       pp.name AS pos_name,
       pp.sku AS pos_sku,
       pp.category AS stock_category,
       pp.shop_price,
       COALESCE(sl.current_qty, 0) AS stock_qty,
       c.name AS category_name
     FROM products p
     LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${webWhere}
     ORDER BY p.name ASC`,
    webParams
  );

  for (const row of webR.rows) {
    const productId = row.pos_id || null;
    const stock = productId ? Number(row.stock_qty ?? 0) : 0;
    if (productId) posIdsUsedByWeb.add(productId);

    const meta = channelMeta(Boolean(productId), true, Boolean(row.is_active));
    const productPosPrice = parseFloat(
      row.pos_sell_price != null ? row.pos_sell_price : row.website_sell_price
    );
    const shopPrice = productPosPrice;

    catalog.push({
      id: row.ecommerce_product_id,
      ecommerceProductId: row.ecommerce_product_id,
      productId,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      thumbnail: row.thumbnail,
      shop_price: shopPrice,
      website_price: parseFloat(row.website_sell_price),
      list_price: parseFloat(row.website_list_price),
      ...meta,
      stockCategory: row.stock_category || row.pos_name || null,
      categoryName: row.category_name || row.stock_category,
      isCategoryFallback: false,
      stock_level: productId ? { current_qty: stock } : null,
      currentQty: stock,
      isOut: !productId || stock === 0,
      variants: [],
    });
    webIdsAdded.add(row.ecommerce_product_id);
  }

  const invParams = [];
  let invWhere = shopFloorOnly
    ? `pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'`
    : `pp.sku LIKE 'PE-CAT-%'`;
  let invIdx = 1;
  if (q) {
    invParams.push(`%${q}%`, q.toUpperCase());
    invWhere = `${shopFloorOnly ? `pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'` : `pp.sku LIKE 'PE-CAT-%'`} AND (
      pp.name ILIKE $${invIdx}
      OR pp.sku ILIKE $${invIdx}
      OR UPPER(pp.sku) = $${invIdx + 1}
      OR pp.category ILIKE $${invIdx}
    )`;
    invIdx += 2;
  }
  if (category) {
    invParams.push(category);
    invWhere += ` AND pp.category = $${invIdx}`;
    invIdx += 1;
  }

  const invR = await db.query(
    `SELECT
       pp.id AS product_id,
       pp.name,
       pp.sku,
       pp.category AS stock_category,
       pp.shop_price,
       pp.online_price,
       pp.ecommerce_product_id,
       COALESCE(sl.current_qty, 0) AS stock_qty
     FROM pos_products pp
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     WHERE ${invWhere}
     ORDER BY pp.name ASC`,
    invParams
  );

  for (const row of invR.rows) {
    if (posIdsUsedByWeb.has(row.product_id)) continue;
    if (row.ecommerce_product_id && webIdsAdded.has(row.ecommerce_product_id)) continue;

    const stock = Number(row.stock_qty ?? 0);
    const onWebsite = Boolean(row.ecommerce_product_id);
    const meta = channelMeta(true, onWebsite, false);

    catalog.push({
      id: `pos-${row.product_id}`,
      ecommerceProductId: row.ecommerce_product_id || null,
      productId: row.product_id,
      name: row.name,
      slug: null,
      sku: row.sku,
      thumbnail: null,
      shop_price: parseFloat(row.shop_price),
      website_price: row.online_price != null ? parseFloat(row.online_price) : null,
      list_price: null,
      ...meta,
      stockCategory: row.stock_category,
      categoryName: row.stock_category,
      isCategoryFallback: false,
      stock_level: { current_qty: stock },
      currentQty: stock,
      isOut: stock === 0,
      variants: [],
    });
  }

  const productIds = catalog.map((c) => c.ecommerceProductId).filter(Boolean);
  if (productIds.length) {
    const variantsR = await db.query(
      `SELECT id, product_id, name, value, size, color, price_modifier, stock_quantity
       FROM product_variants
       WHERE product_id = ANY($1::uuid[])
       ORDER BY product_id, size NULLS LAST, color NULLS LAST, name`,
      [productIds]
    );
    const byProduct = {};
    for (const v of variantsR.rows) {
      if (!byProduct[v.product_id]) byProduct[v.product_id] = [];
      byProduct[v.product_id].push({
        ...v,
        price_modifier: parseFloat(v.price_modifier || 0),
      });
    }
    for (const item of catalog) {
      if (item.ecommerceProductId) {
        item.variants = byProduct[item.ecommerceProductId] || [];
      }
    }
  }

  let filtered = catalog;
  if (inStockOnly) {
    filtered = filtered.filter((p) => p.productId && !p.isOut && (p.currentQty ?? 0) > 0);
  }

  filtered.sort((a, b) => {
    const rankDiff = rankSearchMatch(a, q) - rankSearchMatch(b, q);
    if (rankDiff !== 0) return rankDiff;
    const aSell = Boolean(a.productId && !a.isOut);
    const bSell = Boolean(b.productId && !b.isOut);
    if (aSell !== bSell) return aSell ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const items = filtered.slice(0, limit);
  const categoryTotals = shopFloorOnly ? await getShopFloorCategoryTotals() : [];
  return {
    items,
    meta: catalogMeta(filtered, {
      categoryTotals,
      totalMatching: filtered.length,
      itemsReturned: items.length,
      limit,
    }),
  };
};

const searchProducts = async (search = '', limit = 50) => {
  const q = search.trim();
  const sql = q
    ? `SELECT p.id, p.name, p.sku, p.category, p.low_stock_threshold, p.ecommerce_product_id,
              p.shop_price, p.online_price,
              COALESCE(s.current_qty, 0) AS current_qty
       FROM pos_products p
       LEFT JOIN pos_stock_levels s ON s.product_id = p.id
       WHERE p.sku LIKE 'PE-CAT-%' AND (p.name ILIKE $1 OR p.sku ILIKE $1)
       ORDER BY p.name ASC LIMIT $2`
    : `SELECT p.id, p.name, p.sku, p.category, p.low_stock_threshold, p.ecommerce_product_id,
              p.shop_price, p.online_price,
              COALESCE(s.current_qty, 0) AS current_qty
       FROM pos_products p
       LEFT JOIN pos_stock_levels s ON s.product_id = p.id
       WHERE p.sku LIKE 'PE-CAT-%'
       ORDER BY p.name ASC LIMIT $1`;
  const params = q ? [`%${q}%`, limit] : [limit];
  const r = await db.query(sql, params);

  const products = await Promise.all(
    r.rows.map(async (p) => {
      const vars = await db.query(
        `SELECT * FROM pos_product_variants WHERE product_id = $1 ORDER BY size, color`,
        [p.id]
      );
      return { ...mapProduct(p), variants: vars.rows };
    })
  );
  return products;
};

const LEGACY_BUCKET_FILTER = `AND p.sku NOT LIKE 'POS-%'`;
/** Per-piece catalog only — excludes old Excel bucket rows (POS-SHIRTS etc.). */
const CATALOG_PIECE_FILTER = `AND p.sku LIKE 'PE-CAT-%'`;
/** Sales floor — one sellable piece per row, not warehouse backup SKUs. */
const SHOP_FLOOR_SKU_FILTER = `AND pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'`;
const SHOP_FLOOR_POS_FILTER = `AND p.sku LIKE 'PE-CAT-%' AND p.sku NOT LIKE '%-W-%'`;

const getDailySheet = async (dateStr) => {
  const r = await db.query(
    `SELECT
       p.category AS name,
       p.category,
       SUM(COALESCE(snap.opening_qty, lvl.current_qty, 0))::int AS opening_qty,
       SUM(COALESCE(snap.stock_in_qty, 0))::int AS stock_in_qty,
       SUM(COALESCE(snap.stock_out_qty, 0))::int AS stock_out_qty,
       SUM(COALESCE(snap.sales_qty, 0))::int AS sales_qty,
       SUM(COALESCE(snap.closing_qty, lvl.current_qty, 0))::int AS closing_qty,
       SUM(COALESCE(st.current_qty, 0))::int AS store_qty,
       COUNT(*) FILTER (WHERE p.sku NOT LIKE '%-W-%')::int AS shop_piece_count,
       COUNT(*) FILTER (WHERE p.sku LIKE '%-W-%')::int AS warehouse_piece_count,
       COUNT(*)::int AS piece_count
     FROM pos_products p
     LEFT JOIN pos_stock_levels lvl ON lvl.product_id = p.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
     LEFT JOIN pos_daily_stock_snapshots snap
       ON snap.product_id = p.id AND snap.date = $1::date
     WHERE p.category IS NOT NULL AND TRIM(p.category) <> ''
       ${LEGACY_BUCKET_FILTER}
     GROUP BY p.category
     ORDER BY p.category ASC`,
    [dateStr]
  );

  return r.rows.map((row) => ({
    ...row,
    product_id: row.category,
    product: { name: row.name, category: row.category },
  }));
};

/** Lightweight piece list for category expand (no variant enrichment). */
const getCategoryPieces = async ({
  category,
  limit = 50,
  offset = 0,
  availableOnly = false,
  location = 'all',
} = {}) => {
  if (!category) return { items: [], total: 0 };

  const params = [category];
  let where = `WHERE p.category = $1 ${LEGACY_BUCKET_FILTER}`;
  if (availableOnly) {
    where += ' AND COALESCE(s.current_qty, 0) > 0';
  }
  if (location === 'shop') {
    where += ' AND COALESCE(s.current_qty, 0) > 0';
  } else if (location === 'store') {
    where += ' AND COALESCE(st.current_qty, 0) > 0';
  }

  const countR = await db.query(
    `SELECT COUNT(*)::int AS total FROM pos_products p
     LEFT JOIN pos_stock_levels s ON s.product_id = p.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
     ${where}`,
    params
  );

  params.push(limit, offset);
  const r = await db.query(
    `SELECT p.id, p.name, p.sku, p.category, p.shop_price, p.website_details,
            COALESCE(s.current_qty, 0)::int AS current_qty,
            COALESCE(st.current_qty, 0)::int AS store_qty,
            ec.thumbnail AS website_thumbnail,
            ec.id IS NOT NULL AND ec.is_active = true AS on_website
     FROM pos_products p
     LEFT JOIN pos_stock_levels s ON s.product_id = p.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
     LEFT JOIN products ec ON ec.id = p.ecommerce_product_id
     ${where}
     ORDER BY p.sku ASC, p.name ASC
     LIMIT $2 OFFSET $3`,
    params
  );

  return {
    total: countR.rows[0]?.total ?? 0,
    items: r.rows.map((p) => {
      const draft = parseDraft(p.website_details);
      const variants = draft.variants || [];
      const colorGroup = (draft.color_groups || [])[0];
      const firstVariant = variants[0];
      const firstSize = colorGroup?.sizes?.[0];
      const color = firstVariant?.color || colorGroup?.color || '';
      const size = firstVariant?.size || firstSize?.size || '';
      const shopQty = p.current_qty;
      const storeQty = p.store_qty;
      let pieceLocation = 'none';
      if (shopQty > 0 && storeQty > 0) pieceLocation = 'both';
      else if (shopQty > 0) pieceLocation = 'shop';
      else if (storeQty > 0) pieceLocation = 'store';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        shop_price: parseFloat(p.shop_price),
        currentQty: shopQty,
        storeQty,
        location: draft.location || pieceLocation,
        color,
        size,
        description: draft.description || '',
        unit_number: draft.unit_number ?? null,
        website_thumbnail: p.website_thumbnail || draft.thumbnail || null,
        on_website: Boolean(p.on_website),
      };
    }),
  };
};

const getMovements = async ({ productId, type, from, to, limit = 30, skip = 0 }) => {
  const clauses = ['1=1'];
  const params = [];
  let i = 1;
  if (productId) { clauses.push(`m.product_id = $${i++}`); params.push(productId); }
  if (type) { clauses.push(`m.movement_type = $${i++}::"PosMovementType"`); params.push(type); }
  if (from) { clauses.push(`m.created_at >= $${i++}`); params.push(from); }
  if (to) { clauses.push(`m.created_at <= $${i++}`); params.push(to); }
  params.push(limit, skip);

  const r = await db.query(
    `SELECT m.*, p.name AS product_name, p.sku AS product_sku,
            pr.full_name AS recorder_name
     FROM pos_stock_movements m
     JOIN pos_products p ON p.id = m.product_id
     LEFT JOIN pos_profiles pr ON pr.id = m.recorded_by
     WHERE ${clauses.join(' AND ')}
     ORDER BY m.created_at DESC
     LIMIT $${i++} OFFSET $${i}`,
    params
  );
  return r.rows.map((m) => ({
    ...m,
    product: { name: m.product_name, sku: m.product_sku },
    recorder: m.recorder_name ? { full_name: m.recorder_name } : null,
  }));
};

const findProfileByEmail = async (email) => {
  const r = await db.query(`SELECT * FROM pos_profiles WHERE email = $1 LIMIT 1`, [email]);
  return r.rows[0] || null;
};

const findProfileById = async (id) => {
  const r = await db.query(
    `SELECT id, full_name, email, role, is_active FROM pos_profiles WHERE id = $1 LIMIT 1`,
    [id]
  );
  return r.rows[0] || null;
};

const getOpenShift = async (sellerId) => {
  const r = await db.query(
    `SELECT * FROM pos_shifts WHERE seller_id = $1 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1`,
    [sellerId]
  );
  return r.rows[0] || null;
};

const createShift = async (sellerId) => {
  const r = await db.query(
    `INSERT INTO pos_shifts (seller_id) VALUES ($1) RETURNING *`,
    [sellerId]
  );
  return r.rows[0];
};

const finalizeShiftClose = async (shift, sellerId) => {

  const salesR = await db.query(
    `SELECT * FROM pos_sales WHERE shift_id = $1 AND is_voided = false`,
    [shift.id]
  );

  let totalCash = 0;
  let totalMpesa = 0;
  let totalCard = 0;
  let totalSales = 0;
  for (const sale of salesR.rows) {
    const amt = parseFloat(sale.total_amount);
    totalSales += amt;
    if (sale.payment_method === 'CASH') totalCash += amt;
    if (sale.payment_method === 'MPESA') totalMpesa += amt;
    if (sale.payment_method === 'CARD') totalCard += amt;
  }

  const upd = await db.query(
    `UPDATE pos_shifts SET clock_out = NOW(), total_cash = $1, total_mpesa = $2, total_card = $3, total_sales = $4
     WHERE id = $5 RETURNING *`,
    [totalCash, totalMpesa, totalCard, totalSales, shift.id]
  );

  const sellerR = await db.query(`SELECT full_name, email FROM pos_profiles WHERE id = $1`, [sellerId]);
  const itemsR = await db.query(
    `SELECT si.*, COALESCE(si.line_name, p.name) AS product_name FROM pos_sale_items si
     JOIN pos_products p ON p.id = si.product_id
     JOIN pos_sales s ON s.id = si.sale_id
     WHERE s.shift_id = $1`,
    [shift.id]
  );

  return {
    ...upd.rows[0],
    seller: sellerR.rows[0] ? { full_name: sellerR.rows[0].full_name, email: sellerR.rows[0].email } : null,
    sales: salesR.rows.map((s) => ({
      ...s,
      items: itemsR.rows.filter((it) => it.sale_id === s.id).map((it) => ({
        ...it,
        product: { name: it.product_name },
      })),
    })),
  };
};

const closeShift = async (sellerId) => {
  const shift = await getOpenShift(sellerId);
  if (!shift) return null;
  return finalizeShiftClose(shift, sellerId);
};

const forceCloseShiftById = async (shiftId) => {
  const r = await db.query(`SELECT * FROM pos_shifts WHERE id = $1 AND clock_out IS NULL`, [shiftId]);
  if (!r.rows.length) return null;
  const shift = r.rows[0];
  return finalizeShiftClose(shift, shift.seller_id);
};

const listShifts = async ({ sellerId, from, to, limit, skip }) => {
  const clauses = ['1=1'];
  const params = [];
  let i = 1;
  if (sellerId) { clauses.push(`s.seller_id = $${i++}`); params.push(sellerId); }
  if (from) { clauses.push(`s.clock_in >= $${i++}`); params.push(from); }
  if (to) { clauses.push(`s.clock_in <= $${i++}`); params.push(to); }

  const countR = await db.query(
    `SELECT COUNT(*)::int AS total FROM pos_shifts s WHERE ${clauses.join(' AND ')}`,
    params
  );
  params.push(limit, skip);
  const r = await db.query(
    `SELECT s.*, pr.full_name AS seller_full_name, pr.email AS seller_email
     FROM pos_shifts s
     JOIN pos_profiles pr ON pr.id = s.seller_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY s.clock_in DESC
     LIMIT $${i++} OFFSET $${i}`,
    params
  );
  return {
    shifts: r.rows.map((s) => ({
      ...s,
      seller: { full_name: s.seller_full_name, email: s.seller_email },
    })),
    total: countR.rows[0].total,
  };
};

const getShiftById = async (id) => {
  const r = await db.query(
    `SELECT s.*, pr.full_name AS seller_full_name
     FROM pos_shifts s
     JOIN pos_profiles pr ON pr.id = s.seller_id
     WHERE s.id = $1`,
    [id]
  );
  if (!r.rows.length) return null;
  const shift = r.rows[0];
  const salesR = await db.query(`SELECT * FROM pos_sales WHERE shift_id = $1 ORDER BY created_at`, [id]);
  const sales = await Promise.all(
    salesR.rows.map(async (sale) => {
      const itemsR = await db.query(
        `SELECT si.*, COALESCE(si.line_name, p.name) AS product_name FROM pos_sale_items si
         JOIN pos_products p ON p.id = si.product_id WHERE si.sale_id = $1`,
        [sale.id]
      );
      return {
        ...sale,
        items: itemsR.rows.map((it) => ({ ...it, product: { name: it.product_name } })),
      };
    })
  );
  return { ...shift, seller: { full_name: shift.seller_full_name }, sales };
};

const listAuditLogs = async ({ from, to, performedBy, limit, skip }) => {
  const clauses = ['1=1'];
  const params = [];
  let i = 1;
  if (from) { clauses.push(`a.created_at >= $${i++}`); params.push(from); }
  if (to) { clauses.push(`a.created_at <= $${i++}`); params.push(to); }
  if (performedBy) { clauses.push(`a.performed_by = $${i++}`); params.push(performedBy); }

  const countR = await db.query(
    `SELECT COUNT(*)::int AS total FROM pos_audit_logs a WHERE ${clauses.join(' AND ')}`,
    params
  );
  params.push(limit, skip);
  const r = await db.query(
    `SELECT a.*, pr.full_name AS performer_name
     FROM pos_audit_logs a
     LEFT JOIN pos_profiles pr ON pr.id = a.performed_by
     WHERE ${clauses.join(' AND ')}
     ORDER BY a.created_at DESC
     LIMIT $${i++} OFFSET $${i}`,
    params
  );
  return {
    logs: r.rows.map((l) => ({
      ...l,
      performer: l.performer_name ? { full_name: l.performer_name } : null,
    })),
    total: countR.rows[0].total,
  };
};

const listSellers = async () => {
  const r = await db.query(
    `SELECT p.*, COUNT(s.id)::int AS total_sales
     FROM pos_profiles p
     LEFT JOIN pos_sales s ON s.seller_id = p.id AND s.is_voided = false
     WHERE p.role = 'SELLER'
     GROUP BY p.id
     ORDER BY p.full_name ASC`
  );
  return r.rows.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    email: s.email,
    is_active: s.is_active,
    totalSales: s.total_sales,
    created_at: s.created_at,
  }));
};

module.exports = {
  getLowStockSummary,
  getStockLevels,
  getCategorySummary,
  getCategoryPieces,
  getShopFloorCategoryTotals,
  getCategoryWebsitePools,
  searchShopFloorCatalog,
  searchSellerCatalog,
  searchProducts,
  searchPosCatalog,
  getDailySheet,
  getMovements,
  findProfileByEmail,
  findProfileById,
  getOpenShift,
  createShift,
  closeShift,
  forceCloseShiftById,
  listShifts,
  getShiftById,
  listAuditLogs,
  listSellers,
  SHOP_FLOOR_POS_FILTER,
};
