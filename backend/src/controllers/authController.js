const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');

// @desc    Register new customer
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return formatResponse(res, 400, false, 'User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await db.query(
            `INSERT INTO users (name, email, password, role, is_active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING id, name, email, role, COALESCE(is_active, true) AS is_active`,
            [name, email, hashedPassword, 'customer']
        );

        const user = newUser.rows[0];
        const token = signToken({ id: user.id, role: user.role, fullName: user.name, accountType: 'user' });

        formatResponse(res, 201, true, 'User registered successfully', {
            user: { ...user, fullName: user.name },
            token
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Customer login
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return formatResponse(res, 401, false, 'Invalid email or password');
        }

        if (user.is_active === false) {
            return formatResponse(res, 403, false, 'Your account has been suspended. Please contact support.');
        }

        const token = signToken({ id: user.id, role: user.role, fullName: user.name, accountType: 'user' });

        // Remove password from response
        delete user.password;

        formatResponse(res, 200, true, 'Login successful', {
            user: { ...user, fullName: user.name },
            token
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin login
// @route   POST /api/admin/auth/login
exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await db.query("SELECT * FROM users WHERE email = $1 AND role IN ('admin', 'staff')", [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return formatResponse(res, 401, false, 'Invalid credentials');
        }

        const token = signToken({
            id: user.id,
            role: user.role,
            fullName: user.name,
            accountType: 'user',
        });
        delete user.password;

        formatResponse(res, 200, true, 'Admin login successful', {
            admin: { ...user, fullName: user.name, full_name: user.name },
            token
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Invalidate token (Client-side usually, but placeholder here)
exports.logout = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

exports.adminLogout = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Admin logged out successfully');
    } catch (error) {
        next(error);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        // Simple placeholder for refresh logic
        formatResponse(res, 200, true, 'Token refreshed successfully', { token: 'new_jwt_token' });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'If an account exists with that email, a reset link has been sent');
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Password reset successful');
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Email verified successfully');
    } catch (error) {
        next(error);
    }
};
