const { formatResponse } = require('../utils/responseFormatter');
const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return formatResponse(res, 401, false, 'Not authorized to access this route');
    }

    try {
        const decoded = verifyToken(token);
        const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
        
        if (result.rows.length === 0) {
            return formatResponse(res, 401, false, 'User no longer exists');
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        return formatResponse(res, 401, false, 'Not authorized, token failed');
    }
};

exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return formatResponse(res, 403, false, 'Access denied. Admin only.');
    }
};
