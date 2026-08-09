const db = require('../config/db');

/** Fire-and-forget product analytics event (never blocks storefront). */
function recordProductEvent(productId, eventType, quantity = 1) {
    if (!productId || !eventType) return;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    db.query(
        'INSERT INTO product_events (product_id, event_type, quantity) VALUES ($1, $2, $3)',
        [productId, eventType, qty]
    ).catch(() => {});
}

module.exports = { recordProductEvent };
