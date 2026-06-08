// MODIFIED — Sync paid ecommerce orders to POS (linked products + name match)
const db = require('../config/db');
const { processSale } = require('./posSaleService');
const { findPosProductForEcommerce } = require('./productPosLink');

const syncOrderToPos = async (orderId) => {
  const orderRes = await db.query(
    `SELECT o.* FROM orders o WHERE o.id = $1`,
    [orderId]
  );
  if (!orderRes.rows.length) return null;

  const order = orderRes.rows[0];
  const itemsRes = await db.query(
    `SELECT oi.*, p.name, p.pos_stock_product_id
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  const saleItems = [];
  const unmatched = [];

  for (const item of itemsRes.rows) {
    let posProduct = null;

    if (item.pos_stock_product_id) {
      const r = await db.query(`SELECT id FROM pos_products WHERE id = $1`, [item.pos_stock_product_id]);
      if (r.rows.length) posProduct = r.rows[0];
    }

    if (!posProduct) {
      const found = await findPosProductForEcommerce(item.product_id, item.name);
      if (found) posProduct = { id: found.id };
    }

    if (!posProduct) {
      unmatched.push(item.name);
      continue;
    }

    saleItems.push({
      productId: posProduct.id,
      qty: item.quantity,
      unitPrice: parseFloat(item.price),
    });
  }

  if (unmatched.length) {
    console.warn(`POS sync order ${orderId}: unmatched items:`, unmatched.join(', '));
  }
  if (!saleItems.length) return null;

  return processSale({
    channel: 'ONLINE',
    paymentMethod: 'ONLINE',
    discountAmount: parseFloat(order.discount_amount || 0),
    items: saleItems,
    orderId,
    auditDetails: { orderId, ecommerce: true, unmatched },
  });
};

module.exports = { syncOrderToPos };
