// MODIFIED — POS overview KPIs (raw SQL)
const db = require('../../config/db');
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');

exports.getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(1);
    const thirtyAgo = new Date(Date.now() - 30 * 86400000);

    const [todayR, weekR, monthR, activeR, dailyR, payR, topR, lowStock] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(total_amount), 0)::float AS revenue FROM pos_sales WHERE is_voided = false AND created_at >= $1`,
        [todayStart]
      ),
      db.query(
        `SELECT COALESCE(SUM(total_amount), 0)::float AS revenue FROM pos_sales WHERE is_voided = false AND created_at >= $1`,
        [weekStart]
      ),
      db.query(
        `SELECT COALESCE(SUM(total_amount), 0)::float AS revenue FROM pos_sales WHERE is_voided = false AND created_at >= $1`,
        [monthStart]
      ),
      db.query(`SELECT COUNT(*)::int AS c FROM pos_shifts WHERE clock_out IS NULL`),
      db.query(
        `SELECT DATE(created_at) AS date, SUM(total_amount)::float AS revenue
         FROM pos_sales WHERE is_voided = false AND created_at >= $1
         GROUP BY DATE(created_at) ORDER BY date ASC`,
        [thirtyAgo]
      ),
      db.query(
        `SELECT payment_method, SUM(total_amount)::float AS total_amount
         FROM pos_sales WHERE is_voided = false AND created_at >= $1
         GROUP BY payment_method`,
        [monthStart]
      ),
      db.query(
        `SELECT p.name, SUM(si.qty)::int AS qty
         FROM pos_sale_items si
         JOIN pos_sales s ON s.id = si.sale_id
         JOIN pos_products p ON p.id = si.product_id
         WHERE s.is_voided = false AND s.created_at >= $1
         GROUP BY p.name ORDER BY qty DESC LIMIT 10`,
        [monthStart]
      ),
      posDb.getStockLevels(),
    ]);

    const lowStockItems = lowStock.filter((p) => p.isLow);

    formatResponse(res, 200, true, 'Overview fetched', {
      kpis: {
        todayRevenue: todayR.rows[0].revenue,
        weekRevenue: weekR.rows[0].revenue,
        monthRevenue: monthR.rows[0].revenue,
        activeSellers: activeR.rows[0].c,
      },
      dailyRevenue: dailyR.rows,
      paymentBreakdown: payR.rows.map((r) => ({
        payment_method: r.payment_method,
        _sum: { total_amount: r.total_amount },
      })),
      topProducts: topR.rows,
      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};
