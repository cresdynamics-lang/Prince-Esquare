-- Force-fix khaki products with absurd stock (including inactive rows missed by 048/049).

WITH khaki_variant_targets AS (
  SELECT
    pv.id,
    7 + (((ROW_NUMBER() OVER (
      ORDER BY p.slug, COALESCE(pv.color, ''), COALESCE(pv.size, ''), pv.id
    ) - 1) % 9) AS realistic_qty
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
  WHERE pv.stock_quantity > 15
    AND (
      p.slug ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR pp.category ILIKE '%khaki%'
    )
)
UPDATE product_variants pv
SET stock_quantity = khaki_variant_targets.realistic_qty
FROM khaki_variant_targets
WHERE khaki_variant_targets.id = pv.id;

WITH khaki_product_targets AS (
  SELECT
    p.id,
    7 + (((ROW_NUMBER() OVER (ORDER BY p.slug, p.id) - 1) % 9) AS realistic_qty
  FROM products p
  LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
  WHERE p.stock_quantity > 15
    AND NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
    AND (
      p.slug ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR pp.category ILIKE '%khaki%'
    )
)
UPDATE products p
SET stock_quantity = khaki_product_targets.realistic_qty,
    updated_at = NOW()
FROM khaki_product_targets
WHERE khaki_product_targets.id = p.id;

WITH khaki_totals AS (
  SELECT
    p.id AS product_id,
    COALESCE(SUM(pv.stock_quantity), p.stock_quantity, 0)::int AS total
  FROM products p
  LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  WHERE (
      p.slug ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR pp.category ILIKE '%khaki%'
    )
  GROUP BY p.id, p.stock_quantity
)
UPDATE products p
SET stock_quantity = kt.total,
    updated_at = NOW()
FROM khaki_totals kt
WHERE kt.product_id = p.id;

UPDATE pos_stock_levels s
SET current_qty = sub.total,
    updated_at = NOW()
FROM (
  SELECT
    pp.id AS pos_id,
    COALESCE(SUM(pv.stock_quantity), p.stock_quantity, 0)::int AS total
  FROM pos_products pp
  JOIN products p ON p.id = pp.ecommerce_product_id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  WHERE pp.sku NOT LIKE 'POS-%'
    AND (
      pp.category ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
    )
  GROUP BY pp.id, p.stock_quantity
) sub
WHERE s.product_id = sub.pos_id;

INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
SELECT sub.pos_id, sub.total, NOW()
FROM (
  SELECT
    pp.id AS pos_id,
    COALESCE(SUM(pv.stock_quantity), p.stock_quantity, 0)::int AS total
  FROM pos_products pp
  JOIN products p ON p.id = pp.ecommerce_product_id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  WHERE pp.sku NOT LIKE 'POS-%'
    AND (
      pp.category ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
    )
  GROUP BY pp.id, p.stock_quantity
) sub
ON CONFLICT (product_id) DO UPDATE
SET current_qty = EXCLUDED.current_qty,
    updated_at = NOW();
