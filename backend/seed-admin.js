const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        const email = 'manage@prince-esquire.co.ke';
        const password = 'Charles@Admin';
        const name = 'Store Manager';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (exists.rows.length > 0) {
            await db.query(
                'UPDATE users SET password = $1, role = $2, name = $3 WHERE email = $4',
                [hashedPassword, 'admin', name, email]
            );
            console.log('Admin user updated:', email);
        } else {
            await db.query(
                'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                [name, email, hashedPassword, 'admin']
            );
            console.log('Admin user created:', email);
        }
        console.log('Password:', password);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
