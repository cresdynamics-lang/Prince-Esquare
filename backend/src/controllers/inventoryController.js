const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

// ── SHOPS ──────────────────────────────────────────────────────────────

exports.getShops = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM shops ORDER BY name ASC');
    formatResponse(res, 200, true, 'Shops fetched', result.rows);
  } catch (e) { next(e); }
};

exports.createShop = async (req, res, next) => {
  try {
    const { name, code, address, phone, email } = req.body;
    if (!name || !code) return formatResponse(res, 400, false, 'Name and code are required');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await db.query(
      'INSERT INTO shops (name, slug, code, address, phone, email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, slug, code.toUpperCase(), address || null, phone || null, email || null]
    );
    formatResponse(res, 201, true, 'Shop created', result.rows[0]);
  } catch (e) { next(e); }
};

exports.updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, address, phone, email, is_active } = req.body;
    const result = await db.query(
      'UPDATE shops SET name=$1, code=$2, address=$3, phone=$4, email=$5, is_active=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, code, address || null, phone || null, email || null, is_active !== false, id]
    );
    if (!result.rows.length) return formatResponse(res, 404, false, 'Shop not found');
    formatResponse(res, 200, true, 'Shop updated', result.rows[0]);
  } catch (e) { next(e); }
};

exports.deleteShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM shops WHERE id=$1', [id]);
    formatResponse(res, 200, true, 'Shop deleted');
  } catch (e) { next(e); }
};

// ── Helper: resolve item_id from name ──────────────────────────────────

const resolveItemId = async (itemName) => {
  const r = await db.query('SELECT id FROM inventory_items WHERE name = $1', [itemName]);
  if (!r.rows.length) throw new Error(`Unknown item: "${itemName}"`);
  return r.rows[0].id;
};

// ── OPENING STOCK ──────────────────────────────────────────────────────

exports.setOpeningStock = async (req, res, next) => {
  try {
    // product_id here is the item name (string) sent from frontend
    const { product_id: itemName, shop_id, quantity, description } = req.body;
    if (!itemName || !shop_id || quantity == null) {
      return formatResponse(res, 400, false, 'item, shop_id, and quantity are required');
    }
    if (parseInt(quantity) < 0) return formatResponse(res, 400, false, 'Quantity cannot be negative');

    const item_id = await resolveItemId(itemName);

    // Check if opening stock already exists
    const existing = await db.query(
      `SELECT id FROM shop_stock_movements WHERE item_id=$1 AND shop_id=$2 AND movement_type='opening_stock'`,
      [item_id, shop_id]
    );
    if (existing.rows.length) {
      return formatResponse(res, 409, false, 'Opening stock already set for this item/shop. It cannot be changed.');
    }

    const result = await db.query(
      `INSERT INTO shop_stock_movements (item_id, shop_id, movement_type, quantity, description)
       VALUES ($1,$2,'opening_stock',$3,$4) RETURNING *`,
      [item_id, shop_id, parseInt(quantity), description || `Opening stock for ${itemName}`]
    );
    formatResponse(res, 201, true, 'Opening stock set', result.rows[0]);
  } catch (e) { next(e); }
};

// ── STOCK MOVEMENTS ────────────────────────────────────────────────────

const recordMovement = (type) => async (req, res, next) => {
  try {
    const { product_id: itemName, shop_id, quantity, description } = req.body;
    if (!itemName || !shop_id || !quantity) {
      return formatResponse(res, 400, false, 'item, shop_id, quantity required');
    }
    if (parseInt(quantity) <= 0) return formatResponse(res, 400, false, 'Quantity must be positive');

    const item_id = await resolveItemId(itemName);
    const result = await db.query(
      `INSERT INTO shop_stock_movements (item_id, shop_id, movement_type, quantity, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [item_id, shop_id, type, parseInt(quantity), description || `${type} — ${itemName}`]
    );
    formatResponse(res, 201, true, `${type} recorded`, result.rows[0]);
  } catch (e) { next(e); }
};

exports.recordSales = recordMovement('sales');
exports.recordStockIn = recordMovement('stock_in');
exports.recordStockOut = recordMovement('stock_out');

// ── STOCK TRANSFER ─────────────────────────────────────────────────────

exports.transferStock = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { from_shop_id, to_shop_id, items } = req.body;
    if (!from_shop_id || !to_shop_id || !Array.isArray(items) || !items.length) {
      return formatResponse(res, 400, false, 'from_shop_id, to_shop_id, and items[] are required');
    }
    if (from_shop_id === to_shop_id) return formatResponse(res, 400, false, 'Source and destination shops cannot be the same');

    await client.query('BEGIN');

    const transfer = await client.query(
      `INSERT INTO shop_stock_transfers (from_shop_id, to_shop_id) VALUES ($1,$2) RETURNING *`,
      [from_shop_id, to_shop_id]
    );
    const transferId = transfer.rows[0].id;

    for (const item of items) {
      const qty = parseInt(item.quantity);
      if (!qty || qty <= 0) continue;

      // item.product_id is the item name string
      const itemRow = await client.query('SELECT id FROM inventory_items WHERE name=$1', [item.product_id]);
      if (!itemRow.rows.length) throw new Error(`Unknown item: "${item.product_id}"`);
      const item_id = itemRow.rows[0].id;

      await client.query(
        `INSERT INTO shop_stock_movements (item_id, shop_id, movement_type, quantity, reference_type, description)
         VALUES ($1,$2,'transfer_out',$3,'stock_transfer',$4)`,
        [item_id, from_shop_id, qty, `Transfer to shop (ref: ${transferId})`]
      );
      await client.query(
        `INSERT INTO shop_stock_movements (item_id, shop_id, movement_type, quantity, reference_type, description)
         VALUES ($1,$2,'transfer_in',$3,'stock_transfer',$4)`,
        [item_id, to_shop_id, qty, `Transfer from shop (ref: ${transferId})`]
      );
      await client.query(
        `INSERT INTO shop_stock_transfer_items (transfer_id, item_id, quantity) VALUES ($1,$2,$3)`,
        [transferId, item_id, qty]
      );
    }

    await client.query('COMMIT');
    formatResponse(res, 201, true, 'Stock transfer completed', transfer.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
};

// ── STOCK SUMMARY (daily / weekly / monthly) ───────────────────────────

exports.getStockSummary = async (req, res, next) => {
  try {
    const { shop_id, product_id: itemName, period = 'daily', date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const params = [];
    let p = 1;
    let dateFilter = '';

    if (period === 'daily') {
      dateFilter = `AND m.transaction_date = $${p++}`;
      params.push(targetDate);
    } else if (period === 'weekly') {
      dateFilter = `AND m.transaction_date >= $${p++}::date - INTERVAL '6 days' AND m.transaction_date <= $${p++}::date`;
      params.push(targetDate, targetDate);
    } else {
      dateFilter = `AND DATE_TRUNC('month', m.transaction_date) = DATE_TRUNC('month', $${p++}::date)`;
      params.push(targetDate);
    }

    if (shop_id) { dateFilter += ` AND m.shop_id = $${p++}`; params.push(shop_id); }
    if (itemName) { dateFilter += ` AND ii.name = $${p++}`; params.push(itemName); }

    const result = await db.query(`
      SELECT
        ii.id AS item_id,
        ii.name AS item_name,
        m.shop_id,
        s.name AS shop_name,
        s.code AS shop_code,
        COALESCE(SUM(CASE WHEN m.movement_type='opening_stock' THEN m.quantity ELSE 0 END),0) AS opening_stock,
        COALESCE(SUM(CASE WHEN m.movement_type IN ('stock_in','transfer_in') THEN m.quantity ELSE 0 END),0) AS stock_in,
        COALESCE(SUM(CASE WHEN m.movement_type IN ('stock_out','transfer_out') THEN m.quantity ELSE 0 END),0) AS stock_out,
        COALESCE(SUM(CASE WHEN m.movement_type='sales' THEN m.quantity ELSE 0 END),0) AS sales,
        (SELECT m2.closing_stock FROM shop_stock_movements m2
         WHERE m2.item_id = ii.id AND m2.shop_id = m.shop_id
         ORDER BY m2.created_at DESC LIMIT 1) AS closing_stock
      FROM shop_stock_movements m
      JOIN inventory_items ii ON m.item_id = ii.id
      JOIN shops s ON m.shop_id = s.id
      WHERE 1=1 ${dateFilter}
      GROUP BY ii.id, ii.name, m.shop_id, s.name, s.code
      ORDER BY ii.name, s.name
    `, params);

    formatResponse(res, 200, true, 'Stock summary fetched', result.rows);
  } catch (e) { next(e); }
};

// ── CURRENT STOCK ──────────────────────────────────────────────────────

exports.getCurrentStock = async (req, res, next) => {
  try {
    const { shop_id } = req.query;
    const params = [];
    let where = '';
    if (shop_id) { where = 'WHERE m.shop_id = $1'; params.push(shop_id); }

    const result = await db.query(`
      SELECT
        ii.id AS item_id,
        ii.name AS item_name,
        m.shop_id,
        s.name AS shop_name,
        s.code AS shop_code,
        (SELECT m2.closing_stock FROM shop_stock_movements m2
         WHERE m2.item_id = ii.id AND m2.shop_id = m.shop_id
         ORDER BY m2.created_at DESC LIMIT 1) AS current_stock
      FROM shop_stock_movements m
      JOIN inventory_items ii ON m.item_id = ii.id
      JOIN shops s ON m.shop_id = s.id
      ${where}
      GROUP BY ii.id, ii.name, m.shop_id, s.name, s.code
      ORDER BY ii.name, s.name
    `, params);
    formatResponse(res, 200, true, 'Current stock fetched', result.rows);
  } catch (e) { next(e); }
};

// ── MOVEMENT HISTORY ───────────────────────────────────────────────────

exports.getMovements = async (req, res, next) => {
  try {
    const { shop_id, product_id: itemName, limit = 100 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    let p = 1;
    if (shop_id) { where += ` AND m.shop_id = $${p++}`; params.push(shop_id); }
    if (itemName) { where += ` AND ii.name = $${p++}`; params.push(itemName); }
    params.push(parseInt(limit));

    const result = await db.query(`
      SELECT m.*, ii.name AS product_name, s.name AS shop_name
      FROM shop_stock_movements m
      JOIN inventory_items ii ON m.item_id = ii.id
      JOIN shops s ON m.shop_id = s.id
      ${where}
      ORDER BY m.created_at DESC
      LIMIT $${p}
    `, params);
    formatResponse(res, 200, true, 'Movements fetched', result.rows);
  } catch (e) { next(e); }
};

// ── TRANSFERS LIST ─────────────────────────────────────────────────────

exports.getTransfers = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT t.*, fs.name AS from_shop_name, ts.name AS to_shop_name,
             COUNT(ti.id) AS item_count,
             COALESCE(SUM(ti.quantity), 0) AS total_quantity
      FROM shop_stock_transfers t
      JOIN shops fs ON t.from_shop_id = fs.id
      JOIN shops ts ON t.to_shop_id = ts.id
      LEFT JOIN shop_stock_transfer_items ti ON t.id = ti.transfer_id
      GROUP BY t.id, fs.name, ts.name
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    formatResponse(res, 200, true, 'Transfers fetched', result.rows);
  } catch (e) { next(e); }
};
