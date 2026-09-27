const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

async function safeQuery(sql, params = []) {
  try {
    return await db.query(sql, params);
  } catch (err) {
    if (err.code === '42P01') return { rows: [] };
    throw err;
  }
}

/** Admin dashboard insights — website orders / product events only (no POS merge). */
exports.getDashboardInsights = async (req, res, next) => {
  try {
    const [
      ordersResult,
      pendingResult,
      unitsResult,
      customersResult,
      dailyOnline,
      weeklyOnline,
      categoryResult,
      monthlyOnline,
      fastMovingResult,
      mostViewedResult,
      topSoldResult,
      lowStockResult,
    ] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM orders'),
      db.query("SELECT COUNT(*)::int AS total FROM orders WHERE status = 'pending'"),
      db.query(
        "SELECT COALESCE(SUM(oi.quantity), 0)::int AS units FROM order_items oi " +
          "JOIN orders o ON oi.order_id = o.id WHERE o.payment_status = 'paid'"
      ),
      db.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'customer'"),
      db.query(`
        SELECT d.day::date AS day,
               TO_CHAR(d.day, 'Dy') AS label,
               COALESCE(SUM(o.total_amount), 0)::float AS revenue,
               COUNT(o.id)::int AS orders
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS d(day)
        LEFT JOIN orders o ON DATE(o.created_at) = d.day::date AND o.payment_status = 'paid'
        GROUP BY d.day
        ORDER BY d.day
      `),
      db.query(`
        SELECT w.week_start::date AS week_start,
               TO_CHAR(w.week_start, 'DD Mon') AS label,
               COALESCE(SUM(o.total_amount), 0)::float AS revenue,
               COUNT(o.id)::int AS orders
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
        SELECT COALESCE(cp.name, c.name, 'Uncategorized') AS name,
               COALESCE(SUM(oi.quantity * oi.price), 0)::float AS value
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
        SELECT TO_CHAR(created_at, 'Mon') AS month,
               DATE_PART('month', created_at)::int AS month_num,
               COALESCE(SUM(total_amount), 0)::float AS total
        FROM orders
        WHERE payment_status = 'paid' AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY month, DATE_PART('month', created_at)
        ORDER BY DATE_PART('month', created_at)
      `),
      safeQuery(`
        SELECT p.id, p.name, p.thumbnail, p.slug,
               COALESCE(SUM(pe.quantity), 0)::int AS count
        FROM product_events pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.event_type = 'cart_add' AND pe.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.thumbnail, p.slug
        ORDER BY count DESC
        LIMIT 8
      `),
      safeQuery(`
        SELECT p.id, p.name, p.thumbnail, p.slug,
               COUNT(*)::int AS count
        FROM product_events pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.event_type = 'view' AND pe.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.thumbnail, p.slug
        ORDER BY count DESC
        LIMIT 8
      `),
      db.query(`
        SELECT p.id, p.name, p.thumbnail, p.slug, SUM(oi.quantity)::int AS sales
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.payment_status = 'paid'
        GROUP BY p.id, p.name, p.thumbnail, p.slug
        ORDER BY sales DESC
        LIMIT 8
      `),
      db.query(`
        SELECT id, name, stock_quantity AS stock, thumbnail
        FROM products WHERE stock_quantity < 10 AND is_active = true
        ORDER BY stock_quantity ASC LIMIT 8
      `),
    ]);

    const dailySales = dailyOnline.rows.map((row) => ({
      label: row.label,
      full_label: row.day,
      revenue: parseFloat(row.revenue || 0),
      orders: row.orders,
    }));

    const weeklySales = weeklyOnline.rows.map((row) => ({
      label: row.label,
      week_start: row.week_start,
      revenue: parseFloat(row.revenue || 0),
      orders: row.orders || 0,
    }));

    const monthlySales = monthlyOnline.rows.map((r) => ({
      month_num: r.month_num,
      month: r.month,
      total: parseFloat(r.total || 0),
    }));

    formatResponse(res, 200, true, 'Dashboard insights fetched', {
      stats: {
        totalSales: parseInt(ordersResult.rows[0].total, 10),
        orders: parseInt(ordersResult.rows[0].total, 10),
        unitsSold: parseInt(unitsResult.rows[0].units, 10),
        customers: customersResult.rows[0].total,
        pendingOrders: pendingResult.rows[0].total,
      },
      dailySales,
      weeklySales,
      salesByCategory: categoryResult.rows,
      monthlySales,
      fastMoving: fastMovingResult.rows,
      mostViewed: mostViewedResult.rows,
      topSold: topSoldResult.rows,
      lowStock: lowStockResult.rows,
    });
  } catch (error) {
    next(error);
  }
};
