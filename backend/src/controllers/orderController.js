const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { normalizeVariantId } = require('../services/orderStock');
const { createOrderFromItems, cartRowsToItems } = require('../services/orderService');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const upsertCartLine = async (userId, line) => {
    const productId = line.product_id || line.productId;
    if (!productId || !UUID_RE.test(String(productId))) return;

    const variantId = normalizeVariantId(line.variant_id || line.variantId);
    const qty = Math.max(1, parseInt(line.quantity, 10) || 1);
    const size = line.size_label != null && line.size_label !== ''
        ? String(line.size_label)
        : (line.sizeLabel != null && line.sizeLabel !== '' ? String(line.sizeLabel) : null);

    const existing = await db.query(
        'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 ' +
        'AND ((variant_id IS NULL AND $3::uuid IS NULL) OR variant_id = $3::uuid) ' +
        'AND COALESCE(size_label, \'\') = COALESCE($4, \'\')',
        [userId, productId, variantId, size]
    );

    if (existing.rows.length > 0) {
        await db.query(
            'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
            [qty, existing.rows[0].id]
        );
        return;
    }

    await db.query(
        'INSERT INTO cart_items (user_id, product_id, variant_id, quantity, size_label) VALUES ($1, $2, $3, $4, $5)',
        [userId, productId, variantId, qty, size]
    );
};

const fetchCartItems = (userId) => db.query(
    'SELECT ci.*, p.price, v.price_modifier ' +
    'FROM cart_items ci ' +
    'JOIN products p ON ci.product_id = p.id ' +
    'LEFT JOIN product_variants v ON ci.variant_id = v.id ' +
    'WHERE ci.user_id = $1',
    [userId]
);

const parseShippingEmail = (order) => {
    const addr = order.shipping_address;
    const parsed = typeof addr === 'string' ? (() => { try { return JSON.parse(addr); } catch { return {}; } })() : (addr || {});
    return (parsed.email || '').trim().toLowerCase();
};

const guestNameSql = `COALESCE(
  u.name,
  NULLIF(TRIM(COALESCE(o.shipping_address->>'first_name', '') || ' ' || COALESCE(o.shipping_address->>'last_name', '')), '')
)`;

// @desc    Create new order (logged-in customer)
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { shipping_address, billing_address, payment_method, coupon_id, items } = req.body;
        const couponId = coupon_id || null;

        let cartItems = await fetchCartItems(userId);

        if (cartItems.rows.length === 0 && Array.isArray(items) && items.length > 0) {
            for (const line of items) {
                await upsertCartLine(userId, line);
            }
            cartItems = await fetchCartItems(userId);
        }

        const payloadItems = cartItems.rows.length > 0
            ? cartRowsToItems(cartItems.rows)
            : (Array.isArray(items) ? items : []);

        if (!payloadItems.length) {
            return formatResponse(res, 400, false, 'Cart is empty');
        }

        const order = await createOrderFromItems({
            userId,
            items: payloadItems,
            shipping_address,
            billing_address,
            payment_method,
            couponId,
            clearUserCart: true,
        });

        formatResponse(res, 201, true, 'Order created successfully', order);
    } catch (error) {
        if (error.statusCode === 400) {
            return formatResponse(res, 400, false, error.message);
        }
        next(error);
    }
};

// @desc    Guest checkout — no account required
// @route   POST /api/orders/guest
exports.createGuestOrder = async (req, res, next) => {
    try {
        const { shipping_address, billing_address, payment_method, items } = req.body;

        if (!shipping_address?.email || !shipping_address?.phone || !shipping_address?.line1) {
            return formatResponse(res, 400, false, 'Shipping name, email, phone, and address are required');
        }
        if (!Array.isArray(items) || items.length === 0) {
            return formatResponse(res, 400, false, 'No items in order');
        }

        const order = await createOrderFromItems({
            userId: null,
            items,
            shipping_address,
            billing_address,
            payment_method: payment_method || 'mpesa',
            clearUserCart: false,
        });

        formatResponse(res, 201, true, 'Order created successfully', order);
    } catch (error) {
        if (error.statusCode === 400) {
            return formatResponse(res, 400, false, error.message);
        }
        next(error);
    }
};

// @desc    Checkout/payment page — guest uses email query to verify
// @route   GET /api/orders/checkout/:id
exports.getCheckoutOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const email = (req.query.email || '').trim().toLowerCase();

        const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) {
            return formatResponse(res, 404, false, 'Order not found');
        }

        const order = orderResult.rows[0];

        if (req.user?.id) {
            if (order.user_id && order.user_id !== req.user.id) {
                return formatResponse(res, 403, false, 'Not your order');
            }
        } else {
            const orderEmail = parseShippingEmail(order);
            if (!email || email !== orderEmail) {
                return formatResponse(res, 403, false, 'Email required to view this order');
            }
        }

        formatResponse(res, 200, true, 'Order fetched', {
            id: order.id,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            status: order.status,
            created_at: order.created_at,
        });
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
            'SELECT oi.*, p.name, p.sku AS product_sku, p.thumbnail, v.name as variant_name, v.value as variant_value, ' +
            'COALESCE(v.sku, v.stock_id) AS variant_sku ' +
            'FROM order_items oi JOIN products p ON oi.product_id = p.id ' +
            'LEFT JOIN product_variants v ON oi.variant_id = v.id WHERE oi.order_id = $1',
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
        const clauses = ['1=1'];
        const params = [];
        let i = 1;

        if (req.query.from) {
            clauses.push(`o.created_at >= $${i++}`);
            params.push(req.query.from);
        }
        if (req.query.to) {
            const to = new Date(req.query.to);
            if (!Number.isNaN(to.getTime())) {
                to.setHours(23, 59, 59, 999);
                clauses.push(`o.created_at <= $${i++}`);
                params.push(to.toISOString());
            }
        }

        const result = await db.query(
            `SELECT o.*,
              ${guestNameSql} AS customer_name,
              COALESCE(u.email, o.shipping_address->>'email') AS customer_email
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE ${clauses.join(' AND ')}
             ORDER BY o.created_at DESC`,
            params
        );

        const orders = result.rows;
        const includeItems = req.query.include_items === '1' || req.query.include_items === 'true';
        if (includeItems && orders.length > 0) {
            const orderIds = orders.map((o) => o.id);
            const itemsResult = await db.query(
                'SELECT oi.*, p.name, p.sku AS product_sku, COALESCE(v.sku, v.stock_id) AS variant_sku, v.size AS variant_size ' +
                'FROM order_items oi JOIN products p ON oi.product_id = p.id ' +
                'LEFT JOIN product_variants v ON oi.variant_id = v.id WHERE oi.order_id = ANY($1::uuid[])',
                [orderIds]
            );
            const itemsByOrder = {};
            for (const item of itemsResult.rows) {
                if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
                itemsByOrder[item.order_id].push(item);
            }
            for (const order of orders) {
                order.items = itemsByOrder[order.id] || [];
            }
        }

        formatResponse(res, 200, true, 'All orders fetched', orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Export orders CSV
// @route   GET /api/admin/orders/export
exports.adminExportOrders = async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT o.id, o.created_at, o.status, o.payment_status, o.payment_method, o.total_amount,
              ${guestNameSql} AS customer_name,
              COALESCE(u.email, o.shipping_address->>'email') AS customer_email
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );

        const header = 'Order ID,Date,Customer,Email,Total,Status,Payment Status,Payment Method';
        const rows = result.rows.map((o) => {
            const cols = [
                o.id,
                new Date(o.created_at).toISOString(),
                (o.customer_name || 'Guest').replace(/,/g, ' '),
                (o.customer_email || '').replace(/,/g, ' '),
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
            ];
            return cols.join(',');
        });

        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
        res.send(csv);
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
        const result = await db.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return formatResponse(res, 404, false, 'Order not found');
        formatResponse(res, 200, true, 'Order status updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status = 'pending' RETURNING *",
            [id]
        );
        if (result.rows.length === 0) return formatResponse(res, 400, false, 'Order cannot be cancelled');
        formatResponse(res, 200, true, 'Order cancelled');
    } catch (error) { next(error); }
};

exports.adminCancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderR = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (!orderR.rows.length) return formatResponse(res, 404, false, 'Order not found');

        const order = orderR.rows[0];
        if (['delivered', 'cancelled'].includes(order.status)) {
            return formatResponse(res, 400, false, 'Order cannot be cancelled');
        }

        if (order.payment_status === 'paid') {
            const { restoreEcommerceStock } = require('../services/orderStock');
            await restoreEcommerceStock(id);
        }

        await db.query(
            "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
            [id]
        );
        formatResponse(res, 200, true, 'Order cancelled');
    } catch (error) {
        next(error);
    }
};

exports.trackOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const r = await db.query(
            'SELECT id, status, payment_status, tracking_number, created_at, updated_at FROM orders WHERE id = $1',
            [id]
        );
        if (!r.rows.length) return formatResponse(res, 404, false, 'Order not found');
        formatResponse(res, 200, true, 'Tracking info', r.rows[0]);
    } catch (error) { next(error); }
};

exports.adminGetOrderDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderResult = await db.query(
            `SELECT o.*,
              ${guestNameSql} AS customer_name,
              COALESCE(u.email, o.shipping_address->>'email') AS customer_email
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = $1`,
            [id]
        );
        if (orderResult.rows.length === 0) return formatResponse(res, 404, false, 'Order not found');
        const order = orderResult.rows[0];
        const itemsResult = await db.query(
            'SELECT oi.*, p.name, p.sku AS product_sku, COALESCE(v.sku, v.stock_id) AS variant_sku, v.size AS variant_size ' +
            'FROM order_items oi JOIN products p ON oi.product_id = p.id ' +
            'LEFT JOIN product_variants v ON oi.variant_id = v.id WHERE oi.order_id = $1',
            [id]
        );
        order.items = itemsResult.rows;
        formatResponse(res, 200, true, 'Order details fetched', order);
    } catch (error) { next(error); }
};

exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const prevR = await db.query('SELECT payment_status FROM orders WHERE id = $1', [id]);
        if (!prevR.rows.length) return formatResponse(res, 404, false, 'Order not found');
        const wasPaid = prevR.rows[0].payment_status === 'paid';

        await db.query(
            'UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2',
            [payment_status, id]
        );

        if (payment_status === 'paid' && !wasPaid) {
            const { deductEcommerceStock } = require('../services/orderStock');
            await deductEcommerceStock(id);
            try {
                const { syncOrderToPos } = require('../services/onlineOrderPosSync');
                await syncOrderToPos(id);
            } catch (e) {
                console.error('POS sync after payment:', e.message);
            }
        }

        if (payment_status === 'refunded' && wasPaid) {
            const { restoreEcommerceStock } = require('../services/orderStock');
            await restoreEcommerceStock(id);
            await db.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [id]);
        }

        formatResponse(res, 200, true, 'Payment status updated');
    } catch (error) { next(error); }
};

exports.refundOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderR = await db.query('SELECT payment_status, status FROM orders WHERE id = $1', [id]);
        if (!orderR.rows.length) return formatResponse(res, 404, false, 'Order not found');

        const order = orderR.rows[0];
        if (order.payment_status !== 'paid') {
            return formatResponse(res, 400, false, 'Only paid orders can be refunded');
        }

        const { restoreEcommerceStock } = require('../services/orderStock');
        await restoreEcommerceStock(id);

        await db.query(
            "UPDATE orders SET payment_status = 'refunded', status = 'cancelled', updated_at = NOW() WHERE id = $1",
            [id]
        );

        formatResponse(res, 200, true, 'Refund processed and stock restored');
    } catch (error) { next(error); }
};
