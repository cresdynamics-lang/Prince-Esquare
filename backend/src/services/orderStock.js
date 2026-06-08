const db = require('../config/db');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeVariantId = (value) => {
  if (!value) return null;
  const id = String(value).trim();
  return UUID_RE.test(id) ? id : null;
};

const stockError = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

/** Resolve cart/guest lines with authoritative DB pricing and stock checks */
const resolveOrderLines = async (rawItems, client = db) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw stockError('No items in order');
  }

  const lines = [];

  for (const raw of rawItems) {
    const productId = raw.product_id || raw.productId;
    if (!productId || !UUID_RE.test(String(productId))) {
      throw stockError('Invalid product in order');
    }

    const qty = Math.max(1, parseInt(raw.quantity, 10) || 1);
    const variantId = normalizeVariantId(raw.variant_id || raw.variantId);
    const sizeLabel = raw.size_label || raw.sizeLabel || null;

    const productR = await client.query(
      'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = $1',
      [productId]
    );
    if (!productR.rows.length || !productR.rows[0].is_active) {
      throw stockError(`Product unavailable: ${productId}`);
    }

    const product = productR.rows[0];
    let unitPrice = parseFloat(product.price);
    let priceModifier = 0;

    if (variantId) {
      const variantR = await client.query(
        'SELECT id, stock_quantity, price_modifier FROM product_variants WHERE id = $1 AND product_id = $2',
        [variantId, productId]
      );
      if (!variantR.rows.length) {
        throw stockError(`Variant unavailable for ${product.name}`);
      }
      const variant = variantR.rows[0];
      if (Number(variant.stock_quantity) < qty) {
        throw stockError(`Not enough stock for ${product.name} (size ${sizeLabel || 'selected'})`);
      }
      priceModifier = parseFloat(variant.price_modifier || 0);
    } else {
      const variantsR = await client.query(
        'SELECT COUNT(*)::int AS cnt FROM product_variants WHERE product_id = $1',
        [productId]
      );
      const hasVariants = variantsR.rows[0]?.cnt > 0;
      if (hasVariants) {
        throw stockError(`Please select a size/variant for ${product.name}`);
      }
      if (Number(product.stock_quantity) < qty) {
        throw stockError(`Not enough stock for ${product.name}`);
      }
    }

    lines.push({
      product_id: productId,
      variant_id: variantId,
      quantity: qty,
      size_label: sizeLabel,
      price: unitPrice,
      price_modifier: priceModifier,
    });
  }

  return lines;
};

const deductEcommerceStock = async (orderId, client = db) => {
  const itemsR = await client.query(
    `SELECT oi.product_id, oi.variant_id, oi.quantity, p.name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  for (const item of itemsR.rows) {
    if (item.variant_id) {
      const r = await client.query(
        `UPDATE product_variants
         SET stock_quantity = GREATEST(0, stock_quantity - $1)
         WHERE id = $2 AND product_id = $3
         RETURNING stock_quantity`,
        [item.quantity, item.variant_id, item.product_id]
      );
      if (!r.rows.length) {
        console.warn(`Stock deduct: variant missing for order ${orderId}`);
      }
    } else {
      await client.query(
        `UPDATE products
         SET stock_quantity = GREATEST(0, stock_quantity - $1)
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }
  }
};

const restoreEcommerceStock = async (orderId, client = db) => {
  const itemsR = await client.query(
    'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1',
    [orderId]
  );

  for (const item of itemsR.rows) {
    if (item.variant_id) {
      await client.query(
        'UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [item.quantity, item.variant_id]
      );
    } else {
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
  }
};

module.exports = {
  normalizeVariantId,
  resolveOrderLines,
  deductEcommerceStock,
  restoreEcommerceStock,
};
