const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.getCustomers = async (req, res, next) => {
    const { role = 'customer' } = req.query;
    try {
        const result = await db.query(
            `SELECT 
                u.id, u.name, u.email, u.avatar, u.role, u.is_verified, u.created_at,
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
            'SELECT id, name, email, avatar, is_verified, created_at FROM users WHERE id = $1',
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
    const { is_verified } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, is_verified',
            [is_verified, id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Customer not found');
        }

        formatResponse(res, 200, true, 'Customer status updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.createStaff = async (req, res, next) => {
    const { name, email, password, permissions = [] } = req.body;
    try {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (name, email, password, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, permissions',
            [name, email, hashedPassword, 'staff', JSON.stringify(permissions)]
        );

        formatResponse(res, 201, true, 'Staff created successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateStaffPermissions = async (req, res, next) => {
    const { id } = req.params;
    const { permissions } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET permissions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING id, name, permissions',
            [JSON.stringify(permissions), id, 'staff']
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Staff not found');
        }

        formatResponse(res, 200, true, 'Staff permissions updated', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteStaff = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id, name',
            [id, 'staff']
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Staff not found');
        }

        formatResponse(res, 200, true, 'Staff deleted successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

