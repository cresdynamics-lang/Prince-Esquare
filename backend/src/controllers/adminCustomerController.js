const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.getCustomers = async (req, res, next) => {
    const { role = 'customer' } = req.query;
    try {
        const result = await db.query(
            `SELECT 
                u.id, u.name, u.email, u.phone, u.avatar, u.role, u.is_verified, u.is_active, u.created_at,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND status != 'cancelled') as total_spent
             FROM users u
             WHERE u.role = $1 
             ORDER BY u.created_at DESC`,
            [role]
        );
        formatResponse(res, 200, true, `All ${role}s fetched`, result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getCustomerDetail = async (req, res, next) => {
    const { id } = req.params;
    try {
        const userResult = await db.query(
            'SELECT id, name, email, phone, avatar, is_verified, is_active, created_at FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return formatResponse(res, 404, false, 'Customer not found');
        }

        const ordersResult = await db.query(
            'SELECT id, total_amount, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [id]
        );

        const customer = {
            ...userResult.rows[0],
            orders: ordersResult.rows
        };

        formatResponse(res, 200, true, 'Customer details fetched', customer);
    } catch (error) {
        next(error);
    }
};

exports.updateCustomerStatus = async (req, res, next) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Customer not found');
        }

        formatResponse(res, 200, true, 'Customer status updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

