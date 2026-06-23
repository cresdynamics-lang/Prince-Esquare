/**
 * Build one POS inventory row per physical unit from stock-sheet totals.
 * 590 shirts → 590 separate rows (qty 1 each). Names/prices/sizes may repeat.
 * Inventory-only — admin publishes to website manually.
 */
const db = require('../config/db');
const posStockCatalog = require('../db/seeds/posStockCatalog');
const { createPosInventoryItem } = require('./inventoryChannel');
const { setShopQty, setStoreQty } = require('./inventoryMovement');
const { groupVariantsByColor } = require('./inventoryProductDetail');

const SKU_PREFIX = 'PE-CAT';

const slugPart = (s) =>
  String(s || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 12);

const SHIRT_STYLES = [
  'Formal Oxford', 'Spread Collar', 'Slim Poplin', 'Presidential Fit', 'Classic Cotton',
  'Non-Iron Dress', 'Textured Weave', 'French Cuff', 'Button-Down', 'Executive Cut',
  'Tailored Fit', 'Business Stripe', 'Micro Check', 'Herringbone', 'Broadcloth',
];
const SHIRT_COLORS = ['White', 'Sky Blue', 'Navy', 'Light Blue', 'Charcoal', 'Black', 'Pink', 'Lavender'];
const APPAREL_SIZES = ['M', 'L', 'XL', 'XXL', '3XL'];
const SHOE_SIZES = ['40', '41', '42', '43', '44', '45'];
const BELT_NAMES = [
  'Classic Calfskin Belt — Black/Gold Buckle',
  'Reversible Leather Belt — Black/Brown',
];
const BELT_SIZES = ['32', '34', '36', '38', '40'];
const KHAKI_NAMES = ['Classic Khaki Chino', 'Slim Taper Khaki', 'Stretch Comfort Khaki', 'Flat Front Khaki', 'Pleated Khaki'];
const POLO_NAMES = ['Pique Polo', 'Knitted Polo', 'Classic Polo', 'Premium Cotton Polo', 'Contrast Collar Polo'];
const SUIT_NAMES = ['Two-Piece Business Suit', 'Three-Piece Formal Suit', 'Slim Fit Suit', 'Classic Wool Suit'];
const GENERIC_ADJECTIVES = ['Classic', 'Premium', 'Executive', 'Heritage', 'Modern', 'Essential'];

const buildDescription = (name, category, unitNum, size, color, { warehouse = false } = {}) =>
  warehouse
    ? `Warehouse piece #${unitNum} - ${name}. ${color} · size ${size}. ` +
      `In back-store (not on shop floor). Use Store -> Shop in Stock Summary to move to the sales floor.`
    : `Piece #${unitNum} - ${name}. ${color} · size ${size}. ` +
      `On shop floor (${category}). Use Shop -> Store to send back to warehouse. ` +
      `Available at POS when in shop. Not on the website until admin publishes.`;

/** Pick display name / variant for unit index (names intentionally repeat across units). */
const pickUnitSpec = (categoryName, index) => {
  const cat = categoryName.toLowerCase();

  if (cat.includes('belt')) {
    const name = BELT_NAMES[index % BELT_NAMES.length];
    const size = BELT_SIZES[index % BELT_SIZES.length];
    const color = name.includes('Brown') ? 'Brown' : name.includes('Tan') ? 'Tan' : 'Black';
    return {
      name: `${name} (${size})`,
      color,
      size,
      shopPrice: 4500 + (index % 4) * 500,
    };
  }

  if (cat.includes('shirt') || cat === 'sweat shirts' || cat === 't-shirts') {
    const style = SHIRT_STYLES[index % SHIRT_STYLES.length];
    const color = SHIRT_COLORS[Math.floor(index / SHIRT_STYLES.length) % SHIRT_COLORS.length];
    const size = APPAREL_SIZES[index % APPAREL_SIZES.length];
    return {
      name: `${style} Shirt — ${color} ${size}`,
      color,
      size,
      shopPrice: 3500 + (index % 5) * 400,
    };
  }

  if (cat.includes('shoe') || cat.includes('loafer')) {
    const adj = GENERIC_ADJECTIVES[index % GENERIC_ADJECTIVES.length];
    const size = SHOE_SIZES[index % SHOE_SIZES.length];
    const color = ['Black', 'Brown', 'Tan', 'Navy', 'Burgundy'][index % 5];
    const label = categoryName.replace(/s$/, '');
    return {
      name: `${adj} ${label} — ${color} ${size}`,
      color,
      size,
      shopPrice: 8500 + (index % 6) * 1200,
    };
  }

  const namePool = cat.includes('khaki') ? KHAKI_NAMES
    : cat.includes('polo') ? POLO_NAMES
      : cat.includes('suit') ? SUIT_NAMES
        : null;

  const base = namePool
    ? namePool[index % namePool.length]
    : `${GENERIC_ADJECTIVES[index % GENERIC_ADJECTIVES.length]} ${categoryName}`;
  const size = APPAREL_SIZES[index % APPAREL_SIZES.length];
  const color = ['Navy', 'Black', 'Grey', 'Khaki', 'White'][index % 5];

  return {
    name: `${base} — ${color} ${size}`,
    color,
    size,
    shopPrice: 4000 + (index % 8) * 600,
  };
};

/** One inventory row per unit — totalQty rows, each shopQty = 1. */
const generateCategoryProducts = (categoryName, totalQty) => {
  if (totalQty <= 0) return [];

  return Array.from({ length: totalQty }, (_, i) => {
    const spec = pickUnitSpec(categoryName, i);
    const unitNumber = i + 1;
    return {
      name: spec.name,
      color: spec.color,
      size: spec.size,
      shopPrice: spec.shopPrice,
      shopQty: 1,
      storeQty: 0,
      unitNumber,
      warehouse: false,
      description: buildDescription(spec.name, categoryName, unitNumber, spec.size, spec.color),
      color_groups: [{
        color: spec.color,
        image_url: '',
        sizes: [{ size: spec.size, stock: 1, price_override: 0 }],
      }],
    };
  });
};

const warehouseCountFor = (closing) => {
  if (closing <= 0) return 0;
  if (closing <= 5) return 1;
  return Math.max(1, Math.round(closing * 0.25));
};

const generateWarehouseProducts = (categoryName, count, shopOffset = 0) =>
  Array.from({ length: count }, (_, i) => {
    const spec = pickUnitSpec(categoryName, shopOffset + i);
    const unitNumber = i + 1;
    return {
      name: `${spec.name} (Warehouse)`,
      color: spec.color,
      size: spec.size,
      shopPrice: spec.shopPrice,
      shopQty: 0,
      storeQty: 1,
      unitNumber,
      warehouse: true,
      description: buildDescription(spec.name, categoryName, unitNumber, spec.size, spec.color, { warehouse: true }),
      color_groups: [{
        color: spec.color,
        image_url: '',
        sizes: [{ size: spec.size, stock: 1, price_override: 0 }],
      }],
    };
  });

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

const deleteCatalogSkus = async (client) => {
  const r = await client.query(
    `SELECT id FROM pos_products WHERE sku LIKE $1 AND ecommerce_product_id IS NULL`,
    [`${SKU_PREFIX}-%`]
  );
  for (const row of r.rows) {
    await client.query('DELETE FROM pos_stock_levels WHERE product_id = $1', [row.id]);
    await client.query('DELETE FROM pos_store_stock_levels WHERE product_id = $1', [row.id]);
    await client.query('DELETE FROM pos_daily_stock_snapshots WHERE product_id = $1', [row.id]);
    await client.query('DELETE FROM pos_products WHERE id = $1', [row.id]);
  }
  return r.rowCount;
};

const padWidth = (n) => (n >= 1000 ? 5 : 4);

const seedInventoryCatalog = async ({ replaceExisting = true, onProgress } = {}) => {
  const client = await db.pool.connect();
  const summary = { categories: [], totalProducts: 0, totalShopQty: 0, totalStoreQty: 0, deleted: 0 };

  try {
    await client.query('BEGIN');

    if (replaceExisting) {
      summary.deleted = await deleteCatalogSkus(client);
    }

    for (const row of posStockCatalog) {
      const closing = row.closing ?? 0;
      if (closing <= 0) continue;

      const templates = generateCategoryProducts(row.name, closing);
      const warehouseTemplates = generateWarehouseProducts(row.name, warehouseCountFor(closing), closing);
      const allTemplates = [...templates, ...warehouseTemplates];
      const code = slugPart(row.name);
      const skuPad = padWidth(Math.max(closing, warehouseTemplates.length));
      let catShop = 0;
      let catStore = 0;

      for (let i = 0; i < allTemplates.length; i++) {
        const t = allTemplates[i];
        const sku = t.warehouse
          ? `${SKU_PREFIX}-${code}-W-${String(i - templates.length + 1).padStart(skuPad, '0')}`
          : `${SKU_PREFIX}-${code}-${String(i + 1).padStart(skuPad, '0')}`;
        const variants = flattenVariants(t.color_groups);

        const pos = await createPosInventoryItem(
          {
            name: t.name,
            sku,
            category: row.name,
            shopPrice: t.shopPrice,
            onlinePrice: t.shopPrice,
            ecommerceProductId: null,
          },
          client
        );

        const websiteDetails = {
          category_name: row.name,
          unit_number: t.unitNumber,
          location: t.warehouse ? 'store' : 'shop',
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

        await setShopQty(pos.id, t.warehouse ? 0 : 1, { client });
        await setStoreQty(pos.id, t.warehouse ? 1 : 0, { client });

        if (t.warehouse) catStore += 1;
        else catShop += 1;
        summary.totalProducts += 1;
        summary.totalShopQty += t.warehouse ? 0 : 1;
        summary.totalStoreQty += t.warehouse ? 1 : 0;

        if (onProgress && (i + 1) % 50 === 0) {
          onProgress({ category: row.name, done: i + 1, total: allTemplates.length });
        }
      }

      summary.categories.push({
        name: row.name,
        targetQty: closing,
        actualShopQty: catShop,
        warehouseQty: catStore,
        productCount: allTemplates.length,
      });
    }

    await client.query('COMMIT');

    return summary;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  seedInventoryCatalog,
  runSeedCatalog: seedInventoryCatalog,
  generateCategoryProducts,
  pickUnitSpec,
  buildDescription,
  warehouseCountFor,
  SKU_PREFIX,
  slugPart,
};
