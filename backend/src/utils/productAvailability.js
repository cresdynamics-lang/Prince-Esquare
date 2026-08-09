const db = require('../config/db');

const attachVariantAvailability = async (products, { includePosStock = false } = {}) => {
  const list = Array.isArray(products) ? products : [products];
  const ids = list.map((p) => p.id).filter(Boolean);
  if (!ids.length) return products;

  let variantR;
  try {
    variantR = await db.query(
      `SELECT product_id,
              COUNT(*)::bigint AS variant_count,
              COALESCE(SUM(stock_quantity), 0)::bigint AS variant_stock_total,
              COUNT(*) FILTER (WHERE stock_quantity > 0)::bigint AS variants_in_stock
       FROM product_variants
       WHERE product_id = ANY($1::uuid[])
       GROUP BY product_id`,
      [ids]
    );
  } catch (error) {
    console.warn('Variant availability lookup failed; returning products without enrichment:', error.message);
    return products;
  }

  const toSafeInt = (value) => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const byProduct = Object.fromEntries(variantR.rows.map((r) => [r.product_id, {
    ...r,
    variant_count: toSafeInt(r.variant_count),
    variant_stock_total: toSafeInt(r.variant_stock_total),
    variants_in_stock: toSafeInt(r.variants_in_stock),
  }]));

  const enriched = list.map((p) => {
    const v = byProduct[p.id];
    const hasVariants = v && v.variant_count > 0;
    const onlineStock = hasVariants ? v.variant_stock_total : (p.stock_quantity ?? 0);

    if (includePosStock) {
      let onlineInStock = hasVariants ? v.variants_in_stock > 0 : (p.stock_quantity ?? 0) > 0;
      if (p.pos_in_stock === true && !onlineInStock) {
        onlineInStock = true;
      }
      return {
        ...p,
        online_stock_total: onlineStock,
        online_in_stock: onlineInStock,
        out_of_stock: p.is_active === false || !onlineInStock,
        display_stock: onlineStock,
      };
    }

    // Storefront: never mark products out of stock (new uploads with 0 stock still show as available).
    return {
      ...p,
      online_stock_total: onlineStock,
      online_in_stock: true,
      out_of_stock: false,
      display_stock: onlineStock,
    };
  });

  return Array.isArray(products) ? enriched : enriched[0];
};

module.exports = { attachVariantAvailability };
