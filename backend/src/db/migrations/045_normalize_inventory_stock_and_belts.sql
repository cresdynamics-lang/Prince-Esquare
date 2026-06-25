-- Normalize inflated stock values and make the two belt products visible in POS inventory.
INSERT INTO categories (name, slug, description)
VALUES ('Belts & Ties', 'belts-ties', 'Belts and ties from Prince Esquire')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = COALESCE(categories.description, EXCLUDED.description);

INSERT INTO brands (name, slug, description)
VALUES ('Prince Esquire', 'prince-esquire', 'Prince Esquire')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = COALESCE(brands.description, EXCLUDED.description);

INSERT INTO products (
  name,
  slug,
  sku,
  description,
  price,
  category_id,
  brand_id,
  stock_quantity,
  is_featured,
  is_active,
  thumbnail,
  images
)
SELECT
  'Black Leather Belt Set',
  'black-leather-belt-set',
  'BLACK-LEATHER-BELT-SET',
  'A clean black leather belt set with mixed buckle shapes and smooth-to-textured finishes for formal and smart-casual dressing. Adjustable and easy to pair with trousers, suits, and weekend tailoring.',
  2400,
  c.id,
  b.id,
  12,
  true,
  true,
  '/belt-001.jpeg',
  '[{"url":"/belt-001.jpeg","alt":"Black Leather Belt Set"}]'::jsonb
FROM categories c
CROSS JOIN brands b
WHERE c.slug = 'belts-ties'
  AND b.slug = 'prince-esquire'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_featured = EXCLUDED.is_featured,
  is_active = true,
  thumbnail = EXCLUDED.thumbnail,
  images = EXCLUDED.images,
  updated_at = NOW();

INSERT INTO products (
  name,
  slug,
  sku,
  description,
  price,
  category_id,
  brand_id,
  stock_quantity,
  is_featured,
  is_active,
  thumbnail,
  images
)
SELECT
  'Dark Brown Leather Belt Set',
  'dark-brown-leather-belt-set',
  'DARK-BROWN-LEATHER-BELT-SET',
  'A refined dark brown leather belt set with polished metal buckles and balanced grain for office and evening dressing. Versatile with navy, charcoal, and tan tailoring.',
  2400,
  c.id,
  b.id,
  9,
  true,
  true,
  '/belt-002.jpeg',
  '[{"url":"/belt-002.jpeg","alt":"Dark Brown Leather Belt Set"}]'::jsonb
FROM categories c
CROSS JOIN brands b
WHERE c.slug = 'belts-ties'
  AND b.slug = 'prince-esquire'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_featured = EXCLUDED.is_featured,
  is_active = true,
  thumbnail = EXCLUDED.thumbnail,
  images = EXCLUDED.images,
  updated_at = NOW();

WITH ranked_variants AS (
  SELECT
    pv.id,
    7 + (((ROW_NUMBER() OVER (ORDER BY p.slug, COALESCE(pv.color, ''), COALESCE(pv.size, ''), pv.id)) - 1) % 9) AS realistic_qty
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE p.is_active = true
)
UPDATE product_variants pv
SET stock_quantity = ranked_variants.realistic_qty
FROM ranked_variants
WHERE ranked_variants.id = pv.id;

WITH variant_totals AS (
  SELECT product_id, COALESCE(SUM(stock_quantity), 0)::int AS total
  FROM product_variants
  GROUP BY product_id
)
UPDATE products p
SET stock_quantity = vt.total,
    updated_at = NOW()
FROM variant_totals vt
WHERE vt.product_id = p.id
  AND p.is_active = true;

WITH ranked_products AS (
  SELECT
    p.id,
    7 + (((ROW_NUMBER() OVER (ORDER BY p.slug, p.id)) - 1) % 9) AS realistic_qty
  FROM products p
  WHERE p.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
    )
    AND p.slug NOT IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
)
UPDATE products p
SET stock_quantity = ranked_products.realistic_qty,
    updated_at = NOW()
FROM ranked_products
WHERE ranked_products.id = p.id;

UPDATE products
SET stock_quantity = CASE
      WHEN slug = 'black-leather-belt-set' THEN 12
      WHEN slug = 'dark-brown-leather-belt-set' THEN 10
      ELSE stock_quantity
    END,
    is_active = true,
    updated_at = NOW()
WHERE slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set');

DELETE FROM product_variants
WHERE product_id IN (
  SELECT id FROM products
  WHERE slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
);

UPDATE products p
SET is_active = false,
    stock_quantity = 0,
    updated_at = NOW()
FROM categories c
WHERE c.id = p.category_id
  AND c.slug = 'belts-ties'
  AND p.slug NOT IN ('black-leather-belt-set', 'dark-brown-leather-belt-set');

UPDATE pos_products pp
SET ecommerce_product_id = NULL
WHERE ecommerce_product_id IN (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.slug = 'belts-ties'
    AND p.slug NOT IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
);

UPDATE products p
SET pos_stock_product_id = pp.id
FROM pos_products pp
WHERE pp.ecommerce_product_id = p.id
  AND p.pos_stock_product_id IS DISTINCT FROM pp.id;

WITH belt_products AS (
  SELECT p.*
  FROM products p
  WHERE p.slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
),
created_pos AS (
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
    COALESCE(NULLIF(bp.sku, ''), UPPER(REPLACE(bp.slug, '-', '-'))),
    'Belts & Ties',
    bp.price,
    bp.price,
    bp.price,
    bp.id,
    jsonb_build_object(
      'category_id', bp.category_id,
      'category_name', 'Belts & Ties',
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
  WHERE NOT EXISTS (
    SELECT 1 FROM pos_products pp WHERE pp.ecommerce_product_id = bp.id
  )
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    shop_price = EXCLUDED.shop_price,
    online_price = EXCLUDED.online_price,
    store_price = EXCLUDED.store_price,
    ecommerce_product_id = EXCLUDED.ecommerce_product_id,
    website_details = EXCLUDED.website_details
  RETURNING id, ecommerce_product_id
),
existing_pos AS (
  SELECT pp.id, pp.ecommerce_product_id
  FROM pos_products pp
  JOIN belt_products bp ON bp.id = pp.ecommerce_product_id
),
all_pos AS (
  SELECT * FROM created_pos
  UNION
  SELECT * FROM existing_pos
)
UPDATE products p
SET pos_stock_product_id = all_pos.id,
    updated_at = NOW()
FROM all_pos
WHERE all_pos.ecommerce_product_id = p.id;

UPDATE pos_products pp
SET name = p.name,
    category = COALESCE(c.name, 'General'),
    shop_price = COALESCE(p.pos_sell_price, p.discount_price, p.price, pp.shop_price),
    online_price = COALESCE(p.price, pp.online_price),
    cost_price = COALESCE(p.cost_price, pp.cost_price),
    website_details = jsonb_build_object(
      'category_id', p.category_id,
      'category_name', COALESCE(c.name, pp.category),
      'brand_id', p.brand_id,
      'description', p.description,
      'price', p.price,
      'discount_price', p.discount_price,
      'thumbnail', p.thumbnail,
      'images', COALESCE(p.images, '[]'::jsonb),
      'variants', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', pv.id,
          'color', pv.color,
          'size', pv.size,
          'stock', pv.stock_quantity,
          'price_override', COALESCE(pv.price_modifier, 0),
          'image_url', pv.image_url,
          'sku', COALESCE(pv.sku, pv.stock_id)
        ) ORDER BY pv.color, pv.size)
        FROM product_variants pv
        WHERE pv.product_id = p.id
      ), '[]'::jsonb),
      'color_groups', '[]'::jsonb
    )
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE pp.ecommerce_product_id = p.id
  AND p.is_active = true;

INSERT INTO pos_stock_levels (product_id, current_qty, updated_at)
SELECT pp.id, p.stock_quantity, NOW()
FROM pos_products pp
JOIN products p ON p.id = pp.ecommerce_product_id
WHERE p.is_active = true
ON CONFLICT (product_id) DO UPDATE
SET current_qty = EXCLUDED.current_qty,
    updated_at = NOW();

INSERT INTO pos_store_stock_levels (product_id, current_qty, updated_at)
SELECT pp.id, 0, NOW()
FROM pos_products pp
JOIN products p ON p.id = pp.ecommerce_product_id
WHERE p.is_active = true
ON CONFLICT (product_id) DO NOTHING;




