const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
exports.getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT w.*, p.name, p.price, p.thumbnail, p.slug ' +
            'FROM wishlist w ' +
            'JOIN products p ON w.product_id = p.id ' +
            'WHERE w.user_id = $1',
            [userId]
        );

        formatResponse(res, 200, true, 'Wishlist fetched successfully', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist
exports.addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        const result = await db.query(
            'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *',
            [userId, product_id]
        );

        formatResponse(res, 201, true, 'Item added to wishlist', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const result = await db.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id', [userId, productId]);

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Item not found in wishlist');
        }

        formatResponse(res, 200, true, 'Item removed from wishlist');
    } catch (error) {
        next(error);
    }
};

// @desc    Move item from wishlist to cart
// @route   POST /api/wishlist/move-to-cart
exports.moveToCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        // Start transaction
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            // Add to cart
            await client.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, 1) ' +
                'ON CONFLICT (user_id, product_id, variant_id) DO UPDATE SET quantity = cart_items.quantity + 1',
                [userId, product_id]
            );

            // Remove from wishlist
            await client.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [userId, product_id]);

            await client.query('COMMIT');
            formatResponse(res, 200, true, 'Item moved to cart');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
};
