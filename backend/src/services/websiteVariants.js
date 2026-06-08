const db = require('../config/db');
const { generateVariantSku } = require('../utils/sku');

const upsertWebsiteVariants = async (productId, variants, productSku, client = db) => {
  const incomingIds = variants.map((v) => v.id).filter(Boolean);
  if (incomingIds.length) {
    await client.query(
      'DELETE FROM product_variants WHERE product_id = $1 AND id NOT IN (SELECT unnest($2::uuid[]))',
      [productId, incomingIds]
    );
  } else if (variants.length === 0) {
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
  } else {
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
  }

  for (const v of variants) {
    const value = `${v.size || ''} / ${v.color || ''}`;
    const variantSku = generateVariantSku(productSku, v);
    if (v.id) {
      await client.query(
        `UPDATE product_variants SET name = $1, value = $2, price_modifier = $3, stock_quantity = $4,
         image_url = $5, color = $6, size = $7, sku = $8, stock_id = $9 WHERE id = $10`,
        ['Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku, v.id]
      );
    } else {
      await client.query(
        `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, sku, stock_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [productId, 'Variant', value, v.price_override || 0, v.stock || 0, v.image_url || null, v.color || null, v.size || null, variantSku, variantSku]
      );
    }
  }

  const sumR = await client.query(
    'SELECT COALESCE(SUM(stock_quantity), 0)::int AS total FROM product_variants WHERE product_id = $1',
    [productId]
  );
  const totalStock = sumR.rows[0]?.total ?? 0;
  await client.query('UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2', [totalStock, productId]);
  return totalStock;
};

module.exports = { upsertWebsiteVariants };
