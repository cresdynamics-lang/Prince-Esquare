const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

const paidOnlineRevenueSql = `
  SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE payment_status = 'paid'`;

const posRevenueSql = `
  SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM pos_sales WHERE is_voided = false`;

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [onlineRev, posRev, profitResult, ordersResult, posSalesCount, customersResult, pendingOrdersResult] =
      await Promise.all([
        db.query(paidOnlineRevenueSql),
        db.query(posRevenueSql),
        db.query(`
          SELECT COALESCE(SUM(oi.quantity * oi.price), 0) * 0.35 AS profit
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.payment_status = 'paid'
        `),
        db.query('SELECT COUNT(*)::int AS total FROM orders'),
        db.query('SELECT COUNT(*)::int AS total FROM pos_sales WHERE is_voided = false'),
        db.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'customer'"),
        db.query("SELECT COUNT(*)::int AS total FROM orders WHERE status = 'pending'"),
      ]);

    const onlineRevenue = parseFloat(onlineRev.rows[0].revenue || 0);
    const posRevenue = parseFloat(posRev.rows[0].revenue || 0);
    const onlineProfit = parseFloat(profitResult.rows[0].profit || 0);
    const posProfit = posRevenue * 0.35;

    formatResponse(res, 200, true, 'Dashboard stats fetched', {
      revenue: onlineRevenue + posRevenue,
      onlineRevenue,
      posRevenue,
      profit: onlineProfit + posProfit,
      orders: parseInt(ordersResult.rows[0].total, 10) + parseInt(posSalesCount.rows[0].total, 10),
      onlineOrders: parseInt(ordersResult.rows[0].total, 10),
      posSales: parseInt(posSalesCount.rows[0].total, 10),
      customers: parseInt(customersResult.rows[0].total, 10),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].total, 10),
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesChart = async (req, res, next) => {
  try {
    const { type = 'monthly' } = req.query;
    let onlineQuery = '';
    let posQuery = '';

    if (type === 'daily') {
      onlineQuery = `
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS label, SUM(total_amount)::float AS total
        FROM orders
        WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY label`;
      posQuery = `
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS label, SUM(total_amount)::float AS total
        FROM pos_sales
        WHERE is_voided = false AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY label`;
    } else if (type === 'weekly') {
      onlineQuery = `
        SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS label, SUM(total_amount)::float AS total
        FROM orders
        WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY label`;
      posQuery = `
        SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS label, SUM(total_amount)::float AS total
        FROM pos_sales
        WHERE is_voided = false AND created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY label`;
    } else {
      onlineQuery = `
        SELECT TO_CHAR(created_at, 'Mon') AS label, DATE_PART('month', created_at) AS month_num,
               SUM(total_amount)::float AS total
        FROM orders
        WHERE payment_status = 'paid' AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY label, month_num
        ORDER BY month_num`;
      posQuery = `
        SELECT TO_CHAR(created_at, 'Mon') AS label, DATE_PART('month', created_at) AS month_num,
               SUM(total_amount)::float AS total
        FROM pos_sales
        WHERE is_voided = false AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY label, month_num
        ORDER BY month_num`;
    }

    const [onlineR, posR] = await Promise.all([db.query(onlineQuery), db.query(posQuery)]);
    const merged = new Map();
    for (const row of [...onlineR.rows, ...posR.rows]) {
      const key = row.label;
      merged.set(key, (merged.get(key) || 0) + parseFloat(row.total || 0));
    }

    const result = Array.from(merged, ([label, total]) => ({ label, total }));
    formatResponse(res, 200, true, `${type} sales chart data fetched`, result);
  } catch (error) {
    next(error);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const result = await db.query(`
      WITH online_sales AS (
        SELECT p.id, p.name, SUM(oi.quantity)::int AS sales
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
        GROUP BY p.id, p.name
      ),
      pos_sales AS (
        SELECT COALESCE(pr.id, si.product_id) AS id,
               COALESCE(pr.name, si.line_name, pp.name) AS name,
               SUM(si.qty)::int AS sales
        FROM pos_sale_items si
        JOIN pos_sales s ON s.id = si.sale_id
        LEFT JOIN products pr ON pr.id = si.ecommerce_product_id
        LEFT JOIN pos_products pp ON pp.id = si.product_id
        WHERE s.is_voided = false
        GROUP BY COALESCE(pr.id, si.product_id), COALESCE(pr.name, si.line_name, pp.name)
      ),
      combined AS (
        SELECT id::text, name, sales FROM online_sales
        UNION ALL
        SELECT id::text, name, sales FROM pos_sales
      )
      SELECT name, SUM(sales)::int AS sales
      FROM combined
      GROUP BY name
      ORDER BY sales DESC
      LIMIT 10
    `);
    formatResponse(res, 200, true, 'Top products fetched', result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT name, stock_quantity AS stock, id
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
    const result = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
    formatResponse(res, 200, true, 'Order report fetched', result.rows);
  } catch (error) {
    next(error);
  }
};
