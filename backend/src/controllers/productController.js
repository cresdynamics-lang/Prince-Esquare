const { formatResponse } = require('../utils/responseFormatter');
const { applyProductImageOptimization, optimizeCloudinaryUrl } = require('../utils/cloudinaryImage');
const db = require('../config/db');
const { getPosStockForProductIds } = require('../services/productPosLink');
const { attachVariantAvailability } = require('../utils/productAvailability');
const { generateProductSku, generateVariantSku } = require('../utils/sku');
const { isAdminRole, isSellerRole } = require('../utils/posHelpers');

const isStaffUser = (user) => user && (isAdminRole(user) || isSellerRole(user));

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
    return Array.isArray(data) ? data.map(stripPosStockFields) : stripPosStockFields(data);
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

        let query = `
            SELECT p.*, c.name as category_name, p_cat.name as parent_category_name, b.name as brand_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
            LEFT JOIN brands b ON p.brand_id = b.id 
            WHERE p.is_active = true 
        `;
        
        const params = [];
        let paramCount = 1;

        if (category && category !== 'All') {
            if (sub && sub !== 'All') {
                // Filter by specific sub-category AND its parent
                query += ` AND (LOWER(c.name) = LOWER($${paramCount}) OR LOWER(c.slug) = LOWER($${paramCount})) `;
                query += ` AND (LOWER(p_cat.name) = LOWER($${paramCount + 1}) OR LOWER(p_cat.slug) = LOWER($${paramCount + 1})) `;
                params.push(sub, category);
                paramCount += 2;
            } else {
                // Filter by parent category OR any product directly in this category
                query += ` AND (
                    LOWER(c.name) = LOWER($${paramCount}) OR LOWER(c.slug) = LOWER($${paramCount})
                    OR LOWER(p_cat.name) = LOWER($${paramCount}) OR LOWER(p_cat.slug) = LOWER($${paramCount})
                ) `;
                params.push(category);
                paramCount++;
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

        // Sorting
        if (sort === 'price_asc') query += 'ORDER BY p.price ASC ';
        else if (sort === 'price_desc') query += 'ORDER BY p.price DESC ';
        else if (sort === 'newest') query += 'ORDER BY p.created_at DESC ';
        else query += 'ORDER BY p.created_at DESC ';

        // Pagination
        query += `LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        
        // Get total count for pagination
        const countQuery = 'SELECT COUNT(*) FROM products WHERE is_active = true';
        const countResult = await db.query(countQuery);
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
                pages: Math.ceil(total / limit)
            }
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
        formatResponse(res, 200, true, 'Featured products fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by slug
// @route   GET /api/products/:slug
exports.getProductBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const productResult = await db.query(
            'SELECT p.*, c.name as category_name, p_cat.name as parent_category_name, b.name as brand_name FROM products p ' +
            'LEFT JOIN categories c ON p.category_id = c.id ' +
            'LEFT JOIN categories p_cat ON c.parent_id = p_cat.id ' +
            'LEFT JOIN brands b ON p.brand_id = b.id ' +
            'WHERE p.slug = $1 AND p.is_active = true',
            [slug]
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

// @desc    Admin: Create product
// @route   POST /api/admin/products
exports.createProduct = async (req, res, next) => {
    try {
        const { name, slug, description, price, discount_price, pos_sell_price, inventory_opening_qty, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, variants, sku } = req.body;
        const productSku = generateProductSku({ name, slug, sku });

        const result = await db.query(
            'INSERT INTO products (name, slug, sku, description, price, discount_price, pos_sell_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
            [name, slug, productSku, description || null, price || 0, discount_price || null, pos_sell_price || null, category_id || null, brand_id || null, stock_quantity || 0, is_featured || false, thumbnail || null, JSON.stringify(images || [])]
        );

        const productId = result.rows[0].id;
        
        // Save variants
        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                const value = `${v.size || ''} / ${v.color || ''}`;
                const variantSku = generateVariantSku(productSku, v);
                await db.query(
                    'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [productId, 'Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku]
                );
            }
        }

        const { ensurePosForEcommerceProduct, seedPosOpeningStockIfEmpty } = require('../services/inventoryChannel');
        const posRow = await ensurePosForEcommerceProduct(result.rows[0]);
        const openingQty =
          parseInt(inventory_opening_qty, 10) || parseInt(stock_quantity, 10) || 0;
        if (posRow?.id && openingQty > 0) {
          await seedPosOpeningStockIfEmpty(posRow.id, openingQty);
        }

        const { invalidateCatalogueCache } = require('./catalogueController');
        invalidateCatalogueCache();
        formatResponse(res, 201, true, 'Product created successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Update product
// @route   PUT /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price, discount_price, pos_sell_price, category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images, variants, sku } = req.body;
        const productSku = generateProductSku({ name, slug, sku });

        const result = await db.query(
            'UPDATE products SET name = $1, slug = $2, sku = $3, description = $4, price = $5, discount_price = $6, pos_sell_price = $7, category_id = $8, brand_id = $9, ' +
            'stock_quantity = $10, is_featured = $11, is_active = $12, thumbnail = $13, images = $14 WHERE id = $15 RETURNING *',
            [name, slug, productSku, description || null, price || 0, discount_price || null, pos_sell_price ?? null, category_id || null, brand_id || null, stock_quantity || 0, is_featured || false, is_active !== undefined ? is_active : true, thumbnail || null, JSON.stringify(images || []), id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Product not found');
        }

        // Handle variants
        if (variants && Array.isArray(variants)) {
            // Delete removed variants
            const incomingIds = variants.map(v => v.id).filter(Boolean);
            if (incomingIds.length > 0) {
                await db.query('DELETE FROM product_variants WHERE product_id = $1 AND id NOT IN (SELECT unnest($2::uuid[]))', [id, incomingIds]);
            } else {
                await db.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
            }

            // Insert or update
            for (const v of variants) {
                const value = `${v.size || ''} / ${v.color || ''}`;
                const variantSku = generateVariantSku(productSku, v);
                if (v.id) {
                    await db.query(
                        'UPDATE product_variants SET name = $1, value = $2, price_modifier = $3, stock_quantity = $4, image_url = $5, color = $6, size = $7, sku = $8, stock_id = $9 WHERE id = $10',
                        ['Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku, v.id]
                    );
                } else {
                    await db.query(
                        'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                        [id, 'Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku]
                    );
                }
            }
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
                const r = await db.query(
                    'DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING id',
                    [uuidList]
                );
                return { deleted: r.rows.length };
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
                    'UPDATE products SET is_active = true, updated_at = NOW() WHERE id = ANY($1::uuid[]) RETURNING id',
                    [uuidList]
                );
                return { updated: r.rows.length, is_active: true };
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
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
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
exports.getNewArrivals = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 8');
        formatResponse(res, 200, true, 'New arrivals fetched', result.rows);
    } catch (error) { next(error); }
};

exports.getBestSellers = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE is_active = true ORDER BY ratings_count DESC LIMIT 8');
        formatResponse(res, 200, true, 'Best sellers fetched', result.rows);
    } catch (error) { next(error); }
};

exports.getRelatedProducts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await db.query('SELECT category_id FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) return formatResponse(res, 404, false, 'Product not found');
        
        const result = await db.query('SELECT * FROM products WHERE category_id = $1 AND id != $2 LIMIT 4', [product.rows[0].category_id, id]);
        formatResponse(res, 200, true, 'Related products fetched', result.rows);
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
            ? `p.id, p.name, p.slug, p.sku, p.price, p.discount_price, p.stock_quantity, p.is_active, p.is_featured, p.thumbnail, p.category_id, p.brand_id, p.created_at`
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
