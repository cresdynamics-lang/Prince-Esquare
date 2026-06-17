// MODIFIED — POS shift management (raw SQL)
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');

exports.clockIn = async (req, res, next) => {
  try {
    const actorId = req.posActorId || req.user.id;
    const open = await posDb.getOpenShift(actorId);
    if (open) return formatResponse(res, 400, false, 'You already have an open shift');

    const shift = await posDb.createShift(actorId);
    formatResponse(res, 201, true, 'Clocked in', { shiftId: shift.id, shift });
  } catch (error) {
    next(error);
  }
};

exports.clockOut = async (req, res, next) => {
  try {
    const actorId = req.posActorId || req.user.id;
    const updated = await posDb.closeShift(actorId);
    if (!updated) return formatResponse(res, 404, false, 'No open shift found');
    formatResponse(res, 200, true, 'Clocked out', updated);
  } catch (error) {
    next(error);
  }
};

exports.listShifts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    let to = req.query.to ? new Date(req.query.to) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const { shifts, total } = await posDb.listShifts({
      sellerId: req.query.sellerId,
      from: req.query.from,
      to: to?.toISOString(),
      limit,
      skip,
    });

    formatResponse(res, 200, true, 'Shifts fetched', {
      shifts,
      pagination: { page, limit, total },
    });
  } catch (error) {
    next(error);
  }
};

exports.getShift = async (req, res, next) => {
  try {
    const shift = await posDb.getShiftById(req.params.id);
    if (!shift) return formatResponse(res, 404, false, 'Shift not found');
    formatResponse(res, 200, true, 'Shift fetched', shift);
  } catch (error) {
    next(error);
  }
};

exports.myCurrentShift = async (req, res, next) => {
  try {
    const actorId = req.posActorId || req.user.id;
    const shift = await posDb.getOpenShift(actorId);
    formatResponse(res, 200, true, 'Current shift', shift);
  } catch (error) {
    next(error);
  }
};

exports.forceCloseShift = async (req, res, next) => {
  try {
    const closed = await posDb.forceCloseShiftById(req.params.id);
    if (!closed) return formatResponse(res, 404, false, 'Open shift not found');
    const { invalidateOverviewCache } = require('./overviewController');
    invalidateOverviewCache();
    formatResponse(res, 200, true, 'Shift closed', closed);
  } catch (error) {
    next(error);
  }
};

exports.myShiftSummary = async (req, res, next) => {
  try {
    const actorId = req.posActorId || req.user.id;
    const shift = await posDb.getOpenShift(actorId);
    if (!shift) return formatResponse(res, 200, true, 'No open shift', null);

    const db = require('../../config/db');
    const salesR = await db.query(
      `SELECT * FROM pos_sales WHERE shift_id = $1 AND is_voided = false ORDER BY created_at`,
      [shift.id]
    );
    const sales = await Promise.all(
      salesR.rows.map(async (sale) => {
        const itemsR = await db.query(
          `SELECT si.*, COALESCE(si.line_name, p.name) AS product_name FROM pos_sale_items si
           JOIN pos_products p ON p.id = si.product_id WHERE si.sale_id = $1`,
          [sale.id]
        );
        return {
          ...sale,
          items: itemsR.rows.map((it) => ({ ...it, product: { name: it.product_name } })),
        };
      })
    );

    formatResponse(res, 200, true, 'Shift summary', { ...shift, sales });
  } catch (error) {
    next(error);
  }
};
