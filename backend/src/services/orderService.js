const db = require('../config/db');
const { resolveOrderLines } = require('./orderStock');

const SHIPPING_FLAT = parseFloat(process.env.ORDER_SHIPPING_FLAT || '0');
const VAT_RATE = parseFloat(process.env.ORDER_VAT_RATE || '0');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

/** Kenya-friendly phone key: last 9 digits. */
const phoneKey = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 9) return '';
  return digits.slice(-9);
};

const replaceOrderItems = async (client, orderId, lines) => {
  await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
  for (const item of lines) {
    const unit = parseFloat(item.price) + parseFloat(item.price_modifier || 0);
    await client.query(
      `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, size_label)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, item.product_id, item.variant_id, item.quantity, unit, item.size_label || null]
    );
  }
};

/**
 * Save / update a draft order capturing phone + bag before Place order.
 * Does not clear cart and never marks paid.
 */
const upsertDraftOrder = async ({
  userId = null,
  items,
  shipping_address,
  billing_address,
  draftId = null,
  payment_method = 'draft_capture',
}) => {
  const phone = phoneKey(shipping_address?.phone);
  if (!phone) {
    const err = new Error('A valid phone number is required to save your order details');
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Add at least one product to save order details');
    err.statusCode = 400;
    throw err;
  }

  const addr = {
    first_name: shipping_address.first_name || '',
    last_name: shipping_address.last_name || '',
    email: shipping_address.email || `${phone}@guest.prince-esquire.co.ke`,
    phone: shipping_address.phone || phone,
    line1: shipping_address.line1 || 'Details pending at checkout',
    city: shipping_address.city || 'Nairobi',
    country: shipping_address.country || 'Kenya',
    fulfillment_method: shipping_address.fulfillment_method || '',
    delivery_zone: shipping_address.delivery_zone || '',
    payment_choice: shipping_address.payment_choice || '',
    stage: 'draft_capture',
    phone_key: phone,
  };

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const lines = await resolveOrderLines(items, client, { skipStock: true });
    const { tax, shipping, total } = calcTotals(lines);

    let existingId = null;
    if (draftId && UUID_RE.test(String(draftId))) {
      const found = await client.query(
        `SELECT id FROM orders
         WHERE id = $1 AND is_draft = true AND payment_status = 'pending'
         LIMIT 1`,
        [draftId]
      );
      if (found.rows[0]) existingId = found.rows[0].id;
    }
    if (!existingId && userId) {
      const found = await client.query(
        `SELECT id FROM orders
         WHERE is_draft = true AND payment_status = 'pending' AND user_id = $1
         ORDER BY updated_at DESC NULLS LAST, created_at DESC
         LIMIT 1`,
        [userId]
      );
      if (found.rows[0]) existingId = found.rows[0].id;
    }
    if (!existingId) {
      const found = await client.query(
        `SELECT id FROM orders
         WHERE is_draft = true AND payment_status = 'pending'
           AND regexp_replace(COALESCE(shipping_address->>'phone', ''), '\\D', '', 'g') LIKE '%' || $1
         ORDER BY updated_at DESC NULLS LAST, created_at DESC
         LIMIT 1`,
        [phone]
      );
      if (found.rows[0]) existingId = found.rows[0].id;
    }

    let order;
    if (existingId) {
      const updated = await client.query(
        `UPDATE orders SET
           user_id = COALESCE($2, user_id),
           total_amount = $3,
           tax_amount = $4,
           shipping_amount = $5,
           payment_method = $6,
           shipping_address = $7::jsonb,
           billing_address = $8::jsonb,
           is_draft = true,
           status = 'pending',
           payment_status = 'pending',
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          existingId,
          userId,
          total,
          tax,
          shipping,
          payment_method || 'draft_capture',
          JSON.stringify(addr),
          JSON.stringify(billing_address || addr),
        ]
      );
      order = updated.rows[0];
      await replaceOrderItems(client, order.id, lines);
    } else {
      const inserted = await client.query(
        `INSERT INTO orders (
           user_id, total_amount, tax_amount, shipping_amount, payment_method,
           shipping_address, billing_address, coupon_id, is_draft, status, payment_status
         ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,NULL,true,'pending','pending')
         RETURNING *`,
        [
          userId,
          total,
          tax,
          shipping,
          payment_method || 'draft_capture',
          JSON.stringify(addr),
          JSON.stringify(billing_address || addr),
        ]
      );
      order = inserted.rows[0];
      await replaceOrderItems(client, order.id, lines);
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

/** Mark prior drafts for this phone / id closed after a real order is placed. */
const closeRelatedDrafts = async (client, { draftId, phone, excludeOrderId }) => {
  const key = phoneKey(phone);
  const params = [];
  const parts = ['is_draft = true', "payment_status = 'pending'"];
  if (excludeOrderId) {
    params.push(excludeOrderId);
    parts.push(`id <> $${params.length}`);
  }
  const or = [];
  if (draftId && UUID_RE.test(String(draftId))) {
    params.push(draftId);
    or.push(`id = $${params.length}`);
  }
  if (key) {
    params.push(key);
    or.push(
      `regexp_replace(COALESCE(shipping_address->>'phone', ''), '\\D', '', 'g') LIKE '%' || $${params.length}`
    );
  }
  if (!or.length) return;
  parts.push(`(${or.join(' OR ')})`);
  await client.query(
    `UPDATE orders
     SET is_draft = false, status = 'cancelled', updated_at = NOW()
     WHERE ${parts.join(' AND ')}`,
    params
  );
};

/**
 * @param {object} opts
 */
const createOrderFromItems = async ({
  userId = null,
  items,
  shipping_address,
  billing_address,
  payment_method = 'mpesa',
  couponId = null,
  clearUserCart = false,
  draftId = null,
}) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const lines = await resolveOrderLines(items, client, { skipStock: true });
    const { tax, shipping, total } = calcTotals(lines);

    const orderResult = await client.query(
      `INSERT INTO orders (
         user_id, total_amount, tax_amount, shipping_amount, payment_method,
         shipping_address, billing_address, coupon_id, is_draft, status, payment_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 'pending', 'pending') RETURNING *`,
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

    await replaceOrderItems(client, order.id, lines);

    if (clearUserCart && userId) {
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    }

    await closeRelatedDrafts(client, {
      draftId,
      phone: shipping_address?.phone,
      excludeOrderId: order.id,
    });

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
  upsertDraftOrder,
  phoneKey,
  closeRelatedDrafts,
};
