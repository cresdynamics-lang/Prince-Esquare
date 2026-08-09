const db = require('../config/db');
const { getIO } = require('../lib/socket');

function emitVisitorActivity(payload) {
  try {
    const io = getIO();
    if (io) io.emit('visitor:activity', payload);
  } catch {
    /* optional realtime */
  }
}

async function recordSiteEvent({
  sessionId,
  eventType,
  path = null,
  productId = null,
  productSlug = null,
  productName = null,
  productPrice = null,
}) {
  if (!sessionId || !eventType) return;

  const result = await db.query(
    `INSERT INTO site_visitor_events
      (session_id, event_type, path, product_id, product_slug, product_name, product_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, session_id, event_type, path, product_slug, product_name, product_price, created_at`,
    [
      sessionId,
      eventType,
      path,
      productId || null,
      productSlug || null,
      productName || null,
      productPrice != null ? productPrice : null,
    ]
  );

  const row = result.rows[0];
  if (row) {
    emitVisitorActivity({
      id: row.id,
      sessionId: row.session_id,
      eventType: row.event_type,
      path: row.path,
      productSlug: row.product_slug,
      productName: row.product_name,
      productPrice: row.product_price,
      createdAt: row.created_at,
    });
  }
}

module.exports = { recordSiteEvent, emitVisitorActivity };
