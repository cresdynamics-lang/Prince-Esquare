const db = require('./src/config/db');

async function createPaymentsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                transaction_id VARCHAR(100) UNIQUE,
                method VARCHAR(50) DEFAULT 'M-Pesa',
                phone_number VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Payments table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating payments table:', error);
        process.exit(1);
    }
}

createPaymentsTable();
