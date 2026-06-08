// MODIFIED — POS audit log (raw SQL)
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');

exports.listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
    const skip = (page - 1) * limit;
    let to = req.query.to ? new Date(req.query.to) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const { logs, total } = await posDb.listAuditLogs({
      from: req.query.from,
      to: to?.toISOString(),
      performedBy: req.query.performedBy,
      limit,
      skip,
    });

    formatResponse(res, 200, true, 'Audit logs fetched', {
      logs,
      pagination: { page, limit, total },
    });
  } catch (error) {
    next(error);
  }
};
