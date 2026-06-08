// MODIFIED — POS seller management (raw SQL)
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../../config/db');
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');

exports.createSeller = async (req, res, next) => {
  try {
    const schema = Joi.object({
      fullName: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const exists = await posDb.findProfileByEmail(value.email);
    if (exists) return formatResponse(res, 400, false, 'Email already in use');

    const hash = await bcrypt.hash(value.password, 10);
    const r = await db.query(
      `INSERT INTO pos_profiles (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'SELLER') RETURNING id, full_name, email, role, is_active`,
      [value.fullName, value.email, hash]
    );
    const seller = r.rows[0];

    formatResponse(res, 201, true, 'Seller created', {
      id: seller.id,
      fullName: seller.full_name,
      email: seller.email,
      role: seller.role,
      is_active: seller.is_active,
    });
  } catch (error) {
    next(error);
  }
};

exports.listSellers = async (req, res, next) => {
  try {
    const sellers = await posDb.listSellers();
    formatResponse(res, 200, true, 'Sellers fetched', sellers);
  } catch (error) {
    next(error);
  }
};

exports.toggleSeller = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT * FROM pos_profiles WHERE id = $1 AND role = 'SELLER'`,
      [req.params.id]
    );
    if (!r.rows.length) return formatResponse(res, 404, false, 'Seller not found');

    const upd = await db.query(
      `UPDATE pos_profiles SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    formatResponse(res, 200, true, 'Seller updated', upd.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.sellerSales = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const countR = await db.query(
      `SELECT COUNT(*)::int AS total FROM pos_sales WHERE seller_id = $1`,
      [req.params.id]
    );
    const salesR = await db.query(
      `SELECT * FROM pos_sales WHERE seller_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.params.id, limit, skip]
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

    formatResponse(res, 200, true, 'Seller sales fetched', {
      sales,
      pagination: { page, limit, total: countR.rows[0].total },
    });
  } catch (error) {
    next(error);
  }
};
