const db = require('../config/db');

const SITE_URL = 'https://prince-esquire.co.ke';
const SALE_PAGE_URL = `${SITE_URL}/sale`;

/** Same catalog as /sale — admin-managed is_on_sale flag (no stock_quantity gate). */
const SALE_WHERE = `p.is_on_sale = true`;

/** Meta Shop treats quantity 0 as sold out even when availability says in stock. */
const META_SELLABLE_QTY = 999;

const COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'product_type',
  'google_product_category',
  'custom_label_0',
  'status',
  'quantity_to_sell_on_facebook',
  'inventory',
];

function cleanField(value, maxLen = 5000) {
  return String(value ?? '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function absoluteUrl(value) {
  if (!value) return `${SITE_URL}/LOGO.jpeg`;
  if (String(value).startsWith('http')) return String(value);
  return `${SITE_URL}${String(value).startsWith('/') ? '' : '/'}${value}`;
}

/** Stable https image URL Meta can crawl; prefer Cloudinary CDN. */
function metaImageUrl(value) {
  const url = absoluteUrl(value);
  // Force https for crawlers that reject mixed content.
  return url.replace(/^http:\/\//i, 'https://');
}

function formatMetaPrice(price) {
  const amount = Number.parseFloat(price || 0);
  return `${amount.toFixed(2)} KES`;
}

function googleCategoryFor(product) {
  const label = `${product.parent_category_name || ''} ${product.category_name || ''}`.toLowerCase();
  if (label.includes('shoe') || label.includes('boot') || label.includes('loafer') || label.includes('sandal')) {
    return 'Apparel & Accessories > Shoes';
  }
  if (label.includes('belt')) return 'Apparel & Accessories > Clothing Accessories > Belts';
  return 'Apparel & Accessories > Clothing';
}

function mapProductRow(product, { linkToSale = true } = {}) {
  // Always sellable in Meta — never emit out of stock / zero inventory.
  const productType = product.parent_category_name || product.category_name || 'Fashion';
  const description = cleanField(product.description || product.name, 5000);

  return {
    id: product.slug,
    title: cleanField(product.name, 200),
    description: description || cleanField(product.name, 5000),
    availability: 'in stock',
    condition: 'new',
    price: formatMetaPrice(product.price),
    link: linkToSale ? SALE_PAGE_URL : `${SITE_URL}/product/${product.slug}`,
    image_link: metaImageUrl(product.thumbnail),
    brand: cleanField(product.brand_name || 'Prince Esquire', 100),
    product_type: cleanField(productType, 750),
    google_product_category: googleCategoryFor(product),
    custom_label_0: linkToSale ? 'Sale' : 'Catalog',
    status: 'active',
    quantity_to_sell_on_facebook: META_SELLABLE_QTY,
    inventory: META_SELLABLE_QTY,
  };
}

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.price, p.description, p.thumbnail,
         p.stock_quantity, p.is_on_sale,
         b.name AS brand_name, c.name AS category_name, p_cat.name AS parent_category_name,
         (
           SELECT COUNT(*)::int FROM product_variants pv
           WHERE pv.product_id = p.id AND COALESCE(NULLIF(TRIM(pv.size), ''), NULL) IS NOT NULL
         ) AS size_count
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
  LEFT JOIN brands b ON p.brand_id = b.id
`;

async function fetchSaleProducts() {
  const result = await db.query(
    `${PRODUCT_SELECT}
     WHERE p.is_active = true AND ${SALE_WHERE}
     ORDER BY p.updated_at DESC NULLS LAST, p.is_featured DESC, p.name ASC`
  );
  return result.rows;
}

async function fetchAllProducts() {
  const result = await db.query(
    `${PRODUCT_SELECT}
     WHERE p.is_active = true
     ORDER BY p.updated_at DESC NULLS LAST, p.is_featured DESC, p.name ASC`
  );
  return result.rows.map((row) => mapProductRow(row, { linkToSale: false }));
}

function toDelimited(rows, delimiter) {
  const escape = (value) => {
    const text = cleanField(value, 9999);
    if (delimiter === ',') {
      if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    }
    return text;
  };

  const header = COLUMNS.map(escape).join(delimiter);
  const lines = rows.map((row) => COLUMNS.map((col) => escape(row[col])).join(delimiter));
  return [header, ...lines].join('\n');
}

async function buildSaleFeed(delimiter = '\t') {
  const products = await fetchSaleProducts();
  const rows = products.map((p) => mapProductRow(p, { linkToSale: true }));
  return { count: rows.length, body: toDelimited(rows, delimiter) };
}

async function buildFullFeed(delimiter = '\t') {
  const products = await fetchAllProducts();
  return { count: products.length, body: toDelimited(products, delimiter) };
}

module.exports = {
  SITE_URL,
  COLUMNS,
  buildSaleFeed,
  buildFullFeed,
};
