const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.getSettings = async (req, res, next) => {
    try {
        const result = await db.query('SELECT key, value FROM settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        formatResponse(res, 200, true, 'Settings fetched', settings);
    } catch (error) {
        next(error);
    }
};

exports.updateSettings = async (req, res, next) => {
    const settings = req.body; // { key: value, ... }
    try {
        const queries = Object.entries(settings).map(([key, value]) => {
            return db.query(
                'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
                [key, value]
            );
        });
        await Promise.all(queries);
        formatResponse(res, 200, true, 'Settings updated successfully');
    } catch (error) {
        next(error);
    }
};
