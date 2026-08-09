const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

const PROFIT_MARGIN = parseFloat(process.env.PROFIT_MARGIN || '0.35');

async function safeQuery(sql, params = []) {
    try {
        return await db.query(sql, params);
    } catch (err) {
        if (err.code === '42P01') return { rows: [] };
        throw err;
    }
}

exports.getDashboardStats = async (req, res, next) => {
    try {
        const revenueResult = await db.query(
            "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE payment_status = 'paid'"
        );
        const ordersResult = await db.query('SELECT COUNT(*)::int as total FROM orders');
        const customersResult = await db.query("SELECT COUNT(*)::int as total FROM users WHERE role = 'customer'");
        const pendingOrdersResult = await db.query("SELECT COUNT(*)::int as total FROM orders WHERE status = 'pending'");
        const unitsResult = await db.query(
            "SELECT COALESCE(SUM(oi.quantity), 0)::int as units FROM order_items oi " +
            "JOIN orders o ON oi.order_id = o.id WHERE o.payment_status = 'paid'"
        );

        const revenue = parseFloat(revenueResult.rows[0].revenue || 0);

        formatResponse(res, 200, true, 'Dashboard stats fetched', {
            revenue,
            profit: Math.round(revenue * PROFIT_MARGIN * 100) / 100,
            orders: ordersResult.rows[0].total,
            totalSales: unitsResult.rows[0].units,
            customers: customersResult.rows[0].total,
            pendingOrders: pendingOrdersResult.rows[0].total,
        });
    } catch (error) {
        next(error);
    }
};

exports.getSalesChart = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT
                TO_CHAR(created_at, 'Mon') as month,
                DATE_PART('month', created_at)::int as month_num,
                COALESCE(SUM(total_amount), 0) as total
            FROM orders
            WHERE payment_status = 'paid'
              AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
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
            SELECT p.name, p.thumbnail, SUM(oi.quantity)::int as sales, p.stock_quantity as stock
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.payment_status = 'paid'
            GROUP BY p.id, p.name, p.thumbnail, p.stock_quantity
            ORDER BY sales DESC
            LIMIT 8
        `);
        formatResponse(res, 200, true, 'Top products fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT name, stock_quantity as stock, id, thumbnail
            FROM products
            WHERE stock_quantity < 10 AND is_active = true
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
        const result = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
        formatResponse(res, 200, true, 'Order report fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

/** Full dashboard payload: charts + product intelligence */
exports.getDashboardInsights = async (req, res, next) => {
    try {
        const [
            revenueResult,
            ordersResult,
            customersResult,
            pendingResult,
            unitsResult,
            dailyResult,
            weeklyResult,
            categoryResult,
            monthlyResult,
            fastMovingResult,
            mostViewedResult,
            topSoldResult,
            lowStockResult,
        ] = await Promise.all([
            db.query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE payment_status = 'paid'"),
            db.query('SELECT COUNT(*)::int as total FROM orders'),
            db.query("SELECT COUNT(*)::int as total FROM users WHERE role = 'customer'"),
            db.query("SELECT COUNT(*)::int as total FROM orders WHERE status = 'pending'"),
            db.query(
                "SELECT COALESCE(SUM(oi.quantity), 0)::int as units FROM order_items oi " +
                "JOIN orders o ON oi.order_id = o.id WHERE o.payment_status = 'paid'"
            ),
            db.query(`
                SELECT TO_CHAR(d.day, 'Dy') as label,
                       TO_CHAR(d.day, 'DD Mon') as full_label,
                       d.day::date as date,
                       COALESCE(SUM(o.total_amount), 0)::float as revenue,
                       COUNT(o.id)::int as orders
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS d(day)
                LEFT JOIN orders o ON DATE(o.created_at) = d.day::date AND o.payment_status = 'paid'
                GROUP BY d.day
                ORDER BY d.day
            `),
            db.query(`
                SELECT TO_CHAR(w.week_start, 'DD Mon') as label,
                       w.week_start::date as week_start,
                       COALESCE(SUM(o.total_amount), 0)::float as revenue,
                       COUNT(o.id)::int as orders
                FROM generate_series(
                    DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '5 weeks',
                    DATE_TRUNC('week', CURRENT_DATE),
                    '1 week'
                ) AS w(week_start)
                LEFT JOIN orders o ON DATE_TRUNC('week', o.created_at) = w.week_start AND o.payment_status = 'paid'
                GROUP BY w.week_start
                ORDER BY w.week_start
            `),
            db.query(`
                SELECT COALESCE(cp.name, c.name, 'Uncategorized') as name,
                       COALESCE(SUM(oi.quantity * oi.price), 0)::float as value
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN categories cp ON c.parent_id = cp.id
                WHERE o.payment_status = 'paid'
                GROUP BY COALESCE(cp.name, c.name, 'Uncategorized')
                ORDER BY value DESC
                LIMIT 8
            `),
            db.query(`
                SELECT TO_CHAR(created_at, 'Mon') as month,
                       DATE_PART('month', created_at)::int as month_num,
                       COALESCE(SUM(total_amount), 0)::float as total
                FROM orders
                WHERE payment_status = 'paid'
                  AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
                GROUP BY month, DATE_PART('month', created_at)
                ORDER BY DATE_PART('month', created_at)
            `),
            safeQuery(`
                SELECT p.id, p.name, p.thumbnail, p.slug,
                       COALESCE(SUM(pe.quantity), 0)::int as count
                FROM product_events pe
                JOIN products p ON pe.product_id = p.id
                WHERE pe.event_type = 'cart_add'
                  AND pe.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY p.id, p.name, p.thumbnail, p.slug
                ORDER BY count DESC
                LIMIT 8
            `),
            safeQuery(`
                SELECT p.id, p.name, p.thumbnail, p.slug,
                       COUNT(*)::int as count
                FROM product_events pe
                JOIN products p ON pe.product_id = p.id
                WHERE pe.event_type = 'view'
                  AND pe.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY p.id, p.name, p.thumbnail, p.slug
                ORDER BY count DESC
                LIMIT 8
            `),
            db.query(`
                SELECT p.id, p.name, p.thumbnail, p.slug, SUM(oi.quantity)::int as sales
                FROM products p
                JOIN order_items oi ON p.id = oi.product_id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'paid'
                GROUP BY p.id, p.name, p.thumbnail, p.slug
                ORDER BY sales DESC
                LIMIT 8
            `),
            db.query(`
                SELECT id, name, stock_quantity as stock, thumbnail
                FROM products WHERE stock_quantity < 10 AND is_active = true
                ORDER BY stock_quantity ASC LIMIT 8
            `),
        ]);

        const revenue = parseFloat(revenueResult.rows[0].revenue || 0);

        formatResponse(res, 200, true, 'Dashboard insights fetched', {
            stats: {
                revenue,
                profit: Math.round(revenue * PROFIT_MARGIN * 100) / 100,
                orders: ordersResult.rows[0].total,
                totalSales: unitsResult.rows[0].units,
                customers: customersResult.rows[0].total,
                pendingOrders: pendingResult.rows[0].total,
            },
            dailySales: dailyResult.rows,
            weeklySales: weeklyResult.rows,
            salesByCategory: categoryResult.rows,
            monthlySales: monthlyResult.rows,
            fastMoving: fastMovingResult.rows,
            mostViewed: mostViewedResult.rows,
            topSold: topSoldResult.rows,
            lowStock: lowStockResult.rows,
        });
    } catch (error) {
        next(error);
    }
};
