-- Broaden khaki stock fix: include POS Khaki category and name/slug matches
-- (048 only matched ecommerce category; e.g. Black Smart Flex Khakis was missed).

WITH khaki_products AS (
  SELECT DISTINCT p.id, p.slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
  WHERE p.is_active = true
    AND (
      c.slug ILIKE '%khaki%'
      OR LOWER(c.name) = 'khaki'
      OR c.name ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
      OR pp.category ILIKE '%khaki%'
    )
),
ranked_variants AS (
  SELECT
    pv.id,
    7 + (((ROW_NUMBER() OVER (ORDER BY kp.slug, COALESCE(pv.color, ''), COALESCE(pv.size, ''), pv.id)) - 1) % 9) AS realistic_qty
  FROM product_variants pv
  JOIN khaki_products kp ON kp.id = pv.product_id
)
UPDATE product_variants pv
SET stock_quantity = ranked_variants.realistic_qty
FROM ranked_variants
WHERE ranked_variants.id = pv.id;

WITH khaki_products AS (
  SELECT DISTINCT p.id, p.slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
  WHERE p.is_active = true
    AND (
      c.slug ILIKE '%khaki%'
      OR LOWER(c.name) = 'khaki'
      OR c.name ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
      OR pp.category ILIKE '%khaki%'
    )
),
khaki_no_variants AS (
  SELECT
    p.id,
    7 + (((ROW_NUMBER() OVER (ORDER BY p.slug, p.id)) - 1) % 9) AS realistic_qty
  FROM products p
  JOIN khaki_products kp ON kp.id = p.id
  WHERE NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
)
UPDATE products p
SET stock_quantity = knv.realistic_qty,
    updated_at = NOW()
FROM khaki_no_variants knv
WHERE knv.id = p.id;

WITH khaki_products AS (
  SELECT DISTINCT p.id
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN pos_products pp ON pp.ecommerce_product_id = p.id AND pp.sku NOT LIKE 'POS-%'
  WHERE p.is_active = true
    AND (
      c.slug ILIKE '%khaki%'
      OR LOWER(c.name) = 'khaki'
      OR c.name ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
      OR pp.category ILIKE '%khaki%'
    )
),
variant_totals AS (
  SELECT
    p.id AS product_id,
    COALESCE(SUM(pv.stock_quantity), p.stock_quantity, 0)::int AS total
  FROM products p
  JOIN khaki_products kp ON kp.id = p.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  GROUP BY p.id, p.stock_quantity
)
UPDATE products p
SET stock_quantity = vt.total,
    updated_at = NOW()
FROM variant_totals vt
WHERE vt.product_id = p.id;

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
    AND pp.ecommerce_product_id IS NOT NULL
    AND (
      pp.category ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
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
    AND pp.ecommerce_product_id IS NOT NULL
    AND (
      pp.category ILIKE '%khaki%'
      OR p.name ILIKE '%khaki%'
      OR p.slug ILIKE '%khaki%'
    )
  GROUP BY pp.id, p.stock_quantity
) sub
ON CONFLICT (product_id) DO UPDATE
SET current_qty = EXCLUDED.current_qty,
    updated_at = NOW();
