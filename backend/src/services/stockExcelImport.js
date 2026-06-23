// MODIFIED — Import Stock.xlsx (set/update opening stock + optional full sheet)
const db = require('../config/db');
const { parseStockExcelBuffer, skuFromName } = require('../utils/stockExcelParser');
const { afterInventoryChange, normalizeQty } = require('./inventoryMovement');
const { toDateStr } = require('./dailyStockSnapshot');
const { resolvePriceForPosName } = require('./productPosLink');

const guessCategory = (name) => {
  const n = name.toLowerCase();
  if (n.includes('shoe') || n.includes('loafer')) return 'Shoes';
  if (['hats', 'ties', 'belts', 'socks', 'capes'].some((k) => n.includes(k))) return 'Accessories';
  return 'Apparel';
};

const findProduct = async (client, name, sku) => {
  const r = await client.query(
    `SELECT id FROM pos_products WHERE sku = $1 OR LOWER(name) = LOWER($2) LIMIT 1`,
    [sku, name]
  );
  return r.rows[0]?.id || null;
};

const upsertSnapshot = async (client, productId, dateStr, snapshot) => {
  const openingQty = normalizeQty(snapshot.opening);
  const stockInQty = normalizeQty(snapshot.stockIn);
  const stockOutQty = normalizeQty(snapshot.stockOut);
  const salesQty = normalizeQty(snapshot.sales);
  const closingQty = normalizeQty(snapshot.closing);
  await client.query(
    `INSERT INTO pos_daily_stock_snapshots
       (product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty)
     VALUES ($1, $2::date, $3, $4, $5, $6, $7)
     ON CONFLICT (product_id, date) DO UPDATE SET
       opening_qty = EXCLUDED.opening_qty,
       stock_in_qty = EXCLUDED.stock_in_qty,
       stock_out_qty = EXCLUDED.stock_out_qty,
       sales_qty = EXCLUDED.sales_qty,
       closing_qty = EXCLUDED.closing_qty`,
    [
      productId,
      dateStr,
      openingQty,
      stockInQty,
      stockOutQty,
      salesQty,
      closingQty,
    ]
  );
};

const updateOpeningOnly = async (client, productId, dateStr, opening) => {
  const existing = await client.query(
    `SELECT opening_qty, stock_in_qty, stock_out_qty, sales_qty
     FROM pos_daily_stock_snapshots WHERE product_id = $1 AND date = $2::date`,
    [productId, dateStr]
  );

  const stockIn = existing.rows[0]?.stock_in_qty ?? 0;
  const stockOut = existing.rows[0]?.stock_out_qty ?? 0;
  const sales = existing.rows[0]?.sales_qty ?? 0;
  const closing = Math.max(0, opening + stockIn - stockOut - sales);

  await client.query(
    `INSERT INTO pos_daily_stock_snapshots
       (product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty)
     VALUES ($1, $2::date, $3, $4, $5, $6, $7)
     ON CONFLICT (product_id, date) DO UPDATE SET
       opening_qty = EXCLUDED.opening_qty,
       closing_qty = EXCLUDED.closing_qty`,
    [productId, dateStr, normalizeQty(opening), normalizeQty(stockIn), normalizeQty(stockOut), normalizeQty(sales), normalizeQty(closing)]
  );

  await client.query(
    `INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id) DO UPDATE SET current_qty = $2, updated_at = NOW()`,
    [productId, normalizeQty(closing)]
  );

  return closing;
};

/**
 * @param {'full'|'opening'|'opening_reset'} mode
 * - full: import all columns; live stock = closing from sheet
 * - opening: update opening_qty from sheet; keep today's sales/in/out
 * - opening_reset: set opening from sheet; zero sales/in/out; live stock = opening
 */
const importStockRows = async (
  rows,
  {
    date = new Date(),
    performedBy = null,
    mode = 'full',
    recordMovements = false,
  } = {}
) => {
  const dateStr = toDateStr(date);
  const results = { created: 0, updated: 0, mode, date: dateStr, warnings: [], products: [] };
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      const sku = skuFromName(row.name);
      let productId = await findProduct(client, row.name, sku);

      if (!productId) {
        const prices = await resolvePriceForPosName(row.name);
        const shopPrice = prices?.sell_price ?? 0;
        const onlinePrice = prices?.list_price ?? shopPrice;
        const ins = await client.query(
          `INSERT INTO pos_products (name, sku, category, shop_price, online_price, low_stock_threshold)
           VALUES ($1, $2, $3, $4, $5, 5) RETURNING id`,
          [row.name, sku, guessCategory(row.name), shopPrice, onlinePrice]
        );
        productId = ins.rows[0].id;
        results.created += 1;
      } else {
        const prices = await resolvePriceForPosName(row.name);
        if (prices?.sell_price) {
          await client.query(
            `UPDATE pos_products SET shop_price = $1, online_price = $2 WHERE id = $3`,
            [prices.sell_price, prices.list_price, productId]
          );
        }
        results.updated += 1;
      }

      let currentQty;
      let snapshot;

      if (mode === 'opening') {
        currentQty = await updateOpeningOnly(client, productId, dateStr, row.opening);
        snapshot = {
          opening: row.opening,
          stockIn: null,
          stockOut: null,
          sales: null,
          closing: currentQty,
        };
      } else if (mode === 'opening_reset') {
        currentQty = Math.max(0, row.opening);
        snapshot = {
          opening: row.opening,
          stockIn: 0,
          stockOut: 0,
          sales: 0,
          closing: currentQty,
        };
        await upsertSnapshot(client, productId, dateStr, snapshot);
        await client.query(
          `INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (product_id) DO UPDATE SET current_qty = $2, updated_at = NOW()`,
          [productId, normalizeQty(currentQty)]
        );
      } else {
        currentQty = Math.max(0, row.closing);
        if (row.closing < 0) {
          results.warnings.push(`${row.name}: closing ${row.closing} (stored as ${currentQty})`);
        }
        snapshot = {
          opening: row.opening,
          stockIn: row.stockIn,
          stockOut: row.stockOut,
          sales: row.sales,
          closing: currentQty,
        };
        await upsertSnapshot(client, productId, dateStr, snapshot);
        await client.query(
          `INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (product_id) DO UPDATE SET current_qty = $2, updated_at = NOW()`,
          [productId, normalizeQty(currentQty)]
        );
      }

      if (recordMovements && mode === 'full') {
        const movements = [
          ['STOCK_IN', row.stockIn],
          ['STOCK_OUT', row.stockOut],
          ['SALE_POS', row.sales],
        ];
        for (const [type, qty] of movements) {
          if (qty > 0) {
            await client.query(
              `INSERT INTO pos_stock_movements (product_id, movement_type, qty, date, recorded_by, notes)
               VALUES ($1, $2::"PosMovementType", $3, $4::date, $5, 'Excel import')`,
              [productId, type, qty, dateStr, performedBy]
            );
          }
        }
      }

      results.products.push({
        productId,
        name: row.name,
        opening: row.opening,
        closing: currentQty,
      });
    }

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, performed_by, details)
       VALUES ('STOCK_EXCEL_IMPORT', 'pos_products', $1, $2)`,
      [
        performedBy,
        JSON.stringify({
          rowCount: rows.length,
          date: dateStr,
          mode,
          recordMovements,
        }),
      ]
    );

    await client.query('COMMIT');

    for (const p of results.products) {
      if (p.productId) {
        await afterInventoryChange(p.productId, { shopQty: p.closing });
      }
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return results;
};

const importStockExcelBuffer = async (buffer, options = {}) => {
  const rows = await parseStockExcelBuffer(buffer);
  return importStockRows(rows, options);
};

module.exports = { importStockRows, importStockExcelBuffer };
