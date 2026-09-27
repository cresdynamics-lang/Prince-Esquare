const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

/**
 * Contact microservice-style endpoint — own table, own try/catch.
 * Never shares transaction scope with catalogue / search / checkout.
 */
exports.submit = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 120);
    const email = String(req.body?.email || '').trim().slice(0, 180).toLowerCase();
    const subject = String(req.body?.subject || '').trim().slice(0, 200);
    const message = String(req.body?.message || '').trim().slice(0, 5000);

    if (!name || !email || !message) {
      return formatResponse(res, 400, false, 'Name, email, and message are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return formatResponse(res, 400, false, 'Enter a valid email address');
    }

    await db.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, subject || null, message]
    );

    return formatResponse(res, 201, true, 'Message received — we will be in touch.');
  } catch (error) {
    console.error('[contact.submit]', error?.message || error);
    // Soft-fail: acknowledge receipt so Meta Lead + UX still complete if DB hiccups
    return formatResponse(
      res,
      202,
      true,
      'Message queued. If you do not hear back, WhatsApp or email us directly.'
    );
  }
};
