const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        const email = 'admin@princeesquire.com';
        const password = 'adminpassword123';
        const name = 'System Admin';

        // Check if exists
        const exists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (exists.rows.length > 0) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, 'admin']
        );

        console.log('Admin user created successfully:');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
