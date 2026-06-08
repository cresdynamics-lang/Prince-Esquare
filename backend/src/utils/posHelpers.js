// MODIFIED — POS helpers (raw SQL + Socket.io)
const db = require('../config/db');
const { getIO } = require('../lib/socket');
const transporter = require('../config/email');

const formatDateYMD = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const emitStockUpdated = (productId, newQty, extra = {}) => {
  const io = getIO();
  if (io) {
    io.emit('stock:updated', {
      productId,
      newQty,
      location: 'shop',
      ...extra,
    });
  }
};

const emitStoreStockUpdated = (productId, newQty, extra = {}) => {
  const io = getIO();
  if (io) {
    io.emit('store:updated', {
      productId,
      newQty,
      location: 'store',
      ...extra,
    });
  }
};

const checkLowStockAndAlert = async (product) => {
  const stockR = await db.query(
    `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
    [product.id]
  );
  const currentQty = stockR.rows[0]?.current_qty ?? 0;
  const thresholdR = await db.query(
    `SELECT low_stock_threshold FROM pos_products WHERE id = $1`,
    [product.id]
  );
  const threshold = thresholdR.rows[0]?.low_stock_threshold ?? 5;
  if (currentQty > threshold) return;

  const settingsRes = await db.query(
    "SELECT key, value FROM settings WHERE key IN ('pos_low_stock_email')"
  );
  const emailMap = Object.fromEntries(settingsRes.rows.map((r) => [r.key, r.value]));
  const alertEmail = emailMap.pos_low_stock_email || process.env.ADMIN_EMAIL;

  if (alertEmail && process.env.EMAIL_HOST) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: alertEmail,
        subject: `Low stock: ${product.name}`,
        text: `${product.name} is at ${currentQty} units (threshold: ${threshold}).`,
      });
    } catch (e) {
      console.error('Low stock email failed:', e.message);
    }
  }

  const io = getIO();
  if (io) {
    io.emit('stock:lowAlert', {
      productId: product.id,
      productName: product.name,
      currentQty,
      threshold,
    });
  }
};

const isAdminRole = (user) =>
  user &&
  ((user.accountType === 'user' && ['admin', 'staff'].includes(user.role)) ||
    (user.accountType === 'pos' && user.role === 'ADMIN'));

const isSellerRole = (user) =>
  user && user.accountType === 'pos' && user.role === 'SELLER';

module.exports = {
  emitStockUpdated,
  emitStoreStockUpdated,
  checkLowStockAndAlert,
  isAdminRole,
  isSellerRole,
  formatDateYMD,
};
