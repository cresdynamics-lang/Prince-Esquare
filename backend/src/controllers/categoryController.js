const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// @desc    Get all categories
// @route   GET /api/categories
exports.getCategories = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
        formatResponse(res, 200, true, 'Categories fetched successfully', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured categories
// @route   GET /api/categories/featured
exports.getFeaturedCategories = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM categories WHERE is_featured = true LIMIT 6');
        formatResponse(res, 200, true, 'Featured categories fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Get category by slug
// @route   GET /api/categories/:slug
exports.getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const result = await db.query('SELECT * FROM categories WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Category not found');
        }

        formatResponse(res, 200, true, 'Category details fetched', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Create category
// @route   POST /api/admin/categories
exports.createCategory = async (req, res, next) => {
    try {
        const { name, slug, description, image, parent_id, is_featured } = req.body;
        const result = await db.query(
            'INSERT INTO categories (name, slug, description, image, parent_id, is_featured) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, slug, description, image, parent_id, is_featured]
        );
        formatResponse(res, 201, true, 'Category created successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Update category
// @route   PUT /api/admin/categories/:id
exports.updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image, parent_id, is_featured } = req.body;
        const result = await db.query(
            'UPDATE categories SET name = $1, slug = $2, description = $3, image = $4, parent_id = $5, is_featured = $6 WHERE id = $7 RETURNING *',
            [name, slug, description, image, parent_id, is_featured, id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Category not found');
        }

        formatResponse(res, 200, true, 'Category updated successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Delete category
// @route   DELETE /api/admin/categories/:id
exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Category not found');
        }

        formatResponse(res, 200, true, 'Category deleted successfully');
    } catch (error) {
        next(error);
    }
};
