/**
 * Store ↔ Shop inventory movements with automatic snapshot + realtime sync.
 * - Stock In (shop)  = transfer FROM store TO shop (replenish sales floor)
 * - Stock Out (shop) = transfer FROM shop TO store (return to warehouse)
 */
const db = require('../config/db');
const { refreshDailySnapshot } = require('./dailyStockSnapshot');
const { emitStockUpdated, emitStoreStockUpdated } = require('../utils/posHelpers');

const STORE_TO_SHOP = 'Store -> Shop';
const SHOP_TO_STORE = 'Shop -> Store';

const ensureShopStockRow = async (client, productId) => {
  await client.query(
    `INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
     VALUES ($1, 0, NOW())
     ON CONFLICT (product_id) DO NOTHING`,
    [productId]
  );
};

const ensureStoreStockRow = async (client, productId) => {
  await client.query(
    `INSERT INTO pos_store_stock_levels (product_id, current_qty, updated_at)
     VALUES ($1, 0, NOW())
     ON CONFLICT (product_id) DO NOTHING`,
    [productId]
  );
};

const readLevels = async (client, productId) => {
  const shopR = await client.query(
    `SELECT current_qty FROM pos_stock_levels WHERE product_id = $1`,
    [productId]
  );
  const storeR = await client.query(
    `SELECT current_qty FROM pos_store_stock_levels WHERE product_id = $1`,
    [productId]
  );
  return {
    shopQty: shopR.rows[0]?.current_qty ?? 0,
    storeQty: storeR.rows[0]?.current_qty ?? 0,
  };
};

/** After any shop/store change: refresh daily sheet + push live updates + mirror website stock. */
const afterInventoryChange = async (productId, levels = {}) => {
  await refreshDailySnapshot(productId);
  if (levels.shopQty != null) emitStockUpdated(productId, levels.shopQty);
  if (levels.storeQty != null) emitStoreStockUpdated(productId, levels.storeQty);
  try {
    const { syncWebsiteStockForPosProduct } = require('./inventoryWarehouseSync');
    await syncWebsiteStockForPosProduct(productId);
  } catch (e) {
    console.error('Website stock sync warning:', e.message);
  }
};

const logAudit = async (client, action, productId, details, performedBy = null) => {
  await client.query(
    `INSERT INTO pos_audit_logs (action, entity, entity_id, performed_by, details)
     VALUES ($1, 'pos_products', $2, $3, $4)`,
    [action, productId, performedBy, JSON.stringify(details)]
  );
};

/** Goods arrive at the warehouse/store (does not affect shop floor). */
const receiveAtStore = async (productId, qty, { notes, recordedBy, client: extClient } = {}) => {
  const client = extClient || (await db.pool.connect());
  const release = !extClient;
  const amount = parseInt(qty, 10);
  if (amount < 1) {
    throw Object.assign(new Error('Quantity must be at least 1'), { statusCode: 400 });
  }

  try {
    if (!extClient) await client.query('BEGIN');
    await ensureStoreStockRow(client, productId);

    const storeR = await client.query(
      `UPDATE pos_store_stock_levels
       SET current_qty = current_qty + $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING current_qty`,
      [amount, productId]
    );

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, entity_id, performed_by, details)
       VALUES ('STORE_RECEIVE', 'pos_products', $1, $2, $3)`,
      [
        productId,
        recordedBy,
        JSON.stringify({ qty: amount, notes: notes || 'Received at store' }),
      ]
    );

    if (!extClient) await client.query('COMMIT');

    const levels = await readLevels(client, productId);
    await afterInventoryChange(productId, { storeQty: levels.storeQty, shopQty: levels.shopQty });
    return { ...levels, received: amount };
  } catch (e) {
    if (!extClient) await client.query('ROLLBACK');
    throw e;
  } finally {
    if (release) client.release();
  }
};

/** Store → Shop (POS "Stock In"). */
const transferStoreToShop = async (productId, qty, { notes, recordedBy, client: extClient } = {}) => {
  const client = extClient || (await db.pool.connect());
  const release = !extClient;
  const amount = parseInt(qty, 10);
  if (amount < 1) {
    throw Object.assign(new Error('Quantity must be at least 1'), { statusCode: 400 });
  }

  try {
    if (!extClient) await client.query('BEGIN');
    await ensureShopStockRow(client, productId);
    await ensureStoreStockRow(client, productId);

    const before = await readLevels(client, productId);
    if (before.storeQty < amount) {
      throw Object.assign(
        new Error(`Store has ${before.storeQty} — cannot move ${amount} to shop`),
        { statusCode: 400 }
      );
    }

    const shopR = await client.query(
      `UPDATE pos_stock_levels
       SET current_qty = current_qty + $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING current_qty`,
      [amount, productId]
    );
    const storeR = await client.query(
      `UPDATE pos_store_stock_levels
       SET current_qty = current_qty - $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING current_qty`,
      [amount, productId]
    );

    const movementNote = notes || STORE_TO_SHOP;
    await client.query(
      `INSERT INTO pos_stock_movements (product_id, movement_type, qty, notes, recorded_by)
       VALUES ($1, 'STOCK_IN', $2, $3, $4)`,
      [productId, amount, movementNote, recordedBy || null]
    );

    await logAudit(
      client,
      'STOCK_IN',
      productId,
      {
        qty: amount,
        direction: STORE_TO_SHOP,
        storeBefore: before.storeQty,
        storeAfter: storeR.rows[0].current_qty,
        shopAfter: shopR.rows[0].current_qty,
        notes: movementNote,
      },
      recordedBy
    );

    if (!extClient) await client.query('COMMIT');

    const levels = {
      shopQty: shopR.rows[0].current_qty,
      storeQty: storeR.rows[0].current_qty,
    };
    await afterInventoryChange(productId, levels);
    return levels;
  } catch (e) {
    if (!extClient) await client.query('ROLLBACK');
    throw e;
  } finally {
    if (release) client.release();
  }
};

/** Shop → Store (POS "Stock Out"). */
const transferShopToStore = async (productId, qty, { notes, recordedBy, client: extClient } = {}) => {
  const client = extClient || (await db.pool.connect());
  const release = !extClient;
  const amount = parseInt(qty, 10);
  if (amount < 1) {
    throw Object.assign(new Error('Quantity must be at least 1'), { statusCode: 400 });
  }

  try {
    if (!extClient) await client.query('BEGIN');
    await ensureShopStockRow(client, productId);
    await ensureStoreStockRow(client, productId);

    const before = await readLevels(client, productId);
    if (before.shopQty < amount) {
      throw Object.assign(
        new Error(`Shop has ${before.shopQty} — cannot return ${amount} to store`),
        { statusCode: 400 }
      );
    }

    const shopR = await client.query(
      `UPDATE pos_stock_levels
       SET current_qty = current_qty - $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING current_qty`,
      [amount, productId]
    );
    const storeR = await client.query(
      `UPDATE pos_store_stock_levels
       SET current_qty = current_qty + $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING current_qty`,
      [amount, productId]
    );

    const movementNote = notes || SHOP_TO_STORE;
    await client.query(
      `INSERT INTO pos_stock_movements (product_id, movement_type, qty, notes, recorded_by)
       VALUES ($1, 'STOCK_OUT', $2, $3, $4)`,
      [productId, amount, movementNote, recordedBy || null]
    );

    await logAudit(
      client,
      'STOCK_OUT',
      productId,
      {
        qty: amount,
        direction: SHOP_TO_STORE,
        shopBefore: before.shopQty,
        shopAfter: shopR.rows[0].current_qty,
        storeAfter: storeR.rows[0].current_qty,
        notes: movementNote,
      },
      recordedBy
    );

    if (!extClient) await client.query('COMMIT');

    const levels = {
      shopQty: shopR.rows[0].current_qty,
      storeQty: storeR.rows[0].current_qty,
    };
    await afterInventoryChange(productId, levels);
    return levels;
  } catch (e) {
    if (!extClient) await client.query('ROLLBACK');
    throw e;
  } finally {
    if (release) client.release();
  }
};

const setShopQty = async (productId, qty, { client: extClient } = {}) => {
  const client = extClient || db;
  await ensureShopStockRow(client, productId);
  const r = await client.query(
    `INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id) DO UPDATE SET current_qty = $2, updated_at = NOW()
     RETURNING current_qty`,
    [productId, Math.max(0, parseInt(qty, 10) || 0)]
  );
  return r.rows[0].current_qty;
};

const setStoreQty = async (productId, qty, { client: extClient } = {}) => {
  const client = extClient || db;
  await ensureStoreStockRow(client, productId);
  const r = await client.query(
    `INSERT INTO pos_store_stock_levels (product_id, current_qty, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id) DO UPDATE SET current_qty = $2, updated_at = NOW()
     RETURNING current_qty`,
    [productId, Math.max(0, parseInt(qty, 10) || 0)]
  );
  return r.rows[0].current_qty;
};

const applyStoreStockTake = async (productId, physicalStoreQty, { recordedBy } = {}) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await ensureStoreStockRow(client, productId);
    const before = await readLevels(client, productId);
    const target = Math.max(0, parseInt(physicalStoreQty, 10) || 0);
    const variance = target - before.storeQty;
    if (variance === 0) {
      await client.query('COMMIT');
      return { variance: 0, ...before };
    }

    const storeR = await client.query(
      `UPDATE pos_store_stock_levels SET current_qty = $1, updated_at = NOW()
       WHERE product_id = $2 RETURNING current_qty`,
      [target, productId]
    );

    await client.query(
      `INSERT INTO pos_stock_movements (product_id, movement_type, qty, notes, recorded_by)
       VALUES ($1, 'ADJUSTMENT', $2, $3, $4)`,
      [
        productId,
        variance,
        `Store stock take: ${before.storeQty} -> ${target}`,
        recordedBy || null,
      ]
    );

    await logAudit(
      client,
      'STORE_STOCK_TAKE',
      productId,
      { systemQty: before.storeQty, physicalQty: target, variance },
      recordedBy
    );

    await client.query('COMMIT');
    const levels = { shopQty: before.shopQty, storeQty: storeR.rows[0].current_qty };
    await afterInventoryChange(productId, levels);
    return { variance, ...levels };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const applyStockTake = async (productId, physicalShopQty, { recordedBy } = {}) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await ensureShopStockRow(client, productId);
    const before = await readLevels(client, productId);
    const target = Math.max(0, parseInt(physicalShopQty, 10) || 0);
    const variance = target - before.shopQty;
    if (variance === 0) {
      await client.query('COMMIT');
      return { variance: 0, ...before };
    }

    const shopR = await client.query(
      `UPDATE pos_stock_levels SET current_qty = $1, updated_at = NOW()
       WHERE product_id = $2 RETURNING current_qty`,
      [target, productId]
    );

    await client.query(
      `INSERT INTO pos_stock_movements (product_id, movement_type, qty, notes, recorded_by)
       VALUES ($1, 'ADJUSTMENT', $2, $3, $4)`,
      [
        productId,
        variance,
        `Shop stock take: ${before.shopQty} -> ${target}`,
        recordedBy || null,
      ]
    );

    await logAudit(
      client,
      'STOCK_TAKE',
      productId,
      { systemQty: before.shopQty, physicalQty: target, variance },
      recordedBy
    );

    await client.query('COMMIT');
    const levels = { shopQty: shopR.rows[0].current_qty, storeQty: before.storeQty };
    await afterInventoryChange(productId, levels);
    return { variance, ...levels };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  STORE_TO_SHOP,
  SHOP_TO_STORE,
  ensureShopStockRow,
  ensureStoreStockRow,
  readLevels,
  afterInventoryChange,
  receiveAtStore,
  transferStoreToShop,
  transferShopToStore,
  setShopQty,
  setStoreQty,
  applyStockTake,
  applyStoreStockTake,
};
