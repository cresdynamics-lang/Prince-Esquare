const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.subscribe = async (req, res, next) => {
    try {
        const { email } = req.body;
        await db.query('INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING', [email]);
        formatResponse(res, 201, true, 'Subscribed successfully');
    } catch (error) {
        next(error);
    }
};

exports.unsubscribe = async (req, res, next) => {
    try {
        const { email } = req.body;
        await db.query('DELETE FROM newsletter_subscribers WHERE email = $1', [email]);
        formatResponse(res, 200, true, 'Unsubscribed successfully');
    } catch (error) {
        next(error);
    }
};

exports.adminGetSubscribers = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
        formatResponse(res, 200, true, 'Subscribers fetched', result.rows);
    } catch (error) {
        next(error);
    }
};
