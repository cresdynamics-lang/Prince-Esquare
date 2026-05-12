const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// @desc    Create new order
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { shipping_address, billing_address, payment_method, coupon_id } = req.body;

        // 1. Get cart items
        const cartItems = await db.query(
            'SELECT ci.*, p.price, v.price_modifier ' +
            'FROM cart_items ci ' +
            'JOIN products p ON ci.product_id = p.id ' +
            'LEFT JOIN product_variants v ON ci.variant_id = v.id ' +
            'WHERE ci.user_id = $1',
            [userId]
        );

        if (cartItems.rows.length === 0) {
            return formatResponse(res, 400, false, 'Cart is empty');
        }

        // 2. Calculate totals
        let subtotal = 0;
        cartItems.rows.forEach(item => {
            const price = parseFloat(item.price) + parseFloat(item.price_modifier || 0);
            subtotal += price * item.quantity;
        });

        const tax = subtotal * 0.16; // 16% VAT placeholder
        const shipping = 250; // Flat rate placeholder
        const total = subtotal + tax + shipping;

        // 3. Start transaction
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 4. Create order
            const orderResult = await client.query(
                'INSERT INTO orders (user_id, total_amount, tax_amount, shipping_amount, payment_method, shipping_address, billing_address, coupon_id) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [userId, total, tax, shipping, payment_method, JSON.stringify(shipping_address), JSON.stringify(billing_address), coupon_id]
            );
            const order = orderResult.rows[0];

            // 5. Create order items
            for (const item of cartItems.rows) {
                const price = parseFloat(item.price) + parseFloat(item.price_modifier || 0);
                await client.query(
                    'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) VALUES ($1, $2, $3, $4, $5)',
                    [order.id, item.product_id, item.variant_id, item.quantity, price]
                );
            }

            // 6. Clear cart
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

            await client.query('COMMIT');
            formatResponse(res, 201, true, 'Order created successfully', order);
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

// @desc    Get my orders
// @route   GET /api/orders/my-orders
exports.getMyOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        formatResponse(res, 200, true, 'Orders fetched successfully', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Get order details
// @route   GET /api/orders/:id
exports.getOrderDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const orderResult = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
        if (orderResult.rows.length === 0) return formatResponse(res, 404, false, 'Order not found');

        const order = orderResult.rows[0];
        const itemsResult = await db.query(
            'SELECT oi.*, p.name, p.thumbnail FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
            [id]
        );
        order.items = itemsResult.rows;

        formatResponse(res, 200, true, 'Order details fetched', order);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Get all orders
// @route   GET /api/admin/orders
exports.adminGetOrders = async (req, res, next) => {
    try {
        const result = await db.query('SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
        formatResponse(res, 200, true, 'All orders fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Update order status
// @route   PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await db.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) return formatResponse(res, 404, false, 'Order not found');
        formatResponse(res, 200, true, 'Order status updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// Placeholders for remaining admin order methods
exports.cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query("UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending' RETURNING *", [id]);
        if (result.rows.length === 0) return formatResponse(res, 400, false, 'Order cannot be cancelled');
        formatResponse(res, 200, true, 'Order cancelled');
    } catch (error) { next(error); }
};

exports.trackOrder = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Tracking info placeholder'); } catch (error) { next(error); }
};

exports.adminGetOrderDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderResult = await db.query('SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1', [id]);
        if (orderResult.rows.length === 0) return formatResponse(res, 404, false, 'Order not found');
        const order = orderResult.rows[0];
        const itemsResult = await db.query('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1', [id]);
        order.items = itemsResult.rows;
        formatResponse(res, 200, true, 'Order details fetched', order);
    } catch (error) { next(error); }
};

exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;
        await db.query('UPDATE orders SET payment_status = $1 WHERE id = $2', [payment_status, id]);
        formatResponse(res, 200, true, 'Payment status updated');
    } catch (error) { next(error); }
};

exports.refundOrder = async (req, res, next) => {
    try { formatResponse(res, 200, true, 'Refund processed placeholder'); } catch (error) { next(error); }
};
