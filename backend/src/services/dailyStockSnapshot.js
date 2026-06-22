// NEW — Auto-update daily opening/closing stock from movements & sales
const db = require('../config/db');

const toDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (dateStr) => {
  const [y, m, day] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, day);
};

const prevDateStr = (dateStr) => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
};

const nextDateStr = (dateStr) => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
};

const aggregateMovements = async (client, productId, dateStr) => {
  const movR = await client.query(
    `SELECT movement_type, COALESCE(SUM(qty), 0)::int AS total
     FROM pos_stock_movements
     WHERE product_id = $1 AND COALESCE(date, created_at::date) = $2::date
     GROUP BY movement_type`,
    [productId, dateStr]
  );

  let sales = 0;
  let stockIn = 0;
  let stockOut = 0;
  let adjustments = 0;
  for (const row of movR.rows) {
    if (row.movement_type === 'STOCK_IN') stockIn += row.total;
    if (row.movement_type === 'STOCK_OUT') stockOut += row.total;
    if (row.movement_type === 'SALE_POS' || row.movement_type === 'SALE_ONLINE') sales += row.total;
    if (row.movement_type === 'VOID') sales -= row.total;
    if (row.movement_type === 'ADJUSTMENT') adjustments += row.total;
  }
  return { sales, stockIn, stockOut, adjustments };
};

const resolveOpeningQty = async (client, productId, dateStr) => {
  const existing = await client.query(
    `SELECT opening_qty FROM pos_daily_stock_snapshots WHERE product_id = $1 AND date = $2::date`,
    [productId, dateStr]
  );
  if (existing.rows.length) return existing.rows[0].opening_qty;

  const prev = await client.query(
    `SELECT closing_qty FROM pos_daily_stock_snapshots WHERE product_id = $1 AND date = $2::date`,
    [productId, prevDateStr(dateStr)]
  );
  if (prev.rows.length) return prev.rows[0].closing_qty;

  const stockR = await client.query(
    `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
    [productId]
  );
  const currentQty = stockR.rows[0]?.current_qty ?? 0;
  const { sales, stockIn, stockOut, adjustments } = await aggregateMovements(client, productId, dateStr);
  return currentQty + sales + stockOut - stockIn - adjustments;
};

const refreshDailySnapshot = async (productId, date = new Date(), existingClient = null) => {
  const dateStr = toDateStr(date);
  const client = existingClient || (await db.pool.connect());
  const release = !existingClient;

  try {
    const opening = await resolveOpeningQty(client, productId, dateStr);
    const { sales, stockIn, stockOut, adjustments } = await aggregateMovements(client, productId, dateStr);

    const stockR = await client.query(
      `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
      [productId]
    );
    const currentQty = stockR.rows[0]?.current_qty;
    const formulaClosing = Math.max(0, opening + stockIn - stockOut - sales + adjustments);
    const closingQty = currentQty != null ? currentQty : formulaClosing;

    await client.query(
      `INSERT INTO pos_daily_stock_snapshots
         (product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty)
       VALUES ($1, $2::date, $3, $4, $5, $6, $7)
       ON CONFLICT (product_id, date) DO UPDATE SET
         opening_qty = pos_daily_stock_snapshots.opening_qty,
         stock_in_qty = EXCLUDED.stock_in_qty,
         stock_out_qty = EXCLUDED.stock_out_qty,
         sales_qty = EXCLUDED.sales_qty,
         closing_qty = EXCLUDED.closing_qty`,
      [productId, dateStr, opening, stockIn, stockOut, sales, closingQty]
    );

    return { productId, date: dateStr, opening, sales, stockIn, stockOut, closingQty };
  } finally {
    if (release) client.release();
  }
};

const refreshAllDailySnapshots = async (date = new Date(), existingClient = null) => {
  const client = existingClient || (await db.pool.connect());
  const release = !existingClient;

  try {
    const products = await client.query(`SELECT id FROM pos_products ORDER BY name`);
    const results = [];
    for (const row of products.rows) {
      results.push(await refreshDailySnapshot(row.id, date, client));
    }
    return results;
  } finally {
    if (release) client.release();
  }
};

const closeDayAndRollover = async (date = new Date(), performedBy = null) => {
  const dateStr = toDateStr(date);
  const tomorrowStr = nextDateStr(dateStr);
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const refreshed = await refreshAllDailySnapshots(date, client);

    for (const snap of refreshed) {
      await client.query(
        `INSERT INTO pos_daily_stock_snapshots
           (product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty)
         VALUES ($1, $2::date, $3, 0, 0, 0, $3)
         ON CONFLICT (product_id, date) DO UPDATE SET
           opening_qty = EXCLUDED.opening_qty,
           stock_in_qty = 0,
           stock_out_qty = 0,
           sales_qty = 0,
           closing_qty = EXCLUDED.opening_qty
         WHERE pos_daily_stock_snapshots.sales_qty = 0
           AND pos_daily_stock_snapshots.stock_in_qty = 0
           AND pos_daily_stock_snapshots.stock_out_qty = 0`,
        [snap.productId, tomorrowStr, snap.closingQty]
      );
    }

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, performed_by, details)
       VALUES ('CLOSE_DAY', 'pos_daily_stock_snapshots', $1, $2)`,
      [performedBy, JSON.stringify({ date: dateStr, nextDate: tomorrowStr, products: refreshed.length })]
    );

    await client.query('COMMIT');
    return { date: dateStr, nextDate: tomorrowStr, products: refreshed.length };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  toDateStr,
  parseLocalDate,
  prevDateStr,
  nextDateStr,
  refreshDailySnapshot,
  refreshAllDailySnapshots,
  closeDayAndRollover,
};
