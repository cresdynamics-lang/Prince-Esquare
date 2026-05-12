const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// @desc    Get user's cart
// @route   GET /api/cart
exports.getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT ci.*, p.name, p.price, p.thumbnail, p.slug, v.name as variant_name, v.value as variant_value, v.price_modifier ' +
            'FROM cart_items ci ' +
            'JOIN products p ON ci.product_id = p.id ' +
            'LEFT JOIN product_variants v ON ci.variant_id = v.id ' +
            'WHERE ci.user_id = $1',
            [userId]
        );

        formatResponse(res, 200, true, 'Cart fetched successfully', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
exports.addItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { product_id, variant_id, quantity } = req.body;

        // Check if item already in cart
        const existing = await db.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))',
            [userId, product_id, variant_id]
        );

        if (existing.rows.length > 0) {
            const result = await db.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
                [quantity, existing.rows[0].id]
            );
            return formatResponse(res, 200, true, 'Cart item quantity updated', result.rows[0]);
        }

        const result = await db.query(
            'INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, product_id, variant_id, quantity]
        );

        formatResponse(res, 201, true, 'Item added to cart', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Update item quantity
// @route   PATCH /api/cart/items/:itemId
exports.updateQuantity = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        const result = await db.query(
            'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [quantity, itemId, userId]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Cart item not found');
        }

        formatResponse(res, 200, true, 'Quantity updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
exports.removeItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        const result = await db.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id', [itemId, userId]);

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Cart item not found');
        }

        formatResponse(res, 200, true, 'Item removed from cart');
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
exports.clearCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        formatResponse(res, 200, true, 'Cart cleared');
    } catch (error) {
        next(error);
    }
};

// Placeholders for coupon logic
exports.applyCoupon = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Coupon applied logic placeholder'); } catch (error) { next(error); }
};

exports.removeCoupon = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Coupon removed'); } catch (error) { next(error); }
};
