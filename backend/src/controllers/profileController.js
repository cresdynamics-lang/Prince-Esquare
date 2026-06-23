const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const publicUserFields = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    is_active: user.is_active,
    default_shipping_address: user.default_shipping_address || {},
    created_at: user.created_at,
    accountType: user.accountType || 'user',
});

exports.getProfile = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, phone, avatar, role, is_active, default_shipping_address, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!result.rows.length) return formatResponse(res, 404, false, 'Profile not found');
        formatResponse(res, 200, true, 'Profile fetched', { user: publicUserFields(result.rows[0]) });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, default_shipping_address } = req.body;
        const cleanName = String(name || '').trim();
        const cleanPhone = String(phone || '').trim();

        if (!cleanName) return formatResponse(res, 400, false, 'Full name is required');

        const address = default_shipping_address && typeof default_shipping_address === 'object'
            ? default_shipping_address
            : {};

        const result = await db.query(
            `UPDATE users
             SET name = $1, phone = $2, default_shipping_address = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING id, name, email, phone, avatar, role, is_active, default_shipping_address, created_at`,
            [cleanName, cleanPhone || null, JSON.stringify(address), req.user.id]
        );

        formatResponse(res, 200, true, 'Profile updated', { user: publicUserFields(result.rows[0]) });
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password || String(new_password).length < 6) {
            return formatResponse(res, 400, false, 'Current password and a new password of at least 6 characters are required');
        }

        const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        if (!result.rows.length) return formatResponse(res, 404, false, 'Profile not found');

        const matches = await bcrypt.compare(current_password, result.rows[0].password);
        if (!matches) return formatResponse(res, 400, false, 'Current password is incorrect');

        const hash = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
        formatResponse(res, 200, true, 'Password changed');
    } catch (error) {
        next(error);
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Avatar uploaded');
    } catch (error) {
        next(error);
    }
};

exports.getAddresses = async (req, res, next) => {
    try {
        const result = await db.query('SELECT default_shipping_address FROM users WHERE id = $1', [req.user.id]);
        const address = result.rows[0]?.default_shipping_address || {};
        formatResponse(res, 200, true, 'Addresses fetched', address.line1 ? [{ ...address, id: 'default', is_default: true }] : []);
    } catch (error) {
        next(error);
    }
};

exports.addAddress = async (req, res, next) => {
    try {
        const address = req.body && typeof req.body === 'object' ? req.body : {};
        await db.query('UPDATE users SET default_shipping_address = $1, updated_at = NOW() WHERE id = $2', [
            JSON.stringify(address),
            req.user.id,
        ]);
        formatResponse(res, 201, true, 'Address added', { ...address, id: 'default', is_default: true });
    } catch (error) {
        next(error);
    }
};

exports.updateAddress = async (req, res, next) => {
    try {
        const address = req.body && typeof req.body === 'object' ? req.body : {};
        await db.query('UPDATE users SET default_shipping_address = $1, updated_at = NOW() WHERE id = $2', [
            JSON.stringify(address),
            req.user.id,
        ]);
        formatResponse(res, 200, true, 'Address updated', { ...address, id: 'default', is_default: true });
    } catch (error) {
        next(error);
    }
};

exports.deleteAddress = async (req, res, next) => {
    try {
        await db.query("UPDATE users SET default_shipping_address = '{}'::jsonb, updated_at = NOW() WHERE id = $1", [req.user.id]);
        formatResponse(res, 200, true, 'Address deleted');
    } catch (error) {
        next(error);
    }
};

exports.setDefaultAddress = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Default address set');
    } catch (error) {
        next(error);
    }
};
