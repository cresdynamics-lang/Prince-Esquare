const db = require('../config/db');

async function safeDelete(client, sql, params) {
  try {
    await client.query(sql, params);
  } catch (error) {
    if (error.code === '42P01') return;
    throw error;
  }
}

/** Fast product removal — unlinks POS, clears child rows, then deletes products. */
async function deleteProductsByIds(ids) {
  const uuidList = [...new Set(Array.isArray(ids) ? ids : [])].filter(Boolean);
  if (!uuidList.length) return 0;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const posR = await client.query(
      `SELECT DISTINCT pos_stock_product_id AS id FROM products
       WHERE id = ANY($1::uuid[]) AND pos_stock_product_id IS NOT NULL
       UNION
       SELECT id FROM pos_products WHERE ecommerce_product_id = ANY($1::uuid[])`,
      [uuidList]
    );
    const posIds = posR.rows.map((r) => r.id).filter(Boolean);

    await client.query(
      'UPDATE pos_sale_items SET ecommerce_product_id = NULL WHERE ecommerce_product_id = ANY($1::uuid[])',
      [uuidList]
    );
    await client.query(
      'UPDATE pos_products SET ecommerce_product_id = NULL WHERE ecommerce_product_id = ANY($1::uuid[])',
      [uuidList]
    );
    await client.query(
      'UPDATE products SET pos_stock_product_id = NULL WHERE id = ANY($1::uuid[])',
      [uuidList]
    );

    await safeDelete(client, 'DELETE FROM stock_transfer_items WHERE product_id = ANY($1::uuid[])', [uuidList]);
    await safeDelete(client, 'DELETE FROM daily_stock_summaries WHERE product_id = ANY($1::uuid[])', [uuidList]);
    await safeDelete(client, 'DELETE FROM inventory_movements WHERE product_id = ANY($1::uuid[])', [uuidList]);
    await safeDelete(client, 'DELETE FROM cart_items WHERE product_id = ANY($1::uuid[])', [uuidList]);
    await safeDelete(client, 'DELETE FROM wishlist WHERE product_id = ANY($1::uuid[])', [uuidList]);
    await safeDelete(client, 'DELETE FROM reviews WHERE product_id = ANY($1::uuid[])', [uuidList]);
    await client.query('DELETE FROM product_variants WHERE product_id = ANY($1::uuid[])', [uuidList]);

    if (posIds.length) {
      await client.query('DELETE FROM pos_sale_items WHERE product_id = ANY($1::uuid[])', [posIds]);
      await safeDelete(client, 'DELETE FROM pos_stock_movements WHERE product_id = ANY($1::uuid[])', [posIds]);
      await safeDelete(client, 'DELETE FROM pos_daily_stock_snapshots WHERE product_id = ANY($1::uuid[])', [posIds]);
      await safeDelete(client, 'DELETE FROM pos_store_stock_levels WHERE product_id = ANY($1::uuid[])', [posIds]);
      await safeDelete(client, 'DELETE FROM pos_stock_levels WHERE product_id = ANY($1::uuid[])', [posIds]);
      await safeDelete(client, 'DELETE FROM pos_product_variants WHERE product_id = ANY($1::uuid[])', [posIds]);
      try {
        await client.query('DELETE FROM pos_products WHERE id = ANY($1::uuid[])', [posIds]);
      } catch (posErr) {
        if (posErr.code !== '23503') throw posErr;
      }
    }

    const del = await client.query('DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING id', [uuidList]);
    await client.query('COMMIT');
    return del.rowCount;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23503') {
      const wrapped = new Error('Product is still linked to sales or inventory records. Unpublish it first or contact admin.');
      wrapped.statusCode = 409;
      throw wrapped;
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { deleteProductsByIds };
