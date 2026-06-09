const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getMediaStorageStatus } = require('../lib/mediaStorage');

router.get('/data', async (_req, res) => {
  try {
    const [products, variants, orders, posProducts, links] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS c FROM products WHERE is_active = true'),
      db.query('SELECT COUNT(*)::int AS c FROM product_variants'),
      db.query('SELECT COUNT(*)::int AS c FROM orders'),
      db.query('SELECT COUNT(*)::int AS c FROM pos_products'),
      db.query('SELECT COUNT(*)::int AS c FROM products WHERE pos_stock_product_id IS NOT NULL'),
    ]);

    const media = getMediaStorageStatus();
    res.json({
      success: true,
      data: {
        activeProducts: products.rows[0].c,
        variants: variants.rows[0].c,
        orders: orders.rows[0].c,
        posProducts: posProducts.rows[0].c,
        linkedProducts: links.rows[0].c,
        autoBootstrap: process.env.AUTO_BOOTSTRAP === 'true',
        mediaStorage: media,
        mpesaConfigured: Boolean(
          process.env.MPESA_CONSUMER_KEY &&
          process.env.MPESA_CONSUMER_SECRET &&
          process.env.MPESA_SHORTCODE &&
          process.env.MPESA_PASSKEY
        ),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
