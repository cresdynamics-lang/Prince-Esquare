const db = require('../config/db');
const { resolveOrderLines } = require('./orderStock');

const SHIPPING_FLAT = parseFloat(process.env.ORDER_SHIPPING_FLAT || '0');
const VAT_RATE = parseFloat(process.env.ORDER_VAT_RATE || '0');

const calcTotals = (lines) => {
  let subtotal = 0;
  lines.forEach((item) => {
    const unit = parseFloat(item.price) + parseFloat(item.price_modifier || 0);
    subtotal += unit * item.quantity;
  });
  const tax = Math.round(subtotal * VAT_RATE * 100) / 100;
  const shipping = SHIPPING_FLAT;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;
  return { subtotal, tax, shipping, total };
};

/**
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {Array} opts.items - raw cart/guest items
 * @param {object} opts.shipping_address
 * @param {object} [opts.billing_address]
 * @param {string} [opts.payment_method]
 * @param {string|null} [opts.couponId]
 * @param {boolean} [opts.clearUserCart]
 */
const createOrderFromItems = async ({
  userId = null,
  items,
  shipping_address,
  billing_address,
  payment_method = 'mpesa',
  couponId = null,
  clearUserCart = false,
}) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const lines = await resolveOrderLines(items, client);
    const { tax, shipping, total } = calcTotals(lines);

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, tax_amount, shipping_amount, payment_method, shipping_address, billing_address, coupon_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        total,
        tax,
        shipping,
        payment_method,
        JSON.stringify(shipping_address),
        JSON.stringify(billing_address || shipping_address),
        couponId,
      ]
    );
    const order = orderResult.rows[0];

    for (const item of lines) {
      const unit = parseFloat(item.price) + parseFloat(item.price_modifier || 0);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, size_label)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.variant_id, item.quantity, unit, item.size_label || null]
      );
    }

    if (clearUserCart && userId) {
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    }

    await client.query('COMMIT');
    return order;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const cartRowsToItems = (rows) =>
  rows.map((row) => ({
    product_id: row.product_id,
    variant_id: row.variant_id,
    quantity: row.quantity,
    size_label: row.size_label,
  }));

module.exports = {
  SHIPPING_FLAT,
  VAT_RATE,
  calcTotals,
  createOrderFromItems,
  cartRowsToItems,
};
