const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

const seedCustomers = async () => {
    try {
        console.log('Seeding customers...');
        
        const password = await bcrypt.hash('customer123', 10);
        
        const customers = [
            ['James Omondi', 'james@example.com', password, '+254 711 222 333', true],
            ['Sarah Wanjiku', 'sarah@example.com', password, '+254 722 333 444', false],
            ['Michael Kipkorir', 'michael@example.com', password, '+254 733 444 555', true],
            ['Anita Hassan', 'anita@example.com', password, '+254 744 555 666', true],
            ['David Mutua', 'david@example.com', password, '+254 755 666 777', false]
        ];

        for (const [name, email, pass, phone, verified] of customers) {
            await db.query(
                `INSERT INTO users (name, email, password, phone, is_verified, role) 
                 VALUES ($1, $2, $3, $4, $5, 'customer') 
                 ON CONFLICT (email) DO NOTHING`,
                [name, email, pass, phone, verified]
            );
        }

        console.log('Customers seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding customers:', error);
        process.exit(1);
    }
};

seedCustomers();
