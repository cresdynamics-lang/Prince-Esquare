// MODIFIED — POS Excel reports (raw SQL)
const db = require('../../config/db');
const posDb = require('../../lib/posDb');
const { initWorkbook, styleHeaderRow, autoWidth, sendWorkbook } = require('../../utils/excelReport');

const buildDateRange = (from, to) => {
  const clauses = [];
  const params = [];
  let i = 1;
  if (from) {
    clauses.push(`s.created_at >= $${i++}`);
    params.push(new Date(from));
  }
  if (to) {
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    clauses.push(`s.created_at <= $${i++}`);
    params.push(t);
  }
  return { where: clauses.length ? clauses.join(' AND ') : '1=1', params };
};

exports.dailySales = async (req, res, next) => {
  try {
    const { where, params } = buildDateRange(req.query.from, req.query.to);
    const salesR = await db.query(
      `SELECT s.*, pr.full_name AS seller_name
       FROM pos_sales s
       LEFT JOIN pos_profiles pr ON pr.id = s.seller_id
       WHERE ${where}
       ORDER BY s.created_at ASC`,
      params
    );

    const sales = await Promise.all(
      salesR.rows.map(async (s) => {
        const itemsR = await db.query(`SELECT id FROM pos_sale_items WHERE sale_id = $1`, [s.id]);
        return { ...s, seller: s.seller_name ? { full_name: s.seller_name } : null, items: itemsR.rows };
      })
    );

    const headers = [
      'Date',
      'Receipt No.',
      'Channel',
      'Seller',
      'Items Count',
      'Total (KES)',
      'Payment Method',
      'M-Pesa Ref',
      'Voided',
    ];
    const { wb, ws, headerRow } = initWorkbook('Daily Sales Report', headers.length);
    styleHeaderRow(ws, headerRow, headers);

    sales.forEach((s, i) => {
      const row = headerRow + 1 + i;
      ws.getCell(row, 1).value = new Date(s.created_at).toISOString().split('T')[0];
      ws.getCell(row, 2).value = s.receipt_number;
      ws.getCell(row, 3).value = s.channel;
      ws.getCell(row, 4).value = s.seller?.full_name || 'Website';
      ws.getCell(row, 5).value = s.items.length;
      ws.getCell(row, 6).value = parseFloat(s.total_amount);
      ws.getCell(row, 7).value = s.payment_method;
      ws.getCell(row, 8).value = s.mpesa_ref || '';
      ws.getCell(row, 9).value = s.is_voided ? 'Yes' : 'No';
    });

    autoWidth(ws);
    await sendWorkbook(res, wb, 'daily-sales.xlsx');
  } catch (error) {
    next(error);
  }
};

exports.stockReport = async (req, res, next) => {
  try {
    const { toDateStr } = require('../../services/dailyStockSnapshot');
    const date = req.query.date ? new Date(`${req.query.date}T12:00:00`) : new Date();
    const dateStr = toDateStr(date);

    const snapshots = await posDb.getDailySheet(dateStr);

    const headers = ['Product', 'SKU', 'Opening', 'Stock In', 'Sales', 'Stock Out', 'Closing'];
    const { wb, ws, headerRow } = initWorkbook('Stock Report', headers.length);
    styleHeaderRow(ws, headerRow, headers);

    snapshots.forEach((s, i) => {
      const row = headerRow + 1 + i;
      ws.getCell(row, 1).value = s.product?.name || s.name;
      ws.getCell(row, 2).value = s.product?.sku || s.sku || '';
      ws.getCell(row, 3).value = s.opening_qty;
      ws.getCell(row, 4).value = s.stock_in_qty;
      ws.getCell(row, 5).value = s.sales_qty;
      ws.getCell(row, 6).value = s.stock_out_qty;
      ws.getCell(row, 7).value = s.closing_qty;
    });

    autoWidth(ws);
    await sendWorkbook(res, wb, 'stock-report.xlsx');
  } catch (error) {
    next(error);
  }
};

exports.stockMovements = async (req, res, next) => {
  try {
    let to = req.query.to ? new Date(req.query.to) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const movements = await posDb.getMovements({
      from: req.query.from,
      to: to?.toISOString(),
      limit: 10000,
      skip: 0,
    });

    const headers = ['Date/Time', 'Product', 'SKU', 'Movement Type', 'Qty', 'Recorded By', 'Notes'];
    const { wb, ws, headerRow } = initWorkbook('Stock Movements', headers.length);
    styleHeaderRow(ws, headerRow, headers);

    movements.forEach((m, i) => {
      const row = headerRow + 1 + i;
      ws.getCell(row, 1).value = new Date(m.created_at).toISOString();
      ws.getCell(row, 2).value = m.product.name;
      ws.getCell(row, 3).value = m.product.sku || '';
      ws.getCell(row, 4).value = m.movement_type;
      ws.getCell(row, 5).value = m.qty;
      ws.getCell(row, 6).value = m.recorder?.full_name || '';
      ws.getCell(row, 7).value = m.notes || '';
    });

    autoWidth(ws);
    await sendWorkbook(res, wb, 'stock-movements.xlsx');
  } catch (error) {
    next(error);
  }
};

exports.shiftReport = async (req, res, next) => {
  try {
    const shift = await posDb.getShiftById(req.query.shiftId);
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

    const activeSales = shift.sales.filter((s) => !s.is_voided);

    const headers = ['Receipt', 'Time', 'Items', 'Total (KES)', 'Payment'];
    const { wb, ws, headerRow } = initWorkbook('Shift Report', headers.length);
    ws.getCell(3, 1).value = `Seller: ${shift.seller.full_name}`;
    ws.getCell(3, 2).value = `Clock In: ${new Date(shift.clock_in).toISOString()}`;
    ws.getCell(3, 3).value = `Clock Out: ${shift.clock_out ? new Date(shift.clock_out).toISOString() : 'Open'}`;
    styleHeaderRow(ws, headerRow, headers);

    activeSales.forEach((s, i) => {
      const row = headerRow + 1 + i;
      ws.getCell(row, 1).value = s.receipt_number;
      ws.getCell(row, 2).value = new Date(s.created_at).toISOString();
      ws.getCell(row, 3).value = s.items.reduce((a, it) => a + it.qty, 0);
      ws.getCell(row, 4).value = parseFloat(s.total_amount);
      ws.getCell(row, 5).value = s.payment_method;
    });

    const summaryRow = headerRow + activeSales.length + 2;
    ws.getCell(summaryRow, 1).value = 'Cash (KES)';
    ws.getCell(summaryRow, 2).value = parseFloat(shift.total_cash);
    ws.getCell(summaryRow + 1, 1).value = 'M-Pesa (KES)';
    ws.getCell(summaryRow + 1, 2).value = parseFloat(shift.total_mpesa);
    ws.getCell(summaryRow + 2, 1).value = 'Grand Total (KES)';
    ws.getCell(summaryRow + 2, 2).value = parseFloat(shift.total_sales);

    autoWidth(ws);
    await sendWorkbook(res, wb, 'shift-report.xlsx');
  } catch (error) {
    next(error);
  }
};

exports.lowStock = async (req, res, next) => {
  try {
    const products = await posDb.getStockLevels();
    const low = products.filter((p) => (p.stock_level?.current_qty ?? 0) <= p.low_stock_threshold);

    const headers = ['Product', 'SKU', 'Category', 'Current Qty', 'Threshold', 'Variance'];
    const { wb, ws, headerRow } = initWorkbook('Low Stock Report', headers.length);
    styleHeaderRow(ws, headerRow, headers);

    low.forEach((p, i) => {
      const qty = p.stock_level?.current_qty ?? 0;
      const row = headerRow + 1 + i;
      ws.getCell(row, 1).value = p.name;
      ws.getCell(row, 2).value = p.sku || '';
      ws.getCell(row, 3).value = p.category || '';
      ws.getCell(row, 4).value = qty;
      ws.getCell(row, 5).value = p.low_stock_threshold;
      ws.getCell(row, 6).value = qty - p.low_stock_threshold;
    });

    autoWidth(ws);
    await sendWorkbook(res, wb, 'low-stock.xlsx');
  } catch (error) {
    next(error);
  }
};

exports.endOfDay = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const shiftsR = await db.query(
      `SELECT s.*, pr.full_name AS seller_name
       FROM pos_shifts s
       JOIN pos_profiles pr ON pr.id = s.seller_id
       WHERE s.clock_in >= $1 AND s.clock_in < $2`,
      [date, nextDay]
    );

    const headers = ['Name', 'Shifts Count', 'Cash (KES)', 'M-Pesa (KES)', 'Total Sales (KES)'];
    const { wb, ws, headerRow } = initWorkbook('End of Day Report', headers.length);
    styleHeaderRow(ws, headerRow, headers);

    const bySeller = {};
    for (const sh of shiftsR.rows) {
      if (!bySeller[sh.seller_id]) {
        bySeller[sh.seller_id] = {
          name: sh.seller_name,
          count: 0,
          cash: 0,
          mpesa: 0,
          total: 0,
        };
      }
      bySeller[sh.seller_id].count += 1;
      bySeller[sh.seller_id].cash += parseFloat(sh.total_cash);
      bySeller[sh.seller_id].mpesa += parseFloat(sh.total_mpesa);
      bySeller[sh.seller_id].total += parseFloat(sh.total_sales);
    }

    Object.values(bySeller).forEach((s, i) => {
      const row = headerRow + 1 + i;
      ws.getCell(row, 1).value = s.name;
      ws.getCell(row, 2).value = s.count;
      ws.getCell(row, 3).value = s.cash;
      ws.getCell(row, 4).value = s.mpesa;
      ws.getCell(row, 5).value = s.total;
    });

    autoWidth(ws);
    await sendWorkbook(res, wb, 'end-of-day.xlsx');
  } catch (error) {
    next(error);
  }
};
