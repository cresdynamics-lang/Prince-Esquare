const { formatResponse } = require('../utils/responseFormatter');
const mpesaService = require('../services/mpesaService');
const db = require('../config/db');

exports.stkPush = async (req, res, next) => {
    try {
        const { amount, phoneNumber, order_id } = req.body;
        const userId = req.user.id;

        if (order_id) {
            const own = await db.query('SELECT id FROM orders WHERE id = $1 AND user_id = $2', [order_id, userId]);
            if (own.rows.length === 0) {
                return formatResponse(res, 404, false, 'Order not found');
            }
        }

        const result = await mpesaService.stkPush(amount, phoneNumber);

        if (order_id) {
            await db.query(
                "UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = $1 AND user_id = $2",
                [order_id, userId]
            );
        }

        formatResponse(res, 200, true, 'STK push initiated', { ...result, order_id });
    } catch (error) {
        next(error);
    }
};

exports.callback = async (req, res, next) => {
    try {
        console.log('M-Pesa Callback received:', req.body);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        next(error);
    }
};

exports.status = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Payment status fetched', { status: 'Success' });
    } catch (error) {
        next(error);
    }
};

exports.history = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        formatResponse(res, 200, true, 'Payment history fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.refund = async (req, res, next) => {
    try {
        const { id } = req.body;
        // Logic for refunding...
        await db.query("UPDATE payments SET status = 'refunded' WHERE id = $1", [id]);
        formatResponse(res, 200, true, 'Refund processed');
    } catch (error) {
        next(error);
    }
};

exports.adminGetPayments = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT p.*, u.name as customer_name, o.id as order_ref
            FROM payments p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN orders o ON p.order_id = o.id
            ORDER BY p.created_at DESC
        `);
        formatResponse(res, 200, true, 'All payments fetched', result.rows);
    } catch (error) {
        next(error);
    }
};
