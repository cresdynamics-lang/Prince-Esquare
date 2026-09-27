const { deleteProductsByIds } = require('../services/productDelete');
const { formatResponse } = require('../utils/responseFormatter');
const { applyProductImageOptimization, optimizeCloudinaryUrl } = require('../utils/cloudinaryImage');
const db = require('../config/db');
const { getPosStockForProductIds } = require('../services/productPosLink');
const { attachVariantAvailability } = require('../utils/productAvailability');
const { generateProductSku, generateVariantSku } = require('../utils/sku');
const { isAdminRole, isSellerRole } = require('../utils/posHelpers');

const isStaffUser = (user) => user && (isAdminRole(user) || isSellerRole(user));

function normalizeSetComponents(raw) {
  if (!raw) return [];
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item, index) => {
      const name = String(item?.name || '').trim();
      if (!name) return null;
      const priceNum = Number(item.price);
      return {
        id: String(item.id || `set-${index + 1}`),
        name,
        category_hint: String(item.category_hint || 'other').trim().toLowerCase().slice(0, 40) || 'other',
        size: String(item.size || '').trim(),
        price: Number.isFinite(priceNum) ? Math.max(0, priceNum) : 0,
        note: String(item.note || '').trim(),
      };
    })
    .filter(Boolean);
}

function sumSetComponents(components) {
  return components.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
}

/** Map UI labels / aliases to canonical category slugs. */
const CATEGORY_SLUG_ALIASES = {
  trousers: 'trousers',
  pants: 'trousers',
  shoes: 'shoes',
  tracksuits: 'track-suits',
  'track-suit': 'track-suits',
  'track suits': 'track-suits',
  'belts & ties': 'belts-ties',
  belts: 'belts-ties',
  'polo t-shirts': 'polo-t-shirts',
  polos: 'polo-t-shirts',
  'knitted polos': 'knitted-polos',
  'formal shoes': 'formal-shoes',
  khaki: 'khaki',
  chino: 'chino',
  gurkha: 'gurkha',
  ghurka: 'gurkha',
  sets: 'sets',
  set: 'sets',
  outfits: 'sets',
  look: 'sets',
  vests: 'vests',
  vest: 'vests',
  boxers: 'boxers',
  boxer: 'boxers',
  jackets: 'jackets',
  'full-jackets': 'full-jackets',
  'half-jackets': 'half-jackets',
  'casual-shirts': 'shirts-casual',
  'shirts-casual': 'shirts-casual',
  socks: 'socks',
  sock: 'socks',
  accessories: 'belts-ties',
  'long-sleeve': 'formal-shirts',
  'long-sleeved': 'formal-shirts',
  'long-sleeved-shirts': 'formal-shirts',
  'long sleeve shirts': 'formal-shirts',
};

const normalizeCategoryParam = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'all') return '';
  if (CATEGORY_SLUG_ALIASES[raw]) return CATEGORY_SLUG_ALIASES[raw];
  const slugish = raw.replace(/&/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  return CATEGORY_SLUG_ALIASES[slugish] || slugish;
};

const stripPosStockFields = (item) => {
    if (!item || typeof item !== 'object') return item;
    const {
        pos_stock_qty,
        pos_in_stock,
        pos_product_name,
        pos_stock_product_id,
        ...rest
    } = item;
    return rest;
};

const forAudience = (data, req) => {
  if (isStaffUser(req.user)) return data;
  const normalize = (item) => {
    if (!item || typeof item !== 'object') return item;
    return {
      ...stripPosStockFields(item),
      out_of_stock: false,
      online_in_stock: true,
    };
  };
  return Array.isArray(data) ? data.map(normalize) : normalize(data);
};

const attachPosStock = async (products, { forStaff = false } = {}) => {
    const list = Array.isArray(products) ? products : [products];
    if (!forStaff) {
        const enriched = await attachVariantAvailability(list);
        return Array.isArray(products) ? enriched : enriched[0];
    }
    const ids = list.map((p) => p.id).filter(Boolean);
    const stockMap = await getPosStockForProductIds(ids);
    const withPos = list.map((p) => {
        const pos = stockMap[p.id];
        const posQty = pos?.qty;
        const usePos = pos?.posProductId != null;
        return {
            ...p,
            pos_stock_product_id: pos?.posProductId || p.pos_stock_product_id,
            pos_stock_qty: usePos ? posQty : null,
            pos_in_stock: usePos ? posQty > 0 : null,
            pos_product_name: pos?.posProductName || null,
        };
    });
    const enriched = await attachVariantAvailability(withPos, { includePosStock: forStaff });
    return Array.isArray(products) ? enriched : enriched[0];
};

const mapVariantRow = (v, productSku) => {
    const sku = generateVariantSku(productSku, v);
    return {
        id: v.id,
        name: v.name,
        value: v.value,
        stock: v.stock_quantity,
        price_modifier: v.price_modifier,
        image_url: v.image_url,
        angle_images: v.angle_images,
        color: v.color,
        size: v.size,
        sku,
        stock_id: sku,
    };
};

// @desc    Get all products (with filtering, sorting, pagination)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
    try {
        const { category, sub, brand, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const categorySlug = normalizeCategoryParam(category);
        const subSlug = normalizeCategoryParam(sub);

        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug,
                   p_cat.name as parent_category_name, p_cat.slug as parent_category_slug,
                   b.name as brand_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
            LEFT JOIN brands b ON p.brand_id = b.id 
            WHERE p.is_active = true
              AND p.thumbnail IS NOT NULL
              AND TRIM(p.thumbnail::text) <> ''
              AND LOWER(TRIM(p.thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')
        `;
        
        const params = [];
        let paramCount = 1;

        if (categorySlug === 'presidential' || subSlug === 'presidential') {
            query += ` AND (
                LOWER(c.slug) = 'presidential'
                OR LOWER(p.name) LIKE '%presidential%'
            ) `;
        } else if (categorySlug) {
            if (subSlug) {
                // Exact subcategory within the selected parent family only
                query += ` AND (
                    LOWER(c.slug) = LOWER($${paramCount})
                    OR LOWER(REPLACE(c.name, ' ', '-')) = LOWER($${paramCount})
                    OR LOWER(c.name) = LOWER($${paramCount})
                ) `;
                query += ` AND (
                    LOWER(p_cat.slug) = LOWER($${paramCount + 1})
                    OR LOWER(REPLACE(COALESCE(p_cat.name, ''), ' ', '-')) = LOWER($${paramCount + 1})
                    OR LOWER(COALESCE(p_cat.name, '')) = LOWER($${paramCount + 1})
                    OR LOWER(c.slug) = LOWER($${paramCount + 1})
                ) `;
                params.push(subSlug, categorySlug);
                paramCount += 2;
            } else {
                // Match this category itself or its direct children — never other families
                query += ` AND (
                    LOWER(c.slug) = LOWER($${paramCount})
                    OR LOWER(REPLACE(c.name, ' ', '-')) = LOWER($${paramCount})
                    OR LOWER(c.name) = LOWER($${paramCount})
                    OR LOWER(p_cat.slug) = LOWER($${paramCount})
                    OR LOWER(REPLACE(COALESCE(p_cat.name, ''), ' ', '-')) = LOWER($${paramCount})
                    OR LOWER(COALESCE(p_cat.name, '')) = LOWER($${paramCount})
                ) `;
                params.push(categorySlug);
                paramCount++;
            }

            // Hard exclusions so shoes/belts never leak into trousers (and vice versa)
            if (categorySlug === 'trousers' || ['chino', 'khaki', 'gurkha', 'jeans', 'formal'].includes(categorySlug)) {
                query += ` AND LOWER(COALESCE(p_cat.slug, c.slug)) = 'trousers'
                           AND LOWER(c.slug) NOT IN ('belts-ties', 'formal-shoes', 'boots', 'sandals', 'loafers')
                           AND LOWER(COALESCE(p_cat.slug, '')) NOT IN ('shoes', 'belts-ties') `;
            } else if (categorySlug === 'shoes') {
                query += ` AND LOWER(p_cat.slug) = 'shoes'
                           AND LOWER(c.slug) <> 'belts-ties'
                           AND LOWER(COALESCE(p_cat.slug, c.slug)) <> 'trousers' `;
            } else if (['formal-shoes', 'boots', 'sandals', 'loafers', 'casual'].includes(categorySlug)) {
                query += ` AND LOWER(c.slug) = LOWER($${paramCount})
                           AND LOWER(COALESCE(p_cat.slug, '')) = 'shoes' `;
                params.push(categorySlug);
                paramCount++;
            } else if (categorySlug === 'belts-ties') {
                query += ` AND LOWER(c.slug) = 'belts-ties' `;
            }
        }

        if (brand) {
            query += ` AND (LOWER(b.slug) = LOWER($${paramCount}::text) OR b.id::text = $${paramCount} OR LOWER(b.name) = LOWER($${paramCount})) `;
            params.push(brand);
            paramCount++;
        }

        if (minPrice) {
            query += `AND p.price >= $${paramCount} `;
            params.push(minPrice);
            paramCount++;
        }

        if (maxPrice) {
            query += `AND p.price <= $${paramCount} `;
            params.push(maxPrice);
            paramCount++;
        }

        // Sorting — newest updates first by default so freshly edited products appear
        if (sort === 'price_asc') query += 'ORDER BY p.price ASC ';
        else if (sort === 'price_desc') query += 'ORDER BY p.price DESC ';
        else if (sort === 'newest') query += 'ORDER BY p.created_at DESC ';
        else if (sort === 'updated' || sort === 'updated_at') query += 'ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC ';
        else query += 'ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC ';

        // Pagination
        query += `LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        
        // Get total count for pagination (respect category filters)
        let countQuery = `
            SELECT COUNT(*) FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.is_active = true
              AND p.thumbnail IS NOT NULL
              AND TRIM(p.thumbnail::text) <> ''
              AND LOWER(TRIM(p.thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')
        `;
        const countParams = [];
        // Rebuild the same filters for an accurate count without LIMIT
        // (reuse main query params except limit/offset)
        const filterParams = params.slice(0, -2);
        if (categorySlug || brand || minPrice || maxPrice) {
            // Extract WHERE clause portion from main query between WHERE and ORDER BY
            const whereMatch = query.match(/WHERE[\s\S]*?(?=ORDER BY|LIMIT)/i);
            if (whereMatch) {
                countQuery = `
                    SELECT COUNT(*) FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
                    LEFT JOIN brands b ON p.brand_id = b.id
                    ${whereMatch[0]}
                `;
            }
        }
        const countResult = await db.query(
            countQuery.includes('$') ? countQuery : 'SELECT COUNT(*) FROM products WHERE is_active = true',
            countQuery.includes('$') ? filterParams : []
        );
        const total = parseInt(countResult.rows[0].count);

        let products = result.rows.map((p) => applyProductImageOptimization(p));
        products = await attachPosStock(products, { forStaff: isStaffUser(req.user) });

        products = forAudience(products, req);
        formatResponse(res, 200, true, 'Products fetched successfully', {
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / Math.max(parseInt(limit, 10) || 1, 1))
            }
        });
    } catch (error) {
        next(error);
    }
};


function sectionFromProduct(product) {
  const cat = product.category_slug || '';
  const parent = product.parent_category_slug || '';
  const name = product.name || '';

  if (cat === 'track-suits' || parent === 'track-suits') {
    return { title: 'Track Suits', slug: 'track-suits' };
  }
  if (cat === 'khaki' || parent === 'khaki') {
    return { title: 'Khaki Trousers', slug: 'khaki' };
  }
  if (cat === 'boots' || parent === 'boots' || /boot/i.test(name)) {
    return { title: 'Official Boots', slug: 'boots' };
  }
  if (cat === 'formal-shoes' || parent === 'formal-shoes' || parent === 'shoes' || cat.includes('shoe')) {
    return { title: 'Official Shoes', slug: 'formal-shoes' };
  }
  return {
    title: product.category_name || product.parent_category_name || 'Sale Picks',
    slug: cat || parent || 'sale',
  };
}

async function fetchOnSaleProducts() {
  const sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug,
           p_cat.name AS parent_category_name, p_cat.slug AS parent_category_slug,
           b.name AS brand_name,
           COALESCE(sales.units_sold, 0)::int AS units_sold,
           COALESCE(carts.cart_adds, 0)::int AS cart_adds
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN (
      SELECT oi.product_id, SUM(oi.quantity) AS units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      GROUP BY oi.product_id
    ) sales ON sales.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS cart_adds
      FROM product_events
      WHERE event_type = 'cart_add' AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY product_id
    ) carts ON carts.product_id = p.id
    WHERE p.is_active = true AND p.is_on_sale = true
      AND p.thumbnail IS NOT NULL
      AND TRIM(p.thumbnail::text) <> ''
      AND LOWER(TRIM(p.thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')
    ORDER BY COALESCE(sales.units_sold, 0) DESC, COALESCE(carts.cart_adds, 0) DESC,
             p.is_featured DESC, p.created_at DESC
  `;

  try {
    const result = await db.query(sql);
    return result.rows;
  } catch (err) {
    if (err.code !== '42P01') throw err;
    const fallbackSql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             p_cat.name AS parent_category_name, p_cat.slug AS parent_category_slug,
             b.name AS brand_name,
             COALESCE(sales.units_sold, 0)::int AS units_sold,
             0::int AS cart_adds
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN (
        SELECT oi.product_id, SUM(oi.quantity) AS units_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
        GROUP BY oi.product_id
      ) sales ON sales.product_id = p.id
      WHERE p.is_active = true AND p.is_on_sale = true
        AND p.thumbnail IS NOT NULL
        AND TRIM(p.thumbnail::text) <> ''
        AND LOWER(TRIM(p.thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')
      ORDER BY COALESCE(sales.units_sold, 0) DESC, p.is_featured DESC, p.created_at DESC
    `;
    const result = await db.query(fallbackSql);
    return result.rows;
  }
}


async function attachVariants(products) {
  if (!products.length) return products;
  const ids = products.map((p) => p.id);
  const result = await db.query(
    'SELECT * FROM product_variants WHERE product_id = ANY($1::uuid[]) ORDER BY value ASC',
    [ids],
  );
  const byProduct = {};
  for (const variant of result.rows) {
    if (!byProduct[variant.product_id]) byProduct[variant.product_id] = [];
    byProduct[variant.product_id].push(variant);
  }
  return products.map((p) => ({ ...p, variants: byProduct[p.id] || [] }));
}

/** Shared 2-minute sale grid rotation — same order for all visitors in a window (Meta ads). */
const SALE_ROTATION_MS = 2 * 60 * 1000;
const SALE_FEATURED_SLOTS = [0, 4, 5]; // grid positions 1, 5, 6 (0-based)

function saleRotationWindow(now = Date.now()) {
  const windowIndex = Math.floor(now / SALE_ROTATION_MS);
  const windowStartsAt = windowIndex * SALE_ROTATION_MS;
  return {
    windowMs: SALE_ROTATION_MS,
    windowIndex,
    windowStartsAt,
    nextRotationAt: windowStartsAt + SALE_ROTATION_MS,
  };
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle(items, rng) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Every 2 minutes: randomize products in slots 1, 5, and 6 (and reshuffle the rest).
 * Seeded by the shared time window so Meta ad landings see the same order — not a fresh shuffle per visit.
 */
function rotateSaleFeaturedSlots(products, windowIndex, sectionSlug) {
  if (!products?.length) return products || [];
  const list = [...products];
  if (list.length <= 1) return list;

  const rng = mulberry32(hashSeed(`${windowIndex}:${sectionSlug}:sale`));
  const shuffled = seededShuffle(list, rng);
  const slots = SALE_FEATURED_SLOTS.filter((i) => i < shuffled.length);

  // Guarantee featured slots differ from the static sales-rank order when possible.
  const salesRank = list.map((p) => p.id);
  const featuredSameAsSales = slots.every((slot) => shuffled[slot]?.id === salesRank[slot]);
  if (featuredSameAsSales && shuffled.length > slots.length) {
    const swapWith = slots[0];
    let other = (swapWith + 1) % shuffled.length;
    while (slots.includes(other) && other !== swapWith) {
      other = (other + 1) % shuffled.length;
    }
    [shuffled[swapWith], shuffled[other]] = [shuffled[other], shuffled[swapWith]];
  }

  return shuffled;
}

// @desc    Sale showcase — admin-managed is_on_sale products (flat mixed grid, no categories)
// @route   GET /api/products/sale
exports.getSaleProducts = async (req, res, next) => {
  try {
    let products = await attachVariants(await fetchOnSaleProducts());
    products = await attachPosStock(products, { forStaff: isStaffUser(req.user) });
    products = forAudience(products, req);
    const rotation = saleRotationWindow();
    const mixed = rotateSaleFeaturedSlots(products, rotation.windowIndex, 'sale-all');

    formatResponse(res, 200, true, 'Sale products fetched', {
      products: mixed,
      sections: [],
      rotation: {
        windowMs: rotation.windowMs,
        windowStartsAt: rotation.windowStartsAt,
        nextRotationAt: rotation.nextRotationAt,
        featuredSlots: [1, 5, 6],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE is_featured = true AND is_active = true LIMIT 8');
        let products = result.rows.map((p) => applyProductImageOptimization(p));
        products = await attachPosStock(products, { forStaff: isStaffUser(req.user) });
        products = forAudience(products, req);
        formatResponse(res, 200, true, 'Featured products fetched', products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by slug
// @route   GET /api/products/:slug
exports.getProductBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
        const productResult = await db.query(
            'SELECT p.*, c.name as category_name, p_cat.name as parent_category_name, b.name as brand_name FROM products p ' +
            'LEFT JOIN categories c ON p.category_id = c.id ' +
            'LEFT JOIN categories p_cat ON c.parent_id = p_cat.id ' +
            'LEFT JOIN brands b ON p.brand_id = b.id ' +
            `WHERE (p.slug = $1 ${isUuid ? 'OR p.id = $1::uuid' : ''}) AND p.is_active = true`,
            [decodeURIComponent(slug)]
        );

        if (productResult.rows.length === 0) {
            return formatResponse(res, 404, false, 'Product not found');
        }

        const product = productResult.rows[0];

        // Fetch variants
        const variantsResult = await db.query('SELECT * FROM product_variants WHERE product_id = $1', [product.id]);
        product.variants = variantsResult.rows.map((v) => mapVariantRow(v, product.sku || product.slug || product.name));

        const enriched = await attachPosStock(
            applyProductImageOptimization(product),
            { forStaff: isStaffUser(req.user) }
        );
        formatResponse(res, 200, true, 'Product details fetched', forAudience(enriched, req));
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Create product ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â inventory-first: record stock in Inventory before website listing
// @route   POST /api/admin/products
exports.createProduct = async (req, res, next) => {
    try {
        const {
            name,
            slug,
            description,
            focus_description,
            price,
            discount_price,
            pos_sell_price,
            inventory_opening_qty,
            category_id,
            brand_id,
            stock_quantity,
            is_featured,
            is_active,
            thumbnail,
            images,
            variants,
            set_components,
            sku,
        } = req.body;
        const productSku = generateProductSku({ name, slug, sku });
        const isStaff = req.user?.role === 'staff';
        const published = is_active === false ? false : true;
        const setComponents = normalizeSetComponents(set_components);
        const setTotal = sumSetComponents(setComponents);
        const finalPrice = setComponents.length ? setTotal : (price || 0);

        const result = await db.query(
            'INSERT INTO products (name, slug, sku, description, focus_description, price, discount_price, pos_sell_price, category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images, set_components) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
            [
                name,
                slug,
                productSku,
                description || null,
                focus_description || null,
                finalPrice,
                discount_price || null,
                pos_sell_price || null,
                category_id || null,
                brand_id || null,
                stock_quantity || 0,
                is_featured || false,
                published,
                thumbnail || null,
                JSON.stringify(images || []),
                JSON.stringify(setComponents),
            ]
        );

        const productId = result.rows[0].id;

        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                const value = `${v.size || ''} / ${v.color || ''}`;
                const variantSku = generateVariantSku(productSku, v);
                await db.query(
                    'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        productId,
                        'Variant',
                        value,
                        v.price_override || 0,
                        parseInt(v.stock, 10) || 0,
                        v.image_url || null,
                        v.color || null,
                        v.size || null,
                        variantSku,
                        variantSku,
                    ]
                );
            }
        }

        const { ensurePosForEcommerceProduct, syncPosMetadataFromEcommerce } = require('../services/inventoryChannel');
        const { receiveAtStore } = require('../services/inventoryMovement');
        const posRow = await ensurePosForEcommerceProduct(result.rows[0]);
        await syncPosMetadataFromEcommerce(result.rows[0], posRow);
        const storeQty = Math.max(0, parseInt(inventory_opening_qty, 10) || 0);
        if (posRow?.id && storeQty > 0) {
            const { resolvePosActorId } = require('../services/staffPosBridge');
            await receiveAtStore(posRow.id, storeQty, {
                notes: 'Added from Products ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â warehouse intake',
                recordedBy: await resolvePosActorId(req.user),
            });
        }

        const { invalidateCatalogueCache } = require('./catalogueController');
        invalidateCatalogueCache();
        formatResponse(res, 201, true, 'Product created ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â recorded in store inventory', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Update product
// @route   PUT /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, focus_description, price, discount_price, pos_sell_price, cost_price, category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images, variants, set_components, sku } = req.body;
        const isStaff = req.user?.role === 'staff';
        const productSku = generateProductSku({ name, slug, sku });

        const existingR = await db.query('SELECT is_active FROM products WHERE id = $1', [id]);
        if (existingR.rows.length === 0) {
            return formatResponse(res, 404, false, 'Product not found');
        }
        const nextActive = is_active === false ? false : (is_active !== undefined ? Boolean(is_active) : true);

        // Website visibility is size/category based — do not block publish on POS stock link.

        const parsedCost = cost_price != null && cost_price !== '' ? parseFloat(cost_price) : null;
        const setComponents = normalizeSetComponents(set_components);
        const setTotal = sumSetComponents(setComponents);
        const finalPrice = setComponents.length ? setTotal : (price || 0);

        const result = await db.query(
            'UPDATE products SET name = $1, slug = $2, sku = $3, description = $4, focus_description = $5, price = $6, discount_price = $7, pos_sell_price = $8, cost_price = $9, category_id = $10, brand_id = $11, ' +
            'stock_quantity = $12, is_featured = $13, is_active = $14, thumbnail = $15, images = $16, set_components = $17, updated_at = NOW() WHERE id = $18 RETURNING *',
            [name, slug, productSku, description || null, focus_description || null, finalPrice, discount_price || null, pos_sell_price ?? null, parsedCost, category_id || null, brand_id || null, 0, is_featured || false, nextActive, thumbnail || null, JSON.stringify(images || []), JSON.stringify(setComponents), id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Product not found');
        }

        if (variants && Array.isArray(variants)) {
            const existingVariants = await db.query(
                'SELECT id, stock_quantity FROM product_variants WHERE product_id = $1',
                [id]
            );
            const stockById = new Map(existingVariants.rows.map((row) => [row.id, row.stock_quantity]));

            const incomingIds = variants.map((v) => v.id).filter(Boolean);
            if (incomingIds.length > 0) {
                await db.query('DELETE FROM product_variants WHERE product_id = $1 AND id NOT IN (SELECT unnest($2::uuid[]))', [id, incomingIds]);
            } else {
                await db.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
            }

            for (const v of variants) {
                const value = `${v.size || ''} / ${v.color || ''}`;
                const variantSku = generateVariantSku(productSku, v);
                const stockQty = v.id ? (stockById.get(v.id) ?? 0) : 0;
                if (v.id) {
                    await db.query(
                        'UPDATE product_variants SET name = $1, value = $2, price_modifier = $3, stock_quantity = $4, image_url = $5, color = $6, size = $7, sku = $8, stock_id = $9 WHERE id = $10',
                        ['Variant', value, v.price_override || 0, stockQty, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku, v.id]
                    );
                } else {
                    await db.query(
                        'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                        [id, 'Variant', value, v.price_override || 0, 0, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku]
                    );
                }
            }

            const sumR = await db.query(
                'SELECT COALESCE(SUM(stock_quantity), 0)::int AS total FROM product_variants WHERE product_id = $1',
                [id]
            );
            await db.query('UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2', [sumR.rows[0]?.total || 0, id]);
        }

        const { ensurePosForEcommerceProduct, syncPosMetadataFromEcommerce } = require('../services/inventoryChannel');
        const posRow = await ensurePosForEcommerceProduct(result.rows[0]);
        await syncPosMetadataFromEcommerce(result.rows[0], posRow);

        const { invalidateCatalogueCache } = require('./catalogueController');
        invalidateCatalogueCache();
        formatResponse(res, 200, true, 'Product updated successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Bulk mark or delete products
// @route   POST /api/admin/products/bulk
exports.bulkProductAction = async (req, res, next) => {
    try {
        const { ids, action } = req.body || {};
        const uuidList = [...new Set(Array.isArray(ids) ? ids : [])].filter(Boolean);
        if (!uuidList.length) {
            return formatResponse(res, 400, false, 'No products selected');
        }

        const handlers = {
            delete: async () => {
                const deleted = await deleteProductsByIds(uuidList);
                return { deleted };
            },
            feature: async () => {
                const r = await db.query(
                    'UPDATE products SET is_featured = true, updated_at = NOW() WHERE id = ANY($1::uuid[]) RETURNING id',
                    [uuidList]
                );
                return { updated: r.rows.length, is_featured: true };
            },
            unfeature: async () => {
                const r = await db.query(
                    'UPDATE products SET is_featured = false, updated_at = NOW() WHERE id = ANY($1::uuid[]) RETURNING id',
                    [uuidList]
                );
                return { updated: r.rows.length, is_featured: false };
            },
            publish: async () => {
                const r = await db.query(
                    `UPDATE products SET is_active = true, updated_at = NOW()
                     WHERE id = ANY($1::uuid[])
                     RETURNING id`,
                    [uuidList]
                );
                return {
                    updated: r.rows.length,
                    is_active: true,
                    skipped: uuidList.length - r.rows.length,
                };
            },
            unpublish: async () => {
                const r = await db.query(
                    'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = ANY($1::uuid[]) RETURNING id',
                    [uuidList]
                );
                return { updated: r.rows.length, is_active: false };
            },
        };

        if (!handlers[action]) {
            return formatResponse(res, 400, false, 'Invalid bulk action');
        }

        const result = await handlers[action]();
        const { invalidateCatalogueCache } = require('./catalogueController');
        invalidateCatalogueCache();
        formatResponse(res, 200, true, 'Bulk action completed', { action, ...result });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Quick-mark product (featured / published)
// @route   PATCH /api/admin/products/:id/flags
exports.patchProductFlags = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_featured, is_active } = req.body || {};
        const updates = [];
        const values = [];
        let idx = 1;

        if (is_featured !== undefined) {
            updates.push(`is_featured = $${idx++}`);
            values.push(Boolean(is_featured));
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${idx++}`);
            values.push(Boolean(is_active));
        }
        if (!updates.length) {
            return formatResponse(res, 400, false, 'Provide is_featured and/or is_active');
        }

        values.push(id);
        const result = await db.query(
            `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Product not found');
        }

        const { invalidateCatalogueCache } = require('./catalogueController');
        invalidateCatalogueCache();
        formatResponse(res, 200, true, 'Product updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Delete product
// @route   DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await deleteProductsByIds([id]);
        if (!deleted) {
            return formatResponse(res, 404, false, 'Product not found');
        }

        const { invalidateCatalogueCache } = require('./catalogueController');
        invalidateCatalogueCache();
        formatResponse(res, 200, true, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

// Placeholders for remaining methods
const ACTIVE_WITH_IMAGE_SQL = `
  is_active = true
  AND thumbnail IS NOT NULL
  AND TRIM(thumbnail::text) <> ''
  AND LOWER(TRIM(thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')
`;

exports.getNewArrivals = async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT * FROM products WHERE ${ACTIVE_WITH_IMAGE_SQL} ORDER BY created_at DESC LIMIT 8`
        );
        formatResponse(res, 200, true, 'New arrivals fetched', result.rows.map(applyProductImageOptimization));
    } catch (error) { next(error); }
};

exports.getBestSellers = async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT * FROM products WHERE ${ACTIVE_WITH_IMAGE_SQL} ORDER BY ratings_count DESC LIMIT 8`
        );
        formatResponse(res, 200, true, 'Best sellers fetched', result.rows.map(applyProductImageOptimization));
    } catch (error) { next(error); }
};

const BELT_RELATED_PRODUCT_SLUGS = new Set([
    'black-leather-belt-set',
    'dark-brown-leather-belt-set',
]);

exports.getRelatedProducts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await db.query(
            `SELECT p.category_id, c.slug AS category_slug, parent.slug AS parent_category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN categories parent ON c.parent_id = parent.id
             WHERE p.id = $1`,
            [id]
        );
        if (product.rows.length === 0) return formatResponse(res, 404, false, 'Product not found');

        const result = await db.query(
            `SELECT * FROM products
             WHERE category_id = $1 AND id != $2
               AND is_active = true
               AND thumbnail IS NOT NULL
               AND TRIM(thumbnail::text) <> ''
               AND LOWER(TRIM(thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')
             ORDER BY created_at DESC LIMIT 12`,
            [product.rows[0].category_id, id]
        );

        let related = result.rows;
        const categorySlug = `${product.rows[0].category_slug || ''} ${product.rows[0].parent_category_slug || ''}`.toLowerCase();
        if (categorySlug.includes('belt')) {
            related = related.filter((row) => BELT_RELATED_PRODUCT_SLUGS.has(String(row.slug || '').toLowerCase()));
        }

        related = related.slice(0, 4).map((p) => applyProductImageOptimization(p));
        related = await attachPosStock(related, { forStaff: isStaffUser(req.user) });
        related = forAudience(related, req);

        formatResponse(res, 200, true, 'Related products fetched', related);
    } catch (error) { next(error); }
};

exports.adminGetProducts = async (req, res, next) => {
    try {
        const { search } = req.query;
        const lite = req.query.lite === '1' || req.query.lite === 'true';
        const params = [];
        let where = '';
        if (search && String(search).trim()) {
            params.push(`%${String(search).trim()}%`);
            where = ` WHERE (p.name ILIKE $1 OR p.sku ILIKE $1 OR p.slug ILIKE $1) `;
        }
        const productCols = lite
            ? `p.id, p.name, p.slug, p.sku, p.price, p.discount_price, p.cost_price, p.stock_quantity, p.is_active, p.is_featured, p.thumbnail, p.images, p.category_id, p.brand_id, p.focus_description, p.description, p.set_components, p.created_at`
            : 'p.*';
        const result = await db.query(
            `SELECT ${productCols}, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id${where} ORDER BY p.created_at DESC`,
            params
        );
        const products = result.rows;

        if (products.length > 0) {
            const productIds = products.map((p) => p.id);
            const variantCols = lite
                ? 'id, product_id, color, size, stock_quantity, price_modifier, image_url, sku, stock_id'
                : 'id, product_id, color, size, stock_quantity, price_modifier, image_url, sku, stock_id, angle_images';
            const variantsResult = await db.query(
                `SELECT ${variantCols} FROM product_variants WHERE product_id = ANY($1::uuid[]) ORDER BY color, size`,
                [productIds]
            );
            const variantsByProduct = {};
            for (const v of variantsResult.rows) {
                if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
                const variantSku = v.sku || v.stock_id || null;
                variantsByProduct[v.product_id].push({
                    id: v.id,
                    color: v.color,
                    size: v.size,
                    stock: v.stock_quantity,
                    price_override: v.price_modifier,
                    image_url: v.image_url,
                    sku: variantSku,
                    stock_id: variantSku,
                });
            }
            for (const p of products) {
                p.variants = variantsByProduct[p.id] || [];
                if (lite) {
                    if (p.thumbnail) {
                        p.thumbnail_optimized = optimizeCloudinaryUrl(p.thumbnail, { width: 120 });
                    }
                } else {
                    applyProductImageOptimization(p);
                }
            }
        }

        formatResponse(res, 200, true, 'Admin products fetched', products);
    } catch (error) {
        next(error);
    }
};

exports.uploadProductImages = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Upload logic placeholder'); } catch (error) { next(error); }
};

exports.deleteProductImage = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Delete image logic placeholder'); } catch (error) { next(error); }
};
