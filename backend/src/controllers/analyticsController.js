const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
    try {
        const revenueResult = await db.query('SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = $1', ['paid']);
        const ordersResult = await db.query('SELECT COUNT(*) as total FROM orders');
        const customersResult = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'customer'");
        const pendingOrdersResult = await db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'");

        formatResponse(res, 200, true, 'Dashboard stats fetched', {
            revenue: parseFloat(revenueResult.rows[0].revenue || 0),
            orders: parseInt(ordersResult.rows[0].total),
            customers: parseInt(customersResult.rows[0].total),
            pendingOrders: parseInt(pendingOrdersResult.rows[0].total)
        });
    } catch (error) {
        next(error);
    }
};

exports.getSalesChart = async (req, res, next) => {
    try {
        // Fetches monthly sales for the current year
        const result = await db.query(`
            SELECT 
                TO_CHAR(created_at, 'Mon') as month, 
                SUM(total_amount) as total 
            FROM orders 
            WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
            GROUP BY month, DATE_PART('month', created_at)
            ORDER BY DATE_PART('month', created_at)
        `);
        formatResponse(res, 200, true, 'Sales chart data fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getTopProducts = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT p.name, SUM(oi.quantity) as sales, p.stock_quantity as stock
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id, p.name
            ORDER BY sales DESC
            LIMIT 5
        `);
        formatResponse(res, 200, true, 'Top products fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT name, stock_quantity as stock, id 
            FROM products 
            WHERE stock_quantity < 10
            ORDER BY stock_quantity ASC
            LIMIT 10
        `);
        formatResponse(res, 200, true, 'Low stock alerts fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getOrderReport = async (req, res, next) => {
    try {
        // Basic order report summary
        const result = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
        formatResponse(res, 200, true, 'Order report fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

