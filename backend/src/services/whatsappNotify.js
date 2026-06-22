const axios = require('axios');
const db = require('../config/db');

const NOTIFY_PHONE = (process.env.WHATSAPP_NOTIFY_PHONE || '254724494089').replace(/\D/g, '');
const CALLMEBOT_KEY = (process.env.WHATSAPP_CALLMEBOT_API_KEY || '').trim();
const CLOUD_TOKEN = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
const CLOUD_PHONE_ID = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const MPESA_TILL = (process.env.MPESA_TILL || process.env.VITE_MPESA_TILL || '').trim();

const parseAddress = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
};

const buildTrackUrl = (orderId, email) => {
  const url = new URL(`${FRONTEND_URL}/payment/${orderId}`);
  if (email) url.searchParams.set('email', email.trim().toLowerCase());
  return url.toString();
};

const buildStoreOrderMessage = (order, items) => {
  const addr = parseAddress(order.shipping_address);
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(' ').trim() || 'Customer';
  const shortId = String(order.id || '').slice(0, 8).toUpperCase();
  const total = Math.round(Number(order.total_amount || 0));
  const email = (addr.email || '').trim().toLowerCase();
  const trackUrl = buildTrackUrl(order.id, email);

  const itemLines = (items || []).map((item) => {
    const qty = Number(item.quantity || 1);
    const lineTotal = Math.round(Number(item.price || 0) * qty);
    const size = item.size_label ? ` · ${item.size_label}` : '';
    return `- ${item.name}${size} × ${qty} — KSh ${lineTotal.toLocaleString()}`;
  });

  const lines = [
    '🛍️ *New Prince Esquire order*',
    '',
    `Order #${shortId}`,
    `Total: KSh ${total.toLocaleString()}`,
    `Payment: ${order.payment_method || 'pending'}`,
    '',
    `Customer: ${name}`,
    `Phone: ${addr.phone || '—'}`,
    `Delivery: ${[addr.line1, addr.city].filter(Boolean).join(', ') || '—'}`,
    '',
    'Items:',
    ...(itemLines.length ? itemLines : ['- (see order link)']),
    '',
    `Order link: ${trackUrl}`,
  ];

  if (MPESA_TILL) {
    lines.push('', `M-Pesa Till: ${MPESA_TILL}`);
  }

  return lines.join('\n');
};

const sendViaCallMeBot = async (text) => {
  await axios.get('https://api.callmebot.com/whatsapp.php', {
    params: {
      phone: NOTIFY_PHONE,
      text,
      apikey: CALLMEBOT_KEY,
    },
    timeout: 15000,
  });
};

const sendViaCloudApi = async (text) => {
  await axios.post(
    `https://graph.facebook.com/v21.0/${CLOUD_PHONE_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: NOTIFY_PHONE,
      type: 'text',
      text: { body: text },
    },
    {
      headers: { Authorization: `Bearer ${CLOUD_TOKEN}` },
      timeout: 15000,
    }
  );
};

/** Send new-order alert to the store WhatsApp number (fire-and-forget safe). */
const notifyStoreNewOrder = async (order, items = []) => {
  const message = buildStoreOrderMessage(order, items);

  if (CALLMEBOT_KEY) {
    await sendViaCallMeBot(message);
    return { sent: true, channel: 'callmebot' };
  }

  if (CLOUD_TOKEN && CLOUD_PHONE_ID) {
    await sendViaCloudApi(message);
    return { sent: true, channel: 'cloud_api' };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[whatsapp notify — dev, no credentials configured]\n', message);
  } else {
    console.warn('[whatsapp notify] skipped — set WHATSAPP_CALLMEBOT_API_KEY or WhatsApp Cloud API credentials');
  }
  return { sent: false, channel: 'skipped' };
};

/** Load order + line items and notify the store. */
const notifyStoreForOrderId = async (orderId) => {
  const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!orderResult.rows.length) return { sent: false, channel: 'missing_order' };

  const itemsResult = await db.query(
    `SELECT oi.*, p.name
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return notifyStoreNewOrder(orderResult.rows[0], itemsResult.rows);
};

module.exports = {
  notifyStoreNewOrder,
  notifyStoreForOrderId,
  buildStoreOrderMessage,
};
