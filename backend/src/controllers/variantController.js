const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

exports.getVariants = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);
        formatResponse(res, 200, true, 'Variants fetched', result.rows);
    } catch (error) {
        next(error);
    }
};

exports.addVariant = async (req, res, next) => {
    const { id } = req.params;
    const { name, value, price_modifier = 0, stock_quantity = 0, stock_id = null } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, stock_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, name, value, price_modifier, stock_quantity, stock_id]
        );
        formatResponse(res, 201, true, 'Variant added successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateVariant = async (req, res, next) => {
    const { variantId } = req.params;
    const { name, value, price_modifier, stock_quantity, stock_id = null } = req.body;
    try {
        const result = await db.query(
            'UPDATE product_variants SET name = $1, value = $2, price_modifier = $3, stock_quantity = $4, stock_id = $5 WHERE id = $6 RETURNING *',
            [name, value, price_modifier, stock_quantity, stock_id, variantId]
        );
        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Variant not found');
        }
        formatResponse(res, 200, true, 'Variant updated successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteVariant = async (req, res, next) => {
    const { variantId } = req.params;
    try {
        const result = await db.query('DELETE FROM product_variants WHERE id = $1 RETURNING id', [variantId]);
        if (result.rows.length === 0) {
            return formatResponse(res, 404, false, 'Variant not found');
        }
        formatResponse(res, 200, true, 'Variant deleted successfully');
    } catch (error) {
        next(error);
    }
};
