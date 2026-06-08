// NEW — POS sales & product lookup
const Joi = require('joi');
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');
const { processSale, voidSale } = require('../../services/posSaleService');
const { getPosSetting } = require('../../utils/posSettings');

exports.searchProducts = async (req, res, next) => {
  try {
    const hasSearch = Boolean((req.query.search || '').trim());
    const hasCategory = Boolean((req.query.category || '').trim());
    const defaultLimit = hasCategory ? 500 : hasSearch ? 200 : 100;
    const limit = Math.min(500, parseInt(req.query.limit, 10) || defaultLimit);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const catalogFilter = req.query.catalogFilter || req.query.channelFilter || 'all';
    const catalog = await posDb.searchPosCatalog({
      search: req.query.search || '',
      limit,
      offset,
      category: req.query.category || '',
      inStockOnly: req.query.inStockOnly === 'true' || (!hasSearch && !hasCategory && catalogFilter === 'in_stock'),
      shopFloorOnly: req.query.shopFloorOnly !== 'false',
      catalogFilter,
    });
    formatResponse(res, 200, true, 'Products fetched', catalog);
  } catch (error) {
    next(error);
  }
};

exports.createSale = async (req, res, next) => {
  try {
    const schema = Joi.object({
      shiftId: Joi.string().uuid().required(),
      paymentMethod: Joi.string().valid('CASH', 'MPESA').required(),
      mpesaRef: Joi.when('paymentMethod', {
        is: 'MPESA',
        then: Joi.string().alphanum().min(8).max(12).required(),
        otherwise: Joi.optional(),
      }),
      discountAmount: Joi.number().min(0).default(0),
      items: Joi.array()
        .items(
          Joi.object({
            productId: Joi.string().uuid().required(),
            variantId: Joi.string().uuid().optional().allow(null),
            ecommerceProductId: Joi.string().uuid().optional().allow(null),
            lineName: Joi.string().max(500).optional().allow(null, ''),
            qty: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().positive().optional(),
          })
        )
        .min(1)
        .required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const canDiscount = (await getPosSetting('pos_sellers_can_discount', 'false')) === 'true';
    if (!canDiscount && value.discountAmount > 0) {
      return formatResponse(res, 403, false, 'Sellers cannot apply discounts');
    }

    const sale = await processSale({
      shiftId: value.shiftId,
      sellerId: req.user.id,
      channel: 'POS',
      paymentMethod: value.paymentMethod,
      mpesaRef: value.mpesaRef,
      discountAmount: value.discountAmount,
      items: value.items,
      recordedBy: req.user.id,
    });

    formatResponse(res, 201, true, 'Sale completed', sale);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.createOnlineSale = async (req, res, next) => {
  try {
    const schema = Joi.object({
      orderRef: Joi.string().optional(),
      discountAmount: Joi.number().min(0).default(0),
      items: Joi.array()
        .items(
          Joi.object({
            productId: Joi.string().uuid().required(),
            variantId: Joi.string().uuid().optional().allow(null),
            ecommerceProductId: Joi.string().uuid().optional().allow(null),
            lineName: Joi.string().max(500).optional().allow(null, ''),
            qty: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().positive().required(),
          })
        )
        .min(1)
        .required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const sale = await processSale({
      channel: 'ONLINE',
      paymentMethod: 'ONLINE',
      discountAmount: value.discountAmount,
      items: value.items,
      auditDetails: { orderRef: value.orderRef },
    });

    formatResponse(res, 201, true, 'Online sale recorded', sale);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.voidSale = async (req, res, next) => {
  try {
    const schema = Joi.object({ voidReason: Joi.string().min(3).required() });
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const sale = await voidSale(
      req.params.id,
      value.voidReason,
      null,
      req.user.fullName || req.user.name
    );

    formatResponse(res, 200, true, 'Sale voided', sale);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.listSales = async (req, res, next) => {
  try {
    const db = require('../../config/db');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const clauses = ['1=1'];
    const params = [];
    let i = 1;
    if (req.query.includeVoided !== 'true') {
      clauses.push('s.is_voided = false');
    }
    if (req.query.channel) { clauses.push(`s.channel = $${i++}`); params.push(req.query.channel); }
    if (req.query.sellerId) { clauses.push(`s.seller_id = $${i++}`); params.push(req.query.sellerId); }
    if (req.query.from) { clauses.push(`s.created_at >= $${i++}`); params.push(req.query.from); }
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      clauses.push(`s.created_at <= $${i++}`);
      params.push(to.toISOString());
    }

    const countR = await db.query(
      `SELECT COUNT(*)::int AS total FROM pos_sales s WHERE ${clauses.join(' AND ')}`,
      params
    );
    params.push(limit, skip);
    const salesR = await db.query(
      `SELECT s.*, pr.full_name AS seller_full_name
       FROM pos_sales s
       LEFT JOIN pos_profiles pr ON pr.id = s.seller_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY s.created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const sales = await Promise.all(
      salesR.rows.map(async (s) => {
        const itemsR = await db.query(
          `SELECT si.*, COALESCE(si.line_name, p.name) AS product_name
           FROM pos_sale_items si
           JOIN pos_products p ON p.id = si.product_id
           WHERE si.sale_id = $1`,
          [s.id]
        );
        return {
          ...s,
          seller: s.seller_full_name ? { full_name: s.seller_full_name } : null,
          items: itemsR.rows.map((it) => ({
            ...it,
            product: { name: it.product_name },
            subtotal: it.subtotal,
            qty: it.qty,
          })),
        };
      })
    );

    const total = countR.rows[0].total;
    formatResponse(res, 200, true, 'Sales fetched', {
      sales,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
