-- Replace the old belt catalog with the two uploaded belt products.

DO $$
DECLARE
  belts_id uuid;
BEGIN
  SELECT id INTO belts_id
  FROM categories
  WHERE slug = 'belts-ties'
  LIMIT 1;

  IF belts_id IS NULL THEN
    RAISE EXCEPTION 'Belts & Ties category not found';
  END IF;

  UPDATE products
  SET is_active = false,
      stock_quantity = 0,
      updated_at = NOW()
  WHERE category_id = belts_id;

  INSERT INTO products (
    name,
    slug,
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
    'A clean black leather belt set with mixed buckle shapes and smooth-to-textured finishes for formal and smart-casual dressing. Adjustable and easy to pair with trousers, suits, and weekend tailoring.',
    2400,
    belts_id,
    b.id,
    12,
    true,
    true,
    '/belt-001.jpeg',
    '[{"url":"/belt-001.jpeg","alt":"Black Leather Belt Set"}]'::jsonb
  FROM brands b
  WHERE b.name = 'Prince Esquire'
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
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
    'A refined dark brown leather belt set with polished metal buckles and balanced grain for office and evening dressing. Versatile with navy, charcoal, and tan tailoring.',
    2400,
    belts_id,
    b.id,
    12,
    true,
    true,
    '/belt-002.jpeg',
    '[{"url":"/belt-002.jpeg","alt":"Dark Brown Leather Belt Set"}]'::jsonb
  FROM brands b
  WHERE b.name = 'Prince Esquire'
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
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
END $$;
