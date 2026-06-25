const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { normalizeStaffPermissions } = require('../utils/permissions');

exports.getCustomers = async (req, res, next) => {
    const { role = 'customer' } = req.query;
    try {
        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin) {
            if (role !== 'customer') {
                return formatResponse(res, 403, false, 'Only admins can view staff and admin accounts');
            }
            const perms = Array.isArray(req.user.permissions)
                ? req.user.permissions
                : (() => {
                    try {
                        return JSON.parse(req.user.permissions || '[]');
                    } catch {
                        return [];
                    }
                })();
            if (!perms.includes('customers')) {
                return formatResponse(res, 403, false, 'Customer directory access required');
            }
        }

        const result = await db.query(
            `SELECT 
                u.id, u.name, u.email, u.phone, u.avatar, u.role, u.permissions,
                u.is_verified, COALESCE(u.is_active, true) AS is_active, u.created_at,
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
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
        return formatResponse(res, 400, false, 'is_active must be a boolean');
    }
    try {
        const result = await db.query(
            `UPDATE users
             SET is_active = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, name, email, role, COALESCE(is_active, true) AS is_active`,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'User not found');
        }

        formatResponse(res, 200, true, 'Account status updated', result.rows[0]);
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
        const normalizedPermissions = normalizeStaffPermissions(permissions);

        const result = await db.query(
            'INSERT INTO users (name, email, password, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, permissions',
            [name, email, hashedPassword, 'staff', JSON.stringify(normalizedPermissions)]
        );

        const staff = result.rows[0];
        if (normalizedPermissions.includes('pos-terminal')) {
            const { ensurePosProfileForStaffUser } = require('../services/staffPosBridge');
            await ensurePosProfileForStaffUser(staff, password);
        }

        formatResponse(res, 201, true, 'Staff created successfully', staff);
    } catch (error) {
        next(error);
    }
};

exports.createAdmin = async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return formatResponse(res, 400, false, 'Missing required fields');
        }
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, role, COALESCE(is_active, true) AS is_active',
            [name.trim(), email.trim().toLowerCase(), hashedPassword, 'admin']
        );

        formatResponse(res, 201, true, 'Admin created successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateAdmin = async (req, res, next) => {
    const { id } = req.params;
    const { name, email, password, is_active } = req.body;
    try {
        const existing = await db.query('SELECT id, name, email FROM users WHERE id = $1 AND role = $2', [id, 'admin']);
        if (!existing.rows.length) {
            return formatResponse(res, 404, false, 'Admin not found');
        }

        const updates = [];
        const params = [];
        let i = 1;

        if (typeof name === 'string' && name.trim()) {
            updates.push('name = $' + i++);
            params.push(name.trim());
        }
        if (typeof email === 'string' && email.trim()) {
            const nextEmail = email.trim().toLowerCase();
            const emailCheck = await db.query(
                'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1',
                [nextEmail, id]
            );
            if (emailCheck.rows.length) {
                return formatResponse(res, 400, false, 'Email already exists');
            }
            updates.push('email = $' + i++);
            params.push(nextEmail);
        }
        if (typeof password === 'string' && password.trim()) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updates.push('password = $' + i++);
            params.push(hashedPassword);
        }
        if (typeof is_active === 'boolean') {
            updates.push('is_active = $' + i++);
            params.push(is_active);
        }

        if (!updates.length) {
            return formatResponse(res, 400, false, 'Nothing to update');
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const query = 'UPDATE users SET ' + updates.join(', ') + " WHERE id = $" + i + " AND role = 'admin' RETURNING id, name, email, role, COALESCE(is_active, true) AS is_active";
        const result = await db.query(query, params);

        if (!result.rows.length) {
            return formatResponse(res, 404, false, 'Admin not found');
        }

        formatResponse(res, 200, true, 'Admin updated successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};
exports.updateStaffPermissions = async (req, res, next) => {
    const { id } = req.params;
    const { permissions } = req.body;
    try {
        const normalizedPermissions = normalizeStaffPermissions(permissions);
        const result = await db.query(
            'UPDATE users SET permissions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING id, name, email, role, permissions',
            [JSON.stringify(normalizedPermissions), id, 'staff']
        );

        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Staff not found');
        }

        const staff = result.rows[0];
        const profileR = await db.query('SELECT id FROM pos_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [staff.email]);

        if (normalizedPermissions.includes('pos-terminal')) {
            const { ensurePosProfileForStaffUser } = require('../services/staffPosBridge');
            await ensurePosProfileForStaffUser(staff);
            if (profileR.rows[0]) {
                await db.query('UPDATE pos_profiles SET is_active = true WHERE id = $1', [profileR.rows[0].id]);
            }
        } else if (profileR.rows[0]) {
            await db.query(
                `UPDATE pos_shifts SET clock_out = NOW() WHERE seller_id = $1 AND clock_out IS NULL`,
                [profileR.rows[0].id]
            );
            await db.query('UPDATE pos_profiles SET is_active = false WHERE id = $1', [profileR.rows[0].id]);
        }

        formatResponse(res, 200, true, 'Staff permissions updated', staff);
    } catch (error) {
        next(error);
    }
};

exports.updateStaff = async (req, res, next) => {
    const { id } = req.params;
    const { name, permissions } = req.body;
    try {
        const existing = await db.query('SELECT id, name, email FROM users WHERE id = $1 AND role = $2', [id, 'staff']);
        if (!existing.rows.length) {
            return formatResponse(res, 404, false, 'Staff not found');
        }

        const updates = [];
        const params = [];
        let i = 1;

        if (typeof name === 'string' && name.trim()) {
            updates.push(`name = $${i++}`);
            params.push(name.trim());
        }
        if (Array.isArray(permissions)) {
            const normalizedPermissions = normalizeStaffPermissions(permissions);
            updates.push(`permissions = $${i++}`);
            params.push(JSON.stringify(normalizedPermissions));
        }

        if (!updates.length) {
            return formatResponse(res, 400, false, 'Nothing to update');
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} AND role = 'staff'
             RETURNING id, name, email, role, permissions, COALESCE(is_active, true) AS is_active`,
            params
        );

        const staff = result.rows[0];
        if (Array.isArray(permissions)) {
            const normalizedPermissions = normalizeStaffPermissions(permissions);
            const profileR = await db.query('SELECT id FROM pos_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [staff.email]);
            if (normalizedPermissions.includes('pos-terminal')) {
                const { ensurePosProfileForStaffUser } = require('../services/staffPosBridge');
                await ensurePosProfileForStaffUser(staff);
                if (profileR.rows[0]) {
                    await db.query('UPDATE pos_profiles SET is_active = true, full_name = $1 WHERE id = $2', [
                        staff.name,
                        profileR.rows[0].id,
                    ]);
                }
            } else if (profileR.rows[0]) {
                await db.query(
                    `UPDATE pos_shifts SET clock_out = NOW() WHERE seller_id = $1 AND clock_out IS NULL`,
                    [profileR.rows[0].id]
                );
                await db.query('UPDATE pos_profiles SET is_active = false WHERE id = $1', [profileR.rows[0].id]);
            } else if (typeof name === 'string' && name.trim()) {
                await db.query('UPDATE pos_profiles SET full_name = $1 WHERE LOWER(email) = LOWER($2)', [
                    staff.name,
                    staff.email,
                ]);
            }
        } else if (typeof name === 'string' && name.trim()) {
            await db.query('UPDATE pos_profiles SET full_name = $1 WHERE LOWER(email) = LOWER($2)', [
                staff.name,
                staff.email,
            ]);
        }

        formatResponse(res, 200, true, 'Staff updated', staff);
    } catch (error) {
        next(error);
    }
};

exports.deleteStaff = async (req, res, next) => {
    const { id } = req.params;
    try {
        const staffR = await db.query('SELECT id, name, email FROM users WHERE id = $1 AND role = $2', [id, 'staff']);
        if (!staffR.rows.length) {
            return formatResponse(res, 404, false, 'Staff not found');
        }

        const staff = staffR.rows[0];
        const profileR = await db.query('SELECT id FROM pos_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [
            staff.email,
        ]);
        if (profileR.rows[0]) {
            await db.query(
                `UPDATE pos_shifts SET clock_out = NOW() WHERE seller_id = $1 AND clock_out IS NULL`,
                [profileR.rows[0].id]
            );
            await db.query('UPDATE pos_profiles SET is_active = false WHERE id = $1', [profileR.rows[0].id]);
        }

        const result = await db.query('DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id, name', [id, 'staff']);
        formatResponse(res, 200, true, 'Staff deleted successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

