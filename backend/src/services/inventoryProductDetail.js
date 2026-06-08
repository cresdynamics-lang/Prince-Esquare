/**
 * Full product details for inventory items — mirrors website catalogue structure.
 * Linked items read live website data; drafts live in pos_products.website_details.
 */
const db = require('../config/db');
const { generateProductSku } = require('../utils/sku');
const { upsertWebsiteVariants } = require('./websiteVariants');

const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapVariantRow = (v) => ({
  id: v.id,
  color: v.color || null,
  size: v.size || null,
  stock: v.stock_quantity ?? 0,
  price_override: parseFloat(v.price_modifier || 0),
  image_url: v.image_url || null,
  sku: v.sku || v.stock_id || null,
});

const flattenColorGroups = (colorGroups = []) => {
  const variants = [];
  for (const group of colorGroups) {
    const color = group.color?.trim() || null;
    const groupImage = group.image_url || null;
    for (const row of group.sizes || []) {
      if (!row.size?.trim()) continue;
      variants.push({
        id: row.id || null,
        color,
        size: String(row.size).trim(),
        stock: parseInt(row.stock, 10) || 0,
        price_override: row.price_override != null ? parseFloat(row.price_override) : 0,
        image_url: row.image_url || groupImage || null,
        sku: row.sku || null,
      });
    }
  }
  return variants;
};

const groupVariantsByColor = (variants = []) => {
  const map = new Map();
  for (const v of variants) {
    const color = v.color || 'Original';
    if (!map.has(color)) {
      map.set(color, { color, image_url: v.image_url || '', sizes: [] });
    }
    const group = map.get(color);
    if (!group.image_url && v.image_url) group.image_url = v.image_url;
    group.sizes.push({
      id: v.id || null,
      size: v.size || '',
      stock: v.stock ?? v.stock_quantity ?? 0,
      price_override: v.price_override ?? v.price_modifier ?? '',
      sku: v.sku || null,
    });
  }
  return [...map.values()];
};

const fetchLiveWebsiteProduct = async (productId) => {
  const r = await db.query(
    `SELECT p.*, c.name AS category_name, b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.id = $1`,
    [productId]
  );
  if (!r.rows.length) return null;
  const product = r.rows[0];
  const vr = await db.query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY color, size',
    [productId]
  );
  product.variants = vr.rows.map(mapVariantRow);
  product.images = parseJson(product.images, []);
  return product;
};

const getInventoryProductDetail = async (posProductId) => {
  const posR = await db.query(
    `SELECT p.*, s.current_qty AS shop_qty, COALESCE(st.current_qty, 0) AS store_qty
     FROM pos_products p
     LEFT JOIN pos_stock_levels s ON s.product_id = p.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
     WHERE p.id = $1`,
    [posProductId]
  );
  if (!posR.rows.length) {
    throw Object.assign(new Error('Inventory item not found'), { statusCode: 404 });
  }
  const pos = posR.rows[0];
  const draft = parseJson(pos.website_details, {}) || {};

  if (pos.ecommerce_product_id) {
    const live = await fetchLiveWebsiteProduct(pos.ecommerce_product_id);
    if (live) {
      return {
        id: pos.id,
        name: live.name || pos.name,
        sku: pos.sku,
        category: pos.category,
        shop_price: parseFloat(pos.shop_price),
        shop_qty: pos.shop_qty ?? 0,
        store_qty: pos.store_qty ?? 0,
        website_product_id: live.id,
        website_published: Boolean(live.is_active),
        source: 'live',
        details: {
          category_id: live.category_id,
          category_name: live.category_name,
          brand_id: live.brand_id,
          brand_name: live.brand_name,
          description: live.description,
          price: parseFloat(live.price || 0),
          discount_price: live.discount_price != null ? parseFloat(live.discount_price) : null,
          thumbnail: live.thumbnail,
          images: live.images || [],
          variants: live.variants,
          color_groups: groupVariantsByColor(live.variants),
        },
      };
    }
  }

  const variants = draft.variants || [];
  return {
    id: pos.id,
    name: pos.name,
    sku: pos.sku,
    category: pos.category,
    shop_price: parseFloat(pos.shop_price),
    shop_qty: pos.shop_qty ?? 0,
    store_qty: pos.store_qty ?? 0,
    website_product_id: pos.ecommerce_product_id || null,
    website_published: false,
    source: 'draft',
    details: {
      category_id: draft.category_id || null,
      category_name: draft.category_name || pos.category,
      brand_id: draft.brand_id || null,
      description: draft.description || '',
      price: draft.price != null ? parseFloat(draft.price) : parseFloat(pos.online_price || pos.shop_price),
      discount_price: draft.discount_price != null ? parseFloat(draft.discount_price) : null,
      thumbnail: draft.thumbnail || null,
      images: draft.images || [],
      variants,
      color_groups: draft.color_groups || groupVariantsByColor(variants),
    },
  };
};

const saveInventoryProductDetail = async (posProductId, body = {}) => {
  const posR = await db.query('SELECT * FROM pos_products WHERE id = $1', [posProductId]);
  if (!posR.rows.length) {
    throw Object.assign(new Error('Inventory item not found'), { statusCode: 404 });
  }
  const pos = posR.rows[0];

  const {
    name,
    sku,
    category,
    shop_price,
    category_id,
    brand_id,
    description,
    price,
    discount_price,
    thumbnail,
    images = [],
    color_groups,
    variants: flatVariants,
  } = body;

  const variants = flatVariants?.length ? flatVariants : flattenColorGroups(color_groups);
  const categoryName = category || pos.category;

  let categoryIdResolved = category_id || null;
  let categoryLabel = categoryName;
  if (categoryIdResolved) {
    const catR = await db.query('SELECT name FROM categories WHERE id = $1', [categoryIdResolved]);
    if (catR.rows[0]?.name) categoryLabel = catR.rows[0].name;
  }

  const websiteDetails = {
    category_id: categoryIdResolved,
    category_name: categoryLabel,
    brand_id: brand_id || null,
    description: description || '',
    price: price != null ? parseFloat(price) : null,
    discount_price: discount_price != null ? parseFloat(discount_price) : null,
    thumbnail: thumbnail || null,
    images: images || [],
    variants,
    color_groups: color_groups || groupVariantsByColor(variants),
  };

  await db.query(
    `UPDATE pos_products SET
      name = COALESCE($1, name),
      sku = COALESCE($2, sku),
      category = COALESCE($3, category),
      shop_price = COALESCE($4, shop_price),
      online_price = COALESCE($5, online_price),
      website_details = $6::jsonb
     WHERE id = $7`,
    [
      name || null,
      sku ? String(sku).trim().toUpperCase() : null,
      categoryLabel || null,
      shop_price != null ? parseFloat(shop_price) : null,
      price != null ? parseFloat(price) : null,
      JSON.stringify(websiteDetails),
      posProductId,
    ]
  );

  if (pos.ecommerce_product_id) {
    const productSku = generateProductSku({ name: name || pos.name, sku: sku || pos.sku });
    await db.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        sku = $2,
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        discount_price = $5,
        category_id = COALESCE($6, category_id),
        brand_id = COALESCE($7, brand_id),
        thumbnail = COALESCE($8, thumbnail),
        images = CASE WHEN $9 IS NOT NULL THEN $9::jsonb ELSE images END,
        updated_at = NOW()
       WHERE id = $10`,
      [
        name || null,
        productSku,
        description || null,
        price != null ? parseFloat(price) : null,
        discount_price != null ? parseFloat(discount_price) : null,
        categoryIdResolved,
        brand_id || null,
        thumbnail || null,
        images?.length ? JSON.stringify(images) : null,
        pos.ecommerce_product_id,
      ]
    );
    if (variants.length) {
      await upsertWebsiteVariants(pos.ecommerce_product_id, variants, productSku);
    }
  }

  return getInventoryProductDetail(posProductId);
};

const publishInventoryProduct = async (posProductId, body = {}) => {
  const detail = await getInventoryProductDetail(posProductId);
  const d = detail.details || {};
  const variants = body.variants?.length
    ? body.variants
    : body.color_groups
      ? flattenColorGroups(body.color_groups)
      : d.variants || [];

  const publishBody = {
    price: body.price ?? d.price,
    discount_price: body.discount_price ?? d.discount_price,
    description: body.description ?? d.description,
    category_id: body.category_id ?? d.category_id,
    brand_id: body.brand_id ?? d.brand_id,
    thumbnail: body.thumbnail ?? d.thumbnail,
    images: body.images ?? d.images,
    stock_quantity: body.stock_quantity,
    is_active: body.is_active !== false,
    variants,
  };

  const { publishPosToWebsite } = require('./inventoryChannel');
  const result = await publishPosToWebsite(posProductId, publishBody);

  await db.query(
    `UPDATE pos_products SET website_details = website_details || $1::jsonb WHERE id = $2`,
    [
      JSON.stringify({
        category_id: publishBody.category_id,
        description: publishBody.description,
        price: publishBody.price,
        discount_price: publishBody.discount_price,
        thumbnail: publishBody.thumbnail,
        images: publishBody.images,
        variants,
        color_groups: groupVariantsByColor(variants),
      }),
      posProductId,
    ]
  );

  return { ...result, detail: await getInventoryProductDetail(posProductId) };
};

const syncFromLiveWebsite = async (posProductId) => {
  const posR = await db.query('SELECT ecommerce_product_id FROM pos_products WHERE id = $1', [posProductId]);
  if (!posR.rows.length) {
    throw Object.assign(new Error('Inventory item not found'), { statusCode: 404 });
  }
  const ecommerceId = posR.rows[0].ecommerce_product_id;
  if (!ecommerceId) {
    throw Object.assign(new Error('Item is not linked to the website'), { statusCode: 400 });
  }

  const live = await fetchLiveWebsiteProduct(ecommerceId);
  if (!live) {
    throw Object.assign(new Error('Linked website product not found'), { statusCode: 404 });
  }

  const variants = live.variants || [];
  const websiteDetails = {
    category_id: live.category_id,
    category_name: live.category_name,
    brand_id: live.brand_id,
    description: live.description,
    price: parseFloat(live.price || 0),
    discount_price: live.discount_price != null ? parseFloat(live.discount_price) : null,
    thumbnail: live.thumbnail,
    images: live.images || [],
    variants,
    color_groups: groupVariantsByColor(variants),
  };

  await db.query(
    `UPDATE pos_products SET
      name = $1,
      online_price = $2,
      category = COALESCE($3, category),
      website_details = $4::jsonb
     WHERE id = $5`,
    [
      live.name,
      parseFloat(live.price || 0),
      live.category_name || null,
      JSON.stringify(websiteDetails),
      posProductId,
    ]
  );

  return getInventoryProductDetail(posProductId);
};

module.exports = {
  getInventoryProductDetail,
  saveInventoryProductDetail,
  publishInventoryProduct,
  syncFromLiveWebsite,
  groupVariantsByColor,
  flattenColorGroups,
};
