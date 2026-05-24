const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// @desc    Get all brands
// @route   GET /api/brands
exports.getBrands = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM brands ORDER BY name ASC');
        formatResponse(res, 200, true, 'Brands fetched successfully', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured brands
// @route   GET /api/brands/featured
exports.getFeaturedBrands = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM brands WHERE is_featured = true LIMIT 10');
        formatResponse(res, 200, true, 'Featured brands fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Get brand by slug
// @route   GET /api/brands/:slug
exports.getBrandBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const result = await db.query('SELECT * FROM brands WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Brand not found');
        }

        formatResponse(res, 200, true, 'Brand details fetched', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Create brand
// @route   POST /api/admin/brands
exports.createBrand = async (req, res, next) => {
    try {
        const { name, slug, logo, description, is_featured } = req.body;
        const result = await db.query(
            'INSERT INTO brands (name, slug, logo, description, is_featured) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, slug, logo || null, description, is_featured || false]
        );
        formatResponse(res, 201, true, 'Brand created successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Update brand
// @route   PUT /api/admin/brands/:id
exports.updateBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, logo, description, is_featured } = req.body;
        const result = await db.query(
            'UPDATE brands SET name = $1, slug = $2, logo = $3, description = $4, is_featured = $5 WHERE id = $6 RETURNING *',
            [name, slug, logo || null, description, is_featured || false, id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Brand not found');
        }

        formatResponse(res, 200, true, 'Brand updated successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Delete brand
// @route   DELETE /api/admin/brands/:id
exports.deleteBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM brands WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Brand not found');
        }

        formatResponse(res, 200, true, 'Brand deleted successfully');
    } catch (error) {
        next(error);
    }
};
