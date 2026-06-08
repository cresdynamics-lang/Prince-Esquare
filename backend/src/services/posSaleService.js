// MODIFIED — POS sale logic (raw SQL, no Prisma required)
const db = require('../config/db');
const { formatDateYMD } = require('../utils/posHelpers');
const { getLinkedEcommerceIdsForPos } = require('./productPosLink');

const generateReceiptNumber = async (client) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const r = await client.query(
    `SELECT COUNT(*)::int AS c FROM pos_sales WHERE created_at >= $1 AND created_at < $2`,
    [today, tomorrow]
  );
  const seq = String(r.rows[0].c + 1).padStart(4, '0');
  return `PE-${formatDateYMD(today)}-${seq}`;
};

/** POS uses inventory shop_price; online uses ecommerce catalogue price. */
const resolveSaleItemPricing = async (client, item, channel) => {
  if (channel === 'POS') {
    const posR = await client.query(
      `SELECT id, name, shop_price, ecommerce_product_id FROM pos_products WHERE id = $1`,
      [item.productId]
    );
    if (!posR.rows.length) {
      throw Object.assign(new Error(`Stock product not found: ${item.productId}`), { statusCode: 400 });
    }
    const pos = posR.rows[0];
    let unitPrice = null;
    let lineName = (item.lineName || '').trim() || null;

    if (item.ecommerceProductId) {
      const pr = await client.query(
        `SELECT name,
                COALESCE(pos_sell_price, NULLIF(discount_price, 0), price) AS sell_price
         FROM products WHERE id = $1`,
        [item.ecommerceProductId]
      );
      if (pr.rows.length) {
        unitPrice =
          item.unitPrice != null ? parseFloat(item.unitPrice) : parseFloat(pr.rows[0].sell_price);
        lineName = lineName || pr.rows[0].name;
      }
    }

    if (unitPrice == null) {
      unitPrice = item.unitPrice != null ? parseFloat(item.unitPrice) : parseFloat(pos.shop_price);
      lineName = lineName || pos.name;
    }

    if (item.variantId && item.ecommerceProductId) {
      const vr = await client.query(
        `SELECT price_modifier FROM product_variants
         WHERE id = $1 AND product_id = $2`,
        [item.variantId, item.ecommerceProductId]
      );
      if (vr.rows.length) {
        unitPrice += parseFloat(vr.rows[0].price_modifier || 0);
      }
    }

    return {
      ...item,
      productId: pos.id,
      unitPrice: Math.round(unitPrice * 100) / 100,
      lineName,
      ecommerceProductId: item.ecommerceProductId || pos.ecommerce_product_id || null,
    };
  }

  if (item.ecommerceProductId) {
    const pr = await client.query(
      `SELECT name, COALESCE(NULLIF(discount_price, 0), price) AS sell_price
       FROM products WHERE id = $1 AND is_active = true`,
      [item.ecommerceProductId]
    );
    if (!pr.rows.length) {
      throw Object.assign(new Error(`Product not found: ${item.ecommerceProductId}`), {
        statusCode: 400,
      });
    }

    let unitPrice = parseFloat(pr.rows[0].sell_price);
    const lineName = (item.lineName || pr.rows[0].name || '').trim() || pr.rows[0].name;

    if (item.variantId) {
      const vr = await client.query(
        `SELECT price_modifier FROM product_variants
         WHERE id = $1 AND product_id = $2`,
        [item.variantId, item.ecommerceProductId]
      );
      if (!vr.rows.length) {
        throw Object.assign(new Error('Invalid variant for this product'), { statusCode: 400 });
      }
      unitPrice += parseFloat(vr.rows[0].price_modifier || 0);
    }

    return {
      ...item,
      unitPrice: Math.round(unitPrice * 100) / 100,
      lineName,
      ecommerceProductId: item.ecommerceProductId,
    };
  }

  const pr = await client.query(`SELECT shop_price FROM pos_products WHERE id = $1`, [item.productId]);
  if (!pr.rows.length) {
    throw Object.assign(new Error(`Stock product not found: ${item.productId}`), { statusCode: 400 });
  }
  return {
    ...item,
    unitPrice: parseFloat(pr.rows[0].shop_price),
    lineName: item.lineName || null,
  };
};

const emitStockUpdated = async (productId, newQty) => {
  const { emitStockUpdated: emit, checkLowStockAndAlert } = require('../utils/posHelpers');
  const linked = await getLinkedEcommerceIdsForPos(productId);
  const prod = await db.query(`SELECT name, sku, category FROM pos_products WHERE id = $1`, [productId]);
  emit(productId, newQty, {
    posProductName: prod.rows[0]?.name,
    ecommerceProductIds: linked.map((r) => r.id),
  });
  if (prod.rows[0]) {
    await checkLowStockAndAlert({ id: productId, name: prod.rows[0].name });
  }
  if (prod.rows[0]?.sku?.startsWith('PE-CAT-') && !prod.rows[0].sku.includes('-W-')) {
    const { syncLegacyBucketsFromPeCatalog, syncWebsiteStockFromPosShop } = require('./inventoryWarehouseSync');
    try {
      await syncLegacyBucketsFromPeCatalog();
      await syncWebsiteStockFromPosShop();
    } catch (e) {
      console.error('Post-sale stock sync warning:', e.message);
    }
  }
};

const assertSellableOnShopFloor = async (client, productId, qty, channel, ecommerceProductId = null) => {
  if (channel !== 'POS') return { legacyWebsiteSale: false };
  const r = await client.query(
    `SELECT p.id, p.sku, p.category, COALESCE(s.current_qty, 0)::int AS shop_qty
     FROM pos_products p
     LEFT JOIN pos_stock_levels s ON s.product_id = p.id
     WHERE p.id = $1`,
    [productId]
  );
  if (!r.rows.length) {
    throw Object.assign(new Error(`Stock product not found: ${productId}`), { statusCode: 400 });
  }
  const row = r.rows[0];
  const sku = String(row.sku || '');

  if (sku.startsWith('POS-')) {
    const web = await client.query(
      `SELECT 1 FROM products WHERE is_active = true AND pos_stock_product_id = $1 LIMIT 1`,
      [productId]
    );
    if (!web.rows.length && !ecommerceProductId) {
      throw Object.assign(
        new Error('This item uses old bucket stock — sell a shop-floor piece (PE-CAT SKU) instead'),
        { statusCode: 400 }
      );
    }
    const { LEGACY_SKU_TO_CATEGORY } = require('./inventoryWarehouseSync');
    const cat = LEGACY_SKU_TO_CATEGORY[sku] || row.category;
    const shopR = await client.query(
      `SELECT COALESCE(SUM(COALESCE(sl.current_qty, 0)), 0)::int AS shop_total
       FROM pos_products pp
       LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
       WHERE pp.category = $1
         AND pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'`,
      [cat]
    );
    const shopTotal = shopR.rows[0]?.shop_total ?? 0;
    if (shopTotal < qty) {
      throw Object.assign(
        new Error(`Insufficient shop stock for ${cat} (${shopTotal} piece(s) on floor)`),
        { statusCode: 400 }
      );
    }
    return { legacyWebsiteSale: true, category: cat };
  }

  if (sku.includes('-W-')) {
    throw Object.assign(
      new Error('This piece is in the warehouse — move it to the shop floor before selling'),
      { statusCode: 400 }
    );
  }
  if (!sku.startsWith('PE-CAT-')) {
    throw Object.assign(new Error('Only shop-floor catalog pieces can be sold at POS'), { statusCode: 400 });
  }
  if (row.shop_qty < qty) {
    throw Object.assign(new Error(`Insufficient shop stock (${row.shop_qty} available)`), { statusCode: 400 });
  }
  return { legacyWebsiteSale: false };
};

const deductCategoryShopPieces = async (
  client,
  categoryName,
  qty,
  { movementType, recordedBy, receiptNumber, variantId = null }
) => {
  const pieces = await client.query(
    `SELECT pp.id
     FROM pos_products pp
     INNER JOIN pos_stock_levels sl ON sl.product_id = pp.id
     WHERE pp.category = $1
       AND pp.sku LIKE 'PE-CAT-%' AND pp.sku NOT LIKE '%-W-%'
       AND COALESCE(sl.current_qty, 0) > 0
     ORDER BY pp.sku ASC
     LIMIT $2
     FOR UPDATE OF sl`,
    [categoryName, qty]
  );
  if (pieces.rows.length < qty) {
    throw Object.assign(
      new Error(`Could not allocate ${qty} shop piece(s) for ${categoryName}`),
      { statusCode: 400 }
    );
  }
  const updates = [];
  for (const piece of pieces.rows) {
    const upd = await client.query(
      `UPDATE pos_stock_levels SET current_qty = current_qty - 1, updated_at = NOW()
       WHERE product_id = $1 RETURNING current_qty`,
      [piece.id]
    );
    await client.query(
      `INSERT INTO pos_stock_movements (product_id, variant_id, movement_type, qty, recorded_by, notes)
       VALUES ($1, $2, $3::"PosMovementType", 1, $4, $5)`,
      [piece.id, variantId, movementType, recordedBy, `Website sale ${receiptNumber}`]
    );
    updates.push({ productId: piece.id, newQty: upd.rows[0].current_qty });
  }
  return updates;
};

const processSale = async ({
  shiftId,
  sellerId,
  channel,
  paymentMethod,
  mpesaRef,
  discountAmount = 0,
  items,
  recordedBy = null,
  auditDetails = {},
  orderId = null,
}) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (orderId) {
      const dup = await client.query(
        `SELECT id FROM pos_audit_logs
         WHERE action = 'SALE_CREATED' AND details->>'orderId' = $1 LIMIT 1`,
        [String(orderId)]
      );
      if (dup.rows.length) {
        const existing = await client.query(
          `SELECT * FROM pos_sales WHERE id = (
            SELECT (details->>'saleId')::uuid FROM pos_audit_logs
            WHERE action = 'SALE_CREATED' AND details->>'orderId' = $1 LIMIT 1
          )`,
          [String(orderId)]
        );
        await client.query('COMMIT');
        return existing.rows[0] || { idempotent: true };
      }
    }

    const receiptNumber = await generateReceiptNumber(client);
    const pricedItems = [];
    for (const item of items) {
      pricedItems.push(await resolveSaleItemPricing(client, item, channel));
    }

    let totalAmount = 0;
    for (const item of pricedItems) totalAmount += item.qty * item.unitPrice;
    totalAmount -= discountAmount;
    if (totalAmount < 0) totalAmount = 0;

    const saleR = await client.query(
      `INSERT INTO pos_sales
        (receipt_number, shift_id, seller_id, channel, payment_method, mpesa_ref, discount_amount, total_amount)
       VALUES ($1, $2, $3, $4::"PosChannel", $5::"PosPaymentMethod", $6, $7, $8)
       RETURNING *`,
      [
        receiptNumber,
        shiftId || null,
        sellerId || null,
        channel,
        paymentMethod,
        mpesaRef || null,
        discountAmount,
        totalAmount,
      ]
    );
    const sale = saleR.rows[0];
    const movementType = channel === 'ONLINE' ? 'SALE_ONLINE' : 'SALE_POS';
    const stockUpdates = [];
    let legacyWebsiteSale = false;

    for (const item of pricedItems) {
      const sellCheck = await assertSellableOnShopFloor(
        client,
        item.productId,
        item.qty,
        channel,
        item.ecommerceProductId || null
      );

      if (sellCheck.legacyWebsiteSale) {
        await client.query(
          `INSERT INTO pos_sale_items
             (sale_id, product_id, variant_id, ecommerce_product_id, line_name, qty, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            sale.id,
            item.productId,
            item.variantId || null,
            item.ecommerceProductId || null,
            item.lineName || null,
            item.qty,
            item.unitPrice,
            item.qty * item.unitPrice,
          ]
        );

        const pieceUpdates = await deductCategoryShopPieces(client, sellCheck.category, item.qty, {
          movementType,
          recordedBy,
          receiptNumber,
          variantId: item.variantId || null,
        });
        stockUpdates.push(...pieceUpdates);
        legacyWebsiteSale = true;
        continue;
      }

      const stockR = await client.query(
        `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1 FOR UPDATE`,
        [item.productId]
      );
      const current = stockR.rows[0]?.current_qty ?? 0;
      if (current < item.qty) {
        throw Object.assign(new Error(`Insufficient stock for product ${item.productId}`), {
          statusCode: 400,
        });
      }

      await client.query(
        `INSERT INTO pos_sale_items
           (sale_id, product_id, variant_id, ecommerce_product_id, line_name, qty, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sale.id,
          item.productId,
          item.variantId || null,
          item.ecommerceProductId || null,
          item.lineName || null,
          item.qty,
          item.unitPrice,
          item.qty * item.unitPrice,
        ]
      );

      const upd = await client.query(
        `UPDATE pos_stock_levels SET current_qty = current_qty - $1, updated_at = NOW()
         WHERE product_id = $2 RETURNING current_qty`,
        [item.qty, item.productId]
      );

      await client.query(
        `INSERT INTO pos_stock_movements (product_id, variant_id, movement_type, qty, recorded_by, notes)
         VALUES ($1, $2, $3::"PosMovementType", $4, $5, $6)`,
        [item.productId, item.variantId || null, movementType, item.qty, recordedBy, `Sale ${receiptNumber}`]
      );

      stockUpdates.push({ productId: item.productId, newQty: upd.rows[0].current_qty });
    }

    if (shiftId) {
      const field = paymentMethod === 'CASH' ? 'total_cash' : paymentMethod === 'MPESA' ? 'total_mpesa' : null;
      if (field) {
        await client.query(
          `UPDATE pos_shifts SET total_sales = total_sales + $1, ${field} = ${field} + $1 WHERE id = $2`,
          [totalAmount, shiftId]
        );
      } else {
        await client.query(
          `UPDATE pos_shifts SET total_sales = total_sales + $1 WHERE id = $2`,
          [totalAmount, shiftId]
        );
      }
    }

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, entity_id, performed_by, details)
       VALUES ('SALE_CREATED', 'pos_sales', $1, $2, $3)`,
      [
        sale.id,
        recordedBy,
        JSON.stringify({ receiptNumber, channel, saleId: sale.id, orderId, ...auditDetails }),
      ]
    );

    await client.query('COMMIT');

    const { refreshDailySnapshot } = require('./dailyStockSnapshot');
    if (legacyWebsiteSale) {
      const { syncLegacyBucketsFromPeCatalog, syncWebsiteStockFromPosShop } = require('./inventoryWarehouseSync');
      try {
        await syncLegacyBucketsFromPeCatalog();
        await syncWebsiteStockFromPosShop();
      } catch (e) {
        console.error('Post website-sale stock sync warning:', e.message);
      }
    }
    for (const u of stockUpdates) {
      await refreshDailySnapshot(u.productId);
      await emitStockUpdated(u.productId, u.newQty);
    }

    const itemsR = await db.query(
      `SELECT si.*, COALESCE(si.line_name, p.name) AS product_name FROM pos_sale_items si
       JOIN pos_products p ON p.id = si.product_id WHERE si.sale_id = $1`,
      [sale.id]
    );
    return {
      ...sale,
      items: itemsR.rows.map((it) => ({ ...it, product: { name: it.product_name }, subtotal: it.subtotal })),
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const voidSale = async (saleId, voidReason, voidedById = null, voidedByName = null) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const saleR = await client.query(`SELECT * FROM pos_sales WHERE id = $1 FOR UPDATE`, [saleId]);
    if (!saleR.rows.length) {
      throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
    }
    const sale = saleR.rows[0];
    if (sale.is_voided) {
      await client.query('COMMIT');
      return sale;
    }

    const itemsR = await client.query(`SELECT * FROM pos_sale_items WHERE sale_id = $1`, [saleId]);
    const stockUpdates = [];

    for (const item of itemsR.rows) {
      const upd = await client.query(
        `UPDATE pos_stock_levels SET current_qty = current_qty + $1, updated_at = NOW()
         WHERE product_id = $2 RETURNING current_qty`,
        [item.qty, item.product_id]
      );
      if (!upd.rows.length) {
        await client.query(
          `INSERT INTO pos_stock_levels (product_id, current_qty) VALUES ($1, $2)`,
          [item.product_id, item.qty]
        );
        stockUpdates.push({ productId: item.product_id, newQty: item.qty });
      } else {
        stockUpdates.push({ productId: item.product_id, newQty: upd.rows[0].current_qty });
      }

      await client.query(
        `INSERT INTO pos_stock_movements (product_id, variant_id, movement_type, qty, recorded_by, notes)
         VALUES ($1, $2, 'VOID'::"PosMovementType", $3, $4, $5)`,
        [
          item.product_id,
          item.variant_id,
          item.qty,
          voidedById,
          `Void ${sale.receipt_number}: ${voidReason}${voidedByName ? ` (${voidedByName})` : ''}`,
        ]
      );
    }

    await client.query(
      `UPDATE pos_sales SET is_voided = true, void_reason = $1, voided_by = $2, voided_at = NOW() WHERE id = $3`,
      [voidReason, voidedById, saleId]
    );

    if (sale.shift_id) {
      const amt = parseFloat(sale.total_amount);
      const field = sale.payment_method === 'CASH' ? 'total_cash' : sale.payment_method === 'MPESA' ? 'total_mpesa' : null;
      if (field) {
        await client.query(
          `UPDATE pos_shifts SET total_sales = GREATEST(0, total_sales - $1), ${field} = GREATEST(0, ${field} - $1) WHERE id = $2`,
          [amt, sale.shift_id]
        );
      } else {
        await client.query(
          `UPDATE pos_shifts SET total_sales = GREATEST(0, total_sales - $1) WHERE id = $2`,
          [amt, sale.shift_id]
        );
      }
    }

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, entity_id, performed_by, details)
       VALUES ('SALE_VOIDED', 'pos_sales', $1, $2, $3)`,
      [saleId, voidedById, JSON.stringify({ voidReason, receiptNumber: sale.receipt_number })]
    );

    await client.query('COMMIT');

    const { refreshDailySnapshot } = require('./dailyStockSnapshot');
    for (const u of stockUpdates) {
      await refreshDailySnapshot(u.productId);
      await emitStockUpdated(u.productId, u.newQty);
    }

    const itemsOut = await db.query(
      `SELECT si.*, COALESCE(si.line_name, p.name) AS product_name FROM pos_sale_items si
       JOIN pos_products p ON p.id = si.product_id WHERE si.sale_id = $1`,
      [saleId]
    );
    return {
      ...sale,
      is_voided: true,
      void_reason: voidReason,
      items: itemsOut.rows.map((it) => ({ ...it, product: { name: it.product_name } })),
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { processSale, voidSale };
