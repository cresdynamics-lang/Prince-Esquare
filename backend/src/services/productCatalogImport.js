/**
 * Import individual inventory products (one row = one sellable SKU).
 * Excel columns: SKU, Product Name, Category, Shop Price, Opening Qty, Website SKU (optional)
 */
const db = require('../config/db');
const { toDateStr } = require('./dailyStockSnapshot');
const { createPosInventoryItem } = require('./inventoryChannel');
const {
  setShopQty,
  setStoreQty,
  afterInventoryChange,
  ensureStoreStockRow,
} = require('./inventoryMovement');
const { linkProductPair } = require('./productPosLink');
const { skuFromName } = require('../utils/stockExcelParser');

const findPosBySku = async (client, sku) => {
  const r = await client.query(`SELECT id FROM pos_products WHERE UPPER(sku) = UPPER($1) LIMIT 1`, [sku]);
  return r.rows[0]?.id || null;
};

const findWebsiteBySku = async (client, sku) => {
  if (!sku) return null;
  const r = await client.query(
    `SELECT id, name, pos_stock_product_id FROM products WHERE UPPER(sku) = UPPER($1) LIMIT 1`,
    [sku]
  );
  return r.rows[0] || null;
};

const setOpeningStock = async (client, productId, shopQty, storeQty, dateStr) => {
  const shop = Math.max(0, parseInt(shopQty, 10) || 0);
  const store = Math.max(0, parseInt(storeQty, 10) || 0);
  await setShopQty(productId, shop, { client });
  await ensureStoreStockRow(client, productId);
  if (store > 0) await setStoreQty(productId, store, { client });

  await client.query(
    `INSERT INTO pos_daily_stock_snapshots
       (product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty)
     VALUES ($1, $2::date, $3, 0, 0, 0, $3)
     ON CONFLICT (product_id, date) DO UPDATE SET
       opening_qty = EXCLUDED.opening_qty,
       closing_qty = EXCLUDED.closing_qty`,
    [productId, dateStr, shop]
  );
  return { shop, store };
};

const importCatalogRows = async (rows, { performedBy = null, date = new Date() } = {}) => {
  const dateStr = toDateStr(date);
  const results = { created: 0, updated: 0, linked: 0, date: dateStr, products: [], warnings: [] };
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      const sku = (row.sku || skuFromName(row.name)).trim().toUpperCase();
      const name = row.name.trim();
      const category = row.category || 'General';
      const shopPrice = parseFloat(row.shopPrice) || 0;
      const openingQty = parseInt(row.openingQty, 10) || 0;
      const storeQty = parseInt(row.storeQty, 10) || 0;

      let productId = await findPosBySku(client, sku);
      let created = false;

      if (!productId) {
        const ins = await createPosInventoryItem(
          {
            name,
            sku,
            category,
            shopPrice,
            onlinePrice: shopPrice,
          },
          client
        );
        productId = ins.id;
        created = true;
        results.created += 1;
      } else {
        await client.query(
          `UPDATE pos_products SET name = $1, category = $2, shop_price = $3, online_price = $4 WHERE id = $5`,
          [name, category, shopPrice, shopPrice, productId]
        );
        results.updated += 1;
      }

      const website = row.websiteSku ? await findWebsiteBySku(client, row.websiteSku) : null;
      if (website && !website.pos_stock_product_id) {
        await linkProductPair(website.id, productId, { syncPrices: false });
        results.linked += 1;
      } else if (website?.pos_stock_product_id && website.pos_stock_product_id !== productId) {
        results.warnings.push(`${sku}: website SKU ${row.websiteSku} already linked elsewhere`);
      }

      const levels = await setOpeningStock(client, productId, openingQty, storeQty, dateStr);
      results.products.push({
        sku,
        name,
        productId,
        shopQty: levels.shop,
        storeQty: levels.store,
        created,
      });
    }

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, performed_by, details)
       VALUES ('CATALOG_IMPORT', 'pos_products', $1, $2)`,
      [performedBy, JSON.stringify({ count: rows.length, date: dateStr })]
    );

    await client.query('COMMIT');

    for (const row of results.products) {
      await afterInventoryChange(row.productId, {
        shopQty: row.shopQty,
        storeQty: row.storeQty,
      });
    }

    return results;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { importCatalogRows };
