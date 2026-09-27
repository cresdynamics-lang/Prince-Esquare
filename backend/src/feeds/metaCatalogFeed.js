const db = require('../config/db');
const { META_SQUARE_TRANSFORMS, toMetaSquareImageUrl } = require('../utils/cloudinaryImage');

const SITE_URL = 'https://prince-esquire.co.ke';
const SALE_PAGE_URL = `${SITE_URL}/sale`;
const CLOUDINARY_CLOUD = 'dj8uacwqp';
/** Known-good Cloudinary fallback (not site LOGO — Meta bots get HTML for /LOGO.jpeg via prerender). */
const META_FALLBACK_IMAGE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${META_SQUARE_TRANSFORMS}/v1781566917/PRINCE-eSQUIIRE/ky5amnzffh0gwsgyg2ps.jpg`;

/** Same catalog as /sale — admin-managed is_on_sale flag (no stock_quantity gate). */
const SALE_WHERE = `p.is_on_sale = true`;

/** Meta Shop treats quantity 0 as sold out even when availability says in stock. */
const META_SELLABLE_QTY = 999;

/**
 * Cloudinary transforms for Meta/IG:
 * - 1200×1200 JPEG (IG catalog requirement)
 * - c_pad + white canvas so portrait shots are not cropped
 * - URL string change forces Meta to re-crawl cached creatives
 */

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

function encodeUrlPath(urlString) {
  try {
    const u = new URL(urlString);
    u.pathname = u.pathname
      .split('/')
      .map((seg) => {
        if (!seg) return seg;
        try {
          return encodeURIComponent(decodeURIComponent(seg));
        } catch {
          return encodeURIComponent(seg);
        }
      })
      .join('/');
    return u.toString();
  } catch {
    return String(urlString || '').replace(/ /g, '%20');
  }
}

function absoluteUrl(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${SITE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function firstImageFromJson(images) {
  if (!images) return '';
  let list = images;
  if (typeof images === 'string') {
    try {
      list = JSON.parse(images);
    } catch {
      return '';
    }
  }
  if (!Array.isArray(list) || !list.length) return '';
  const first = list[0];
  if (typeof first === 'string') return first;
  return first?.url || first?.secure_url || first?.src || '';
}

/** Build a Meta-safe https image URL Meta can download as image/jpeg. */
function metaImageUrl(value, imagesField) {
  const candidates = [value, firstImageFromJson(imagesField)].filter(Boolean);
  let url = '';
  for (const candidate of candidates) {
    const abs = absoluteUrl(candidate);
    if (!abs) continue;
    // Never send site LOGO to Meta — bot prerender used to return HTML for it.
    if (/\/LOGO\.jpe?g(\?|$)/i.test(abs)) continue;
    url = abs;
    break;
  }

  if (!url) return META_FALLBACK_IMAGE;

  url = url.replace(/^http:\/\//i, 'https://');
  url = encodeUrlPath(url);

  // Cloudinary: pad to a white 1200×1200 square so Meta/IG cannot crop the garment.
  const squared = toMetaSquareImageUrl(url);
  if (squared && squared !== url) return squared;

  // Self-hosted images: keep encoded https URL (nginx must serve real image bytes to bots).
  return url;
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
    // Always deep-link the product page so IG/FB can resolve the correct item + OG image.
    link: `${SITE_URL}/product/${product.slug}`,
    image_link: metaImageUrl(product.thumbnail, product.images),
    brand: cleanField(product.brand_name || 'Prince Esquire', 100),
    product_type: cleanField(productType, 750),
    google_product_category: googleCategoryFor(product),
    custom_label_0: linkToSale || product.is_on_sale ? 'Sale' : 'Catalog',
    status: 'active',
    quantity_to_sell_on_facebook: META_SELLABLE_QTY,
    inventory: META_SELLABLE_QTY,
  };
}

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.price, p.description, p.thumbnail, p.images,
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
  metaImageUrl,
};
