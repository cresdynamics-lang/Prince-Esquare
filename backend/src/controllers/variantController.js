const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { generateVariantSku } = require('../utils/sku');

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
    const { name, value, price_modifier = 0, stock_quantity = 0, stock_id = null, sku = null, size = null, color = null } = req.body;
    const productR = await db.query('SELECT sku, slug, name FROM products WHERE id = $1', [id]);
    const productSku = productR.rows[0]?.sku || productR.rows[0]?.slug || productR.rows[0]?.name;
    const variantSku = generateVariantSku(productSku, { sku, stock_id, size, color });
    try {
        const result = await db.query(
            'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, sku, stock_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, name, value, price_modifier, stock_quantity, variantSku, variantSku]
        );
        formatResponse(res, 201, true, 'Variant added successfully', result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateVariant = async (req, res, next) => {
    const { variantId } = req.params;
    const { name, value, price_modifier, stock_quantity, stock_id = null, sku = null, size = null, color = null } = req.body;
    const existing = await db.query(
        'SELECT pv.*, p.sku AS product_sku, p.slug, p.name AS product_name FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE pv.id = $1',
        [variantId]
    );
    const row = existing.rows[0] || {};
    const variantSku = generateVariantSku(row.product_sku || row.slug || row.product_name, {
        sku: sku || stock_id,
        stock_id,
        size: size || row.size,
        color: color || row.color,
    });
    try {
        const result = await db.query(
            'UPDATE product_variants SET name = $1, value = $2, price_modifier = $3, stock_quantity = $4, sku = $5, stock_id = $6 WHERE id = $7 RETURNING *',
            [name, value, price_modifier, stock_quantity, variantSku, variantSku, variantId]
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
