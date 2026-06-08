// NEW — Link ecommerce products to POS stock by name
const db = require('../config/db');

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const ALIASES = {
  shirt: 'shirts',
  shirts: 'shirts',
  khaki: 'khakis',
  khakis: 'khakis',
  polo: 'polos',
  polos: 'polos',
  'knitted polo': 'knitted pollos',
  'knitted pollos': 'knitted pollos',
  loafer: 'loafers',
  loafers: 'loafers',
  jean: 'jeans',
  jeans: 'jeans',
  sweater: 'sweaters',
  sweaters: 'sweaters',
  't shirt': 't-shirts',
  't-shirts': 't-shirts',
  tshirt: 't-shirts',
  'gurkha pant': 'gurkha pants',
  'gurkha pants': 'gurkha pants',
  'track suit': 'track suits',
  'half jacket': 'half-jackets',
  'sweat shirt': 'sweat shirts',
  sock: 'socks',
  hat: 'hats',
  tie: 'ties',
  belt: 'belts',
  vest: 'vests',
  cape: 'capes',
  blazer: 'blazers',
  suit: 'suits',
  jacket: 'jackets',
};

const resolvePosName = (name) => {
  const n = normalize(name);
  if (ALIASES[n]) return ALIASES[n];
  for (const [key, val] of Object.entries(ALIASES)) {
    if (n.includes(key)) return val;
  }
  return n;
};

/** POS stock category → ecommerce category slugs */
const POS_TO_CATEGORY_SLUGS = {
  belts: ['belts-ties'],
  ties: ['belts-ties'],
  'office shoes': ['formal-shoes', 'shoes'],
  'casual shoes': ['casual', 'shoes'],
  blazers: ['blazers'],
  jeans: ['jeans'],
  sweaters: ['sweaters'],
  'linen trousers': ['linen-trousers', 'trousers', 'linen'],
  'gurkha pants': ['gurkha'],
  'knitted pollos': ['knitted-polos'],
  hats: ['caps-hats'],
  'half-jackets': ['half-jackets'],
  jackets: ['jackets'],
  'track suits': ['track-suits'],
  't-shirts': ['t-shirts', 'round-neck-t-shirts', 'v-neck-t-shirts'],
  'sweat shirts': ['sweat-shirts'],
  polos: ['polos', 'polo-t-shirts'],
  shirts: ['shirts', 'formal-shirts', 'linen-shirts'],
  suits: ['suits', 'two-piece', 'three-piece'],
  vests: ['suits', 'blazers'],
  loafers: ['loafers', 'shoes'],
  socks: ['casual'],
  capes: ['jackets'],
};

const POS_NAME_KEYWORDS = {
  belts: ['belt'],
  ties: ['tie'],
  blazers: ['blazer'],
  jeans: ['jean'],
  sweaters: ['sweater'],
  hats: ['hat', 'cap'],
  socks: ['sock'],
  capes: ['cape'],
  'knitted pollos': ['knitted polo', 'knit polo'],
  'gurkha pants': ['gurkha'],
  'linen trousers': ['linen trouser', 'linen pant'],
  'casual shoes': ['casual', 'sneaker'],
  'office shoes': ['oxford', 'monk', 'brogue', 'cap toe', 'wingtip', 'derby', 'formal shoe'],
  loafers: ['loafer', 'slip on', 'slip-on', 'penny', 'bit loafer'],
  khakis: ['khaki', 'chino', 'dockers', 'tapered fit pant', 'trouser pant'],
  vests: ['vest', 'puffer'],
  'track suits': ['tracksuit', 'track suit'],
};

/** Ecommerce category slug → POS stock bucket name */
const CATEGORY_SLUG_TO_POS = {
  'formal-shoes': 'office shoes',
  khaki: 'khakis',
  loafers: 'loafers',
  casual: 'casual shoes',
  jeans: 'jeans',
  sweaters: 'sweaters',
  shirts: 'shirts',
  polos: 'polos',
  'polo-t-shirts': 'polos',
  'knitted-polos': 'knitted pollos',
  blazers: 'blazers',
  suits: 'suits',
  jackets: 'jackets',
  'half-jackets': 'half-jackets',
  'track-suits': 'track suits',
  'linen-trousers': 'linen trousers',
  gurkha: 'gurkha pants',
  'belts-ties': 'belts',
  'caps-hats': 'hats',
  't-shirts': 't-shirts',
  'sweat-shirts': 'sweat shirts',
};

/** Ordered so specific shoe/pant rules win over generic words like "cap" in "cap-toe". */
const INFER_POS_RULES = [
  { pos: 'office shoes', keywords: ['oxford', 'monk strap', 'monk-strap', 'brogue', 'cap toe', 'cap-toe', 'wingtip', 'derby'] },
  { pos: 'loafers', keywords: ['loafer', 'slip on', 'slip-on', 'penny', 'bit loafer'] },
  { pos: 'khakis', keywords: ['khaki', 'chino', 'dockers', 'tapered fit pant'] },
  { pos: 'linen trousers', keywords: ['linen trouser', 'linen pant'] },
  { pos: 'vests', keywords: ['puffer vest', ' vest'] },
  { pos: 'track suits', keywords: ['tracksuit', 'track suit'] },
  { pos: 'gurkha pants', keywords: ['gurkha'] },
  { pos: 'knitted pollos', keywords: ['knitted polo', 'knit polo'] },
  { pos: 'jeans', keywords: ['jean'] },
  { pos: 'sweaters', keywords: ['sweater'] },
  { pos: 'blazers', keywords: ['blazer'] },
  { pos: 'belts', keywords: [' belt'] },
  { pos: 'ties', keywords: [' tie'] },
  { pos: 'socks', keywords: ['sock'] },
  { pos: 'capes', keywords: ['cape'] },
  { pos: 'hats', keywords: [' hat', ' baseball cap', 'fitted cap'] },
  { pos: 'casual shoes', keywords: ['sneaker', 'casual shoe'] },
];

const inferPosBucketName = (productName, categorySlug) => {
  const n = normalize(productName);
  for (const rule of INFER_POS_RULES) {
    if (rule.keywords.some((kw) => n.includes(normalize(kw)))) return rule.pos;
  }
  if (categorySlug && CATEGORY_SLUG_TO_POS[categorySlug]) {
    return CATEGORY_SLUG_TO_POS[categorySlug];
  }
  return null;
};

const findPosByBucketName = (posProducts, bucketName) => {
  if (!bucketName) return null;
  const target = normalize(bucketName);
  return posProducts.find((p) => normalize(p.name) === target) || null;
};

const scoreMatch = (ecommerceName, posName) => {
  const e = normalize(ecommerceName);
  const p = normalize(posName);
  const resolved = resolvePosName(ecommerceName);
  if (e === p || resolved === p) return 100;
  if (e.includes(p) || p.includes(e)) return 80;
  if (resolved.includes(p) || p.includes(resolved)) return 70;
  return 0;
};

const getPosProducts = async () => {
  const r = await db.query(`SELECT id, name, sku FROM pos_products ORDER BY name`);
  return r.rows;
};

const findPosProductForEcommerce = async (productId, productName, categorySlug = null) => {
  if (productId) {
    const linked = await db.query(
      `SELECT pp.*, s.current_qty
       FROM products p
       JOIN pos_products pp ON pp.id = p.pos_stock_product_id
       LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
       WHERE p.id = $1`,
      [productId]
    );
    if (linked.rows.length) return linked.rows[0];
  }

  if (!categorySlug && productId) {
    const catR = await db.query(
      `SELECT c.slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = $1`,
      [productId]
    );
    categorySlug = catR.rows[0]?.slug || null;
  }

  const posProducts = await getPosProducts();
  const inferred = findPosByBucketName(posProducts, inferPosBucketName(productName, categorySlug));
  if (inferred) {
    const stock = await db.query(
      `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
      [inferred.id]
    );
    return { ...inferred, current_qty: stock.rows[0]?.current_qty ?? 0 };
  }

  let best = null;
  let bestScore = 0;
  for (const pos of posProducts) {
    const s = scoreMatch(productName, pos.name);
    if (s > bestScore) {
      bestScore = s;
      best = pos;
    }
  }
  if (!best || bestScore < 50) return null;

  const stock = await db.query(
    `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
    [best.id]
  );
  return { ...best, current_qty: stock.rows[0]?.current_qty ?? 0 };
};

const getEcommercePrice = async (ecommerceId) => {
  const r = await db.query(
    `SELECT COALESCE(NULLIF(discount_price, 0), price) AS sell_price, price AS list_price
     FROM products WHERE id = $1`,
    [ecommerceId]
  );
  return r.rows[0] || null;
};

const avgPrices = (rows) => {
  if (!rows.length) return null;
  const sell =
    rows.reduce((s, r) => s + parseFloat(r.sell_price ?? r.price), 0) / rows.length;
  const list = rows.reduce((s, r) => s + parseFloat(r.list_price ?? r.price), 0) / rows.length;
  return {
    sell_price: Math.round(sell * 100) / 100,
    list_price: Math.round(list * 100) / 100,
  };
};

const resolvePriceForPosName = async (posName) => {
  const linked = await db.query(
    `SELECT COALESCE(NULLIF(p.discount_price, 0), p.price) AS sell_price, p.price AS list_price
     FROM products p
     JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     WHERE pp.name = $1 AND p.is_active = true`,
    [posName]
  );
  if (linked.rows.length) return avgPrices(linked.rows);

  const products = await db.query(
    `SELECT p.name, p.price, p.discount_price,
            COALESCE(NULLIF(p.discount_price, 0), p.price) AS sell_price,
            p.price AS list_price,
            c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = true`
  );

  const posKey = normalize(posName);
  const slugHints = POS_TO_CATEGORY_SLUGS[posKey] || [];

  const matched = products.rows.filter((p) => {
    const s = scoreMatch(p.name, posName);
    if (s >= 60) return true;
    if (p.category_name && scoreMatch(p.category_name, posName) >= 60) return true;
    if (p.category_slug && scoreMatch(p.category_slug.replace(/-/g, ' '), posName) >= 60) return true;
    if (p.category_slug && slugHints.includes(p.category_slug)) return true;
    const keywords = POS_NAME_KEYWORDS[posKey];
    if (keywords?.some((kw) => normalize(p.name).includes(normalize(kw)))) return true;
    return false;
  });
  return avgPrices(matched);
};

/** Sync bucket online_price only — POS sell prices stay per product, not category averages. */
const syncPosPricesFromEcommerce = async () => {
  const linked = await db.query(
    `UPDATE pos_products pp
     SET online_price = sub.list_price
     FROM (
       SELECT pos_stock_product_id AS pos_id,
              ROUND(AVG(price)::numeric, 2) AS list_price
       FROM products
       WHERE pos_stock_product_id IS NOT NULL AND is_active = true
       GROUP BY pos_stock_product_id
     ) sub
     WHERE pp.id = sub.pos_id
     RETURNING pp.id, pp.name, pp.online_price`
  );

  return {
    linkedUpdated: linked.rowCount,
    nameMatchedUpdated: 0,
    updated: linked.rowCount,
    products: linked.rows,
  };
};

const linkProductPair = async (ecommerceId, posId, { syncPrices = false } = {}) => {
  await db.query(
    `UPDATE products SET pos_stock_product_id = $1 WHERE id = $2`,
    [posId, ecommerceId]
  );
  await db.query(
    `UPDATE pos_products SET ecommerce_product_id = $1 WHERE id = $2`,
    [ecommerceId, posId]
  );
  if (syncPrices) await syncPosPricesFromEcommerce();
};

const reconcileAllProductLinks = async () => {
  const posProducts = await getPosProducts();
  const products = await db.query(`
    SELECT p.id, p.name, c.slug AS category_slug, pp.name AS current_bucket
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
    WHERE p.is_active = true`);

  let fixed = 0;
  for (const product of products.rows) {
    const expected = inferPosBucketName(product.name, product.category_slug);
    if (!expected) continue;
    const pos = findPosByBucketName(posProducts, expected);
    if (!pos || product.current_bucket === pos.name) continue;
    await linkProductPair(product.id, pos.id);
    fixed += 1;
  }
  return fixed;
};

const autoLinkAllProducts = async () => {
  const products = await db.query(
    `SELECT p.id, p.name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = true AND p.pos_stock_product_id IS NULL`
  );
  const posProducts = await getPosProducts();
  let linked = 0;

  for (const product of products.rows) {
    let best =
      findPosByBucketName(posProducts, inferPosBucketName(product.name, product.category_slug)) ||
      null;
    let bestScore = best ? 90 : 0;

    if (!best) {
      for (const pos of posProducts) {
        const s = scoreMatch(product.name, pos.name);
        if (s > bestScore) {
          bestScore = s;
          best = pos;
        }
      }
    }

    if (best && bestScore >= 50) {
      await linkProductPair(product.id, best.id);
      linked += 1;
    }
  }
  const reconciled = await reconcileAllProductLinks();
  const priceSync = await syncPosPricesFromEcommerce();
  return {
    linked,
    reconciled,
    scanned: products.rows.length,
    pricesUpdated: priceSync.updated,
    priceDetails: priceSync,
  };
};

const getPosStockForProductIds = async (ids) => {
  if (!ids?.length) return {};
  const r = await db.query(
    `SELECT p.id AS ecommerce_id, pp.id AS pos_id, pp.name AS pos_name,
            COALESCE(s.current_qty, 0) AS pos_qty
     FROM products p
     LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     LEFT JOIN pos_stock_levels s ON s.product_id = pp.id
     WHERE p.id = ANY($1::uuid[])`,
    [ids]
  );
  const map = {};
  for (const row of r.rows) {
    map[row.ecommerce_id] = {
      posProductId: row.pos_id,
      posProductName: row.pos_name,
      qty: parseInt(row.pos_qty, 10),
      inStock: parseInt(row.pos_qty, 10) > 0,
    };
  }
  return map;
};

const getLinkedEcommerceIdsForPos = async (posProductId) => {
  const r = await db.query(
    `SELECT id, name FROM products WHERE pos_stock_product_id = $1`,
    [posProductId]
  );
  return r.rows;
};

module.exports = {
  normalize,
  findPosProductForEcommerce,
  autoLinkAllProducts,
  linkProductPair,
  syncPosPricesFromEcommerce,
  resolvePriceForPosName,
  getEcommercePrice,
  getPosStockForProductIds,
  getLinkedEcommerceIdsForPos,
  scoreMatch,
  inferPosBucketName,
  findPosByBucketName,
  reconcileAllProductLinks,
};
