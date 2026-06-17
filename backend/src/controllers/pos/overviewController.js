// MODIFIED — POS overview KPIs (raw SQL)

const db = require('../../config/db');

const posDb = require('../../lib/posDb');

const { formatResponse } = require('../../utils/responseFormatter');



const CACHE_TTL_MS = 30_000;

let overviewCache = { at: 0, data: null };



const getOverviewPayload = async () => {

  const now = new Date();

  const todayStart = new Date(now);

  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);

  weekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(todayStart);

  monthStart.setDate(1);

  const thirtyAgo = new Date(Date.now() - 30 * 86400000);



  const [todayR, weekR, monthR, activeR, dailyR, payR, topR, lowStockItems] = await Promise.all([

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

    db.query(
      `SELECT s.id AS shift_id, s.seller_id, s.clock_in,
              pr.full_name AS seller_name, pr.email AS seller_email,
              u.role AS user_role
       FROM pos_shifts s
       LEFT JOIN pos_profiles pr ON pr.id = s.seller_id
       LEFT JOIN users u ON LOWER(u.email) = LOWER(pr.email)
       WHERE s.clock_out IS NULL
       ORDER BY s.clock_in DESC`
    ),

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

    posDb.getLowStockSummary({ limit: 25 }),

  ]);



  return {

    kpis: {

      todayRevenue: todayR.rows[0].revenue,

      weekRevenue: weekR.rows[0].revenue,

      monthRevenue: monthR.rows[0].revenue,

      activeSellers: activeR.rows.length,
      openShifts: activeR.rows.map((row) => ({
        shiftId: row.shift_id,
        sellerId: row.seller_id,
        sellerName: row.seller_name || 'Unknown seller',
        sellerEmail: row.seller_email || null,
        userRole: row.user_role || null,
        clockIn: row.clock_in,
      })),

    },

    dailyRevenue: dailyR.rows,

    paymentBreakdown: payR.rows.map((r) => ({

      payment_method: r.payment_method,

      _sum: { total_amount: r.total_amount },

    })),

    topProducts: topR.rows,

    lowStockItems,

  };

};



exports.getOverview = async (req, res, next) => {

  try {

    const forceRefresh = req.query.refresh === '1';

    const now = Date.now();

    if (!forceRefresh && overviewCache.data && now - overviewCache.at < CACHE_TTL_MS) {

      return formatResponse(res, 200, true, 'Overview fetched', overviewCache.data);

    }



    const data = await getOverviewPayload();

    overviewCache = { at: now, data };

    formatResponse(res, 200, true, 'Overview fetched', data);

  } catch (error) {

    next(error);

  }

};



exports.invalidateOverviewCache = () => {

  overviewCache = { at: 0, data: null };

};

