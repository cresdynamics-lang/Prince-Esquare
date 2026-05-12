const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.getActiveBanners = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM banners WHERE is_active = true ORDER BY created_at DESC');
        formatResponse(res, 200, true, 'Active banners fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getHomepageData = async (req, res, next) => {
    try {
        const banners = await db.query('SELECT * FROM banners WHERE is_active = true');
        const categories = await db.query('SELECT * FROM categories WHERE is_featured = true LIMIT 6');
        const newArrivals = await db.query('SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 8');
        const bestSellers = await db.query('SELECT * FROM products WHERE is_active = true ORDER BY ratings_count DESC LIMIT 8');

        formatResponse(res, 200, true, 'Homepage data fetched', {
            banners: banners.rows,
            featuredCategories: categories.rows,
            newArrivals: newArrivals.rows,
            bestSellers: bestSellers.rows
        });
    } catch (error) {
        next(error);
    }
};

exports.adminGetBanners = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM banners ORDER BY created_at DESC');
        formatResponse(res, 200, true, 'All banners fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.createBanner = async (req, res, next) => {
    try {
        const { title, subtitle, image, link, position, is_active } = req.body;
        const result = await db.query(
            'INSERT INTO banners (title, subtitle, image, link, position, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, subtitle, image, link, position, is_active]
        );
        formatResponse(res, 201, true, 'Banner created', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, subtitle, image, link, position, is_active } = req.body;
        const result = await db.query(
            'UPDATE banners SET title = $1, subtitle = $2, image = $3, link = $4, position = $5, is_active = $6 WHERE id = $7 RETURNING *',
            [title, subtitle, image, link, position, is_active, id]
        );
        formatResponse(res, 200, true, 'Banner updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM banners WHERE id = $1', [id]);
        formatResponse(res, 200, true, 'Banner deleted');
    } catch (error) {
        next(error);
    }
};
