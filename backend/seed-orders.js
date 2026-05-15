const db = require('./src/config/db');

async function seedOrders() {
    try {
        console.log('Seeding orders, items, and payments...');

        // 1. Get some users (customers)
        const users = await db.query("SELECT id FROM users WHERE role = 'customer' LIMIT 3");
        if (users.rows.length === 0) {
            console.log('No customers found. Please seed customers first.');
            process.exit(1);
        }

        // 2. Get some products
        const products = await db.query("SELECT id, price FROM products LIMIT 5");
        if (products.rows.length === 0) {
            console.log('No products found. Please seed products first.');
            process.exit(1);
        }

        // 3. Clear existing orders to avoid duplicates in analytics for this seed
        await db.query('DELETE FROM order_items');
        await db.query('DELETE FROM payments');
        await db.query('DELETE FROM orders');

        const statuses = ['pending', 'processing', 'shipped', 'delivered'];
        const paymentStatuses = ['pending', 'paid', 'paid', 'paid']; // Weighted towards paid

        for (let i = 0; i < 15; i++) {
            const user = users.rows[i % users.rows.length];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const pStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
            
            // Random date in the last 6 months
            const date = new Date();
            date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
            date.setDate(Math.floor(Math.random() * 28) + 1);

            const address = {
                street: '123 Luxury Ave',
                city: 'Nairobi',
                county: 'Nairobi',
                phone: '+254 700 000 000'
            };

            const orderResult = await db.query(
                'INSERT INTO orders (user_id, total_amount, status, payment_status, payment_method, shipping_address, created_at) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [user.id, 0, status, pStatus, 'M-Pesa', JSON.stringify(address), date]
            );
            const orderId = orderResult.rows[0].id;

            // Add 1-3 items
            let total = 0;
            const numItems = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numItems; j++) {
                const product = products.rows[Math.floor(Math.random() * products.rows.length)];
                const qty = Math.floor(Math.random() * 2) + 1;
                const price = parseFloat(product.price);
                total += price * qty;

                await db.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [orderId, product.id, qty, price]
                );
            }

            // Update order total
            await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [total, orderId]);

            // If paid, add a payment record
            if (pStatus === 'paid') {
                await db.query(
                    'INSERT INTO payments (order_id, user_id, amount, status, transaction_id, method, created_at) ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [orderId, user.id, total, 'Success', 'TX' + Math.random().toString(36).substring(2, 11).toUpperCase(), 'M-Pesa', date]
                );
            }
        }

        console.log('Orders and payments seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
}

seedOrders();
