const { formatResponse } = require('../utils/responseFormatter');
const { applyProductImageOptimization } = require('../utils/cloudinaryImage');
const db = require('../config/db');

const toStockIdPart = (value) => String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const getVariantStockId = (productKey, variant) => {
    const provided = toStockIdPart(variant.stock_id);
    if (provided) return provided;

    const productPart = toStockIdPart(productKey) || 'PRODUCT';
    const colorPart = toStockIdPart(variant.color) || 'DEFAULT';
    return `${productPart}-${colorPart}`;
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

        const products = result.rows.map((p) => applyProductImageOptimization(p));
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
            'SELECT p.*, c.name as category_name, b.name as brand_name FROM products p ' +
            'LEFT JOIN categories c ON p.category_id = c.id ' +
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
        product.variants = variantsResult.rows.map(v => ({
            id: v.id,
            name: v.name,
            value: v.value,
            stock: v.stock_quantity,
            price_modifier: v.price_modifier,
            image_url: v.image_url,
            color: v.color,
            size: v.size,
            stock_id: v.stock_id
        }));

        formatResponse(res, 200, true, 'Product details fetched', applyProductImageOptimization(product));
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Create product
// @route   POST /api/admin/products
exports.createProduct = async (req, res, next) => {
    try {
        const { name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, variants } = req.body;
        
        const result = await db.query(
            'INSERT INTO products (name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [name, slug, description || null, price || 0, discount_price || null, category_id || null, brand_id || null, stock_quantity || 0, is_featured || false, thumbnail || null, JSON.stringify(images || [])]
        );

        const productId = result.rows[0].id;
        
        // Save variants
        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                const value = `${v.size || ''} / ${v.color || ''}`;
                const stockId = getVariantStockId(slug || name, v);
                await db.query(
                    'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [productId, 'Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, stockId]
                );
            }
        }

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
        const { name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images, variants } = req.body;

        const result = await db.query(
            'UPDATE products SET name = $1, slug = $2, description = $3, price = $4, discount_price = $5, category_id = $6, brand_id = $7, ' +
            'stock_quantity = $8, is_featured = $9, is_active = $10, thumbnail = $11, images = $12 WHERE id = $13 RETURNING *',
            [name, slug, description || null, price || 0, discount_price || null, category_id || null, brand_id || null, stock_quantity || 0, is_featured || false, is_active !== undefined ? is_active : true, thumbnail || null, JSON.stringify(images || []), id]
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
                const stockId = getVariantStockId(slug || name, v);
                if (v.id) {
                    await db.query(
                        'UPDATE product_variants SET name = $1, value = $2, price_modifier = $3, stock_quantity = $4, image_url = $5, color = $6, size = $7, stock_id = $8 WHERE id = $9',
                        ['Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, stockId, v.id]
                    );
                } else {
                    await db.query(
                        'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                        [id, 'Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, stockId]
                    );
                }
            }
        }

        formatResponse(res, 200, true, 'Product updated successfully', result.rows[0]);
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
        const result = await db.query(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC'
        );
        const products = result.rows;

        if (products.length > 0) {
            const productIds = products.map((p) => p.id);
            const variantsResult = await db.query(
                'SELECT * FROM product_variants WHERE product_id = ANY($1::uuid[]) ORDER BY color, size',
                [productIds]
            );
            const variantsByProduct = {};
            for (const v of variantsResult.rows) {
                if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
                variantsByProduct[v.product_id].push({
                    id: v.id,
                    color: v.color,
                    size: v.size,
                    stock: v.stock_quantity,
                    price_override: v.price_modifier,
                    image_url: v.image_url,
                    stock_id: v.stock_id,
                });
            }
            for (const p of products) {
                p.variants = variantsByProduct[p.id] || [];
                applyProductImageOptimization(p);
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
