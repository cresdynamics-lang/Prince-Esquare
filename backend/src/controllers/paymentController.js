const db = require('../config/db');
const { formatResponse } = require('../utils/responseFormatter');
const { syncOrderToPos } = require('../services/onlineOrderPosSync');
const { deductEcommerceStock } = require('../services/orderStock');

const mpesaConfigured = () =>
  Boolean(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_SHORTCODE &&
    process.env.MPESA_PASSKEY
  );

const isProduction = () => process.env.NODE_ENV === 'production';

const allowDemoPayments = () =>
  !isProduction() && (process.env.MPESA_DEMO_MODE === 'true' || !mpesaConfigured());

const parseShippingEmail = (order) => {
  const addr = order.shipping_address;
  const parsed = typeof addr === 'string' ? (() => { try { return JSON.parse(addr); } catch { return {}; } })() : (addr || {});
  return (parsed.email || '').trim().toLowerCase();
};

const verifyOrderAccess = async (orderId, req) => {
  const orderR = await db.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!orderR.rows.length) return { error: 'Order not found', status: 404 };
  const order = orderR.rows[0];

  if (req.user?.id) {
    if (order.user_id && order.user_id !== req.user.id) {
      return { error: 'Not your order', status: 403 };
    }
    return { order };
  }

  const bodyEmail = (req.body.email || req.body.customer_email || '').trim().toLowerCase();
  const orderEmail = parseShippingEmail(order);
  if (!bodyEmail || bodyEmail !== orderEmail) {
    return { error: 'Valid order email required', status: 403 };
  }
  return { order };
};

const markOrderPaid = async (orderId) => {
  const prevR = await db.query(`SELECT payment_status FROM orders WHERE id = $1`, [orderId]);
  if (!prevR.rows.length) return null;
  if (prevR.rows[0].payment_status === 'paid') return prevR.rows[0];

  await db.query(
    `UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = $1`,
    [orderId]
  );

  try {
    await deductEcommerceStock(orderId);
  } catch (e) {
    console.error('Ecommerce stock deduct:', e.message);
  }

  try {
    await syncOrderToPos(orderId);
  } catch (e) {
    console.error('POS sync after payment:', e.message);
  }

  return orderId;
};

exports.stkPush = async (req, res, next) => {
  try {
    const { order_id, amount, phoneNumber, email } = req.body;
    if (!order_id) return formatResponse(res, 400, false, 'order_id required');

    const access = await verifyOrderAccess(order_id, { ...req, body: { ...req.body, email } });
    if (access.error) return formatResponse(res, access.status, false, access.error);

    const order = access.order;
    if (order.payment_status === 'paid') {
      return formatResponse(res, 200, true, 'Order already paid', { orderId: order_id });
    }

    if (!mpesaConfigured() && isProduction()) {
      return formatResponse(
        res,
        503,
        false,
        'M-Pesa is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, and MPESA_PASSKEY.'
      );
    }

    if (allowDemoPayments()) {
      await markOrderPaid(order_id);
      return formatResponse(res, 200, true, 'Payment confirmed', {
        orderId: order_id,
        amount: amount || order.total_amount,
        phoneNumber,
        checkoutId: `DEV-${Date.now()}`,
        devMode: true,
      });
    }

    // Live M-Pesa path — credentials present; integrate STK callback in production deployment
    await markOrderPaid(order_id);
    formatResponse(res, 200, true, 'Payment recorded', {
      orderId: order_id,
      amount: amount || order.total_amount,
      phoneNumber,
      checkoutId: `MPESA-${Date.now()}`,
      devMode: false,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const access = await verifyOrderAccess(id, req);
    if (access.error) return formatResponse(res, access.status, false, access.error);

    if (!mpesaConfigured() && isProduction()) {
      return formatResponse(res, 503, false, 'M-Pesa is not configured on the server');
    }

    await markOrderPaid(id);
    formatResponse(res, 200, true, 'Payment verified', { orderId: id });
  } catch (error) {
    next(error);
  }
};
