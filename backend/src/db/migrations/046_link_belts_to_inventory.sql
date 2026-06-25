-- Ensure the two live belt products appear in managed POS inventory.

WITH belt_products AS (
  SELECT p.*, c.name AS category_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE p.is_active = true
    AND p.slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
),
upsert_pos AS (
  INSERT INTO pos_products (
    name,
    sku,
    category,
    shop_price,
    online_price,
    store_price,
    ecommerce_product_id,
    website_details
  )
  SELECT
    bp.name,
    bp.sku,
    COALESCE(bp.category_name, 'Belts & Ties'),
    bp.price,
    bp.price,
    bp.price,
    bp.id,
    jsonb_build_object(
      'category_id', bp.category_id,
      'category_name', COALESCE(bp.category_name, 'Belts & Ties'),
      'brand_id', bp.brand_id,
      'description', bp.description,
      'price', bp.price,
      'discount_price', bp.discount_price,
      'thumbnail', bp.thumbnail,
      'images', COALESCE(bp.images, '[]'::jsonb),
      'variants', '[]'::jsonb,
      'color_groups', '[]'::jsonb
    )
  FROM belt_products bp
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    shop_price = EXCLUDED.shop_price,
    online_price = EXCLUDED.online_price,
    store_price = EXCLUDED.store_price,
    ecommerce_product_id = EXCLUDED.ecommerce_product_id,
    website_details = EXCLUDED.website_details
  RETURNING id, ecommerce_product_id
)
UPDATE products p
SET pos_stock_product_id = pp.id,
    updated_at = NOW()
FROM pos_products pp
JOIN belt_products bp ON bp.id = pp.ecommerce_product_id
WHERE p.id = bp.id
  AND p.pos_stock_product_id IS DISTINCT FROM pp.id;

-- Repair POS rows already linked by product id but missing reverse ecommerce id
UPDATE pos_products pp
SET ecommerce_product_id = p.id,
    category = COALESCE(c.name, pp.category, 'Belts & Ties'),
    name = COALESCE(p.name, pp.name),
    shop_price = COALESCE(p.price, pp.shop_price),
    online_price = COALESCE(p.price, pp.online_price)
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.pos_stock_product_id = pp.id
  AND p.slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
  AND pp.ecommerce_product_id IS DISTINCT FROM p.id;

INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
SELECT pp.id, GREATEST(p.stock_quantity, 0), NOW()
FROM pos_products pp
JOIN products p ON p.id = pp.ecommerce_product_id
WHERE p.slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
ON CONFLICT (product_id) DO UPDATE
SET current_qty = EXCLUDED.current_qty,
    updated_at = NOW();

INSERT INTO pos_store_stock_levels (product_id, current_qty, updated_at)
SELECT pp.id, 0, NOW()
FROM pos_products pp
JOIN products p ON p.id = pp.ecommerce_product_id
WHERE p.slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
ON CONFLICT (product_id) DO NOTHING;
