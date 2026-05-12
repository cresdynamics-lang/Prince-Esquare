const db = require('../config/db');

const findByEmail = async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const create = async (userData) => {
    const { name, email, password, role } = userData;
    const result = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, password, role || 'customer']
    );
    return result.rows[0];
};

module.exports = {
    findByEmail,
    create
};
