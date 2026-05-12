const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// @desc    Get all products (with filtering, sorting, pagination)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
    try {
        const { category, brand, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT p.*, c.name as category_name, b.name as brand_name FROM products p ';
        query += 'LEFT JOIN categories c ON p.category_id = c.id ';
        query += 'LEFT JOIN brands b ON p.brand_id = b.id WHERE p.is_active = true ';
        
        const params = [];
        let paramCount = 1;

        if (category) {
            query += `AND (c.slug = $${paramCount} OR c.id::text = $${paramCount}) `;
            params.push(category);
            paramCount++;
        }

        if (brand) {
            query += `AND (b.slug = $${paramCount} OR b.id::text = $${paramCount}) `;
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

        formatResponse(res, 200, true, 'Products fetched successfully', {
            products: result.rows,
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
        product.variants = variantsResult.rows;

        formatResponse(res, 200, true, 'Product details fetched', product);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Create product
// @route   POST /api/admin/products
exports.createProduct = async (req, res, next) => {
    try {
        const { name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images } = req.body;
        
        const result = await db.query(
            'INSERT INTO products (name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, thumbnail, JSON.stringify(images || [])]
        );

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
        const { name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images } = req.body;

        const result = await db.query(
            'UPDATE products SET name = $1, slug = $2, description = $3, price = $4, discount_price = $5, category_id = $6, brand_id = $7, ' +
            'stock_quantity = $8, is_featured = $9, is_active = $10, thumbnail = $11, images = $12 WHERE id = $13 RETURNING *',
            [name, slug, description, price, discount_price, category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, JSON.stringify(images), id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Product not found');
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
        const result = await db.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC');
        formatResponse(res, 200, true, 'Admin products fetched', result.rows);
    } catch (error) { next(error); }
};

exports.uploadProductImages = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Upload logic placeholder'); } catch (error) { next(error); }
};

exports.deleteProductImage = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Delete image logic placeholder'); } catch (error) { next(error); }
};
