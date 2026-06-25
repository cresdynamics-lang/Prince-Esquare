-- Normalize the belts catalog and pin tailored suit imagery to the two-piece asset.

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
  AND b.name = 'Prince Esquire'
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
  c.id,
  b.id,
  12,
  true,
  true,
  '/belt-002.jpeg',
  '[{"url":"/belt-002.jpeg","alt":"Dark Brown Leather Belt Set"}]'::jsonb
FROM categories c
CROSS JOIN brands b
WHERE c.slug = 'belts-ties'
  AND b.name = 'Prince Esquire'
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

UPDATE products
SET is_active = false,
    stock_quantity = 0,
    updated_at = NOW()
WHERE category_id = (SELECT id FROM categories WHERE slug = 'belts-ties')
  AND slug NOT IN ('black-leather-belt-set', 'dark-brown-leather-belt-set');

DELETE FROM product_variants
WHERE product_id IN (
  SELECT id FROM products
  WHERE category_id = (SELECT id FROM categories WHERE slug = 'belts-ties')
);

UPDATE products
SET thumbnail = '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
    images = '[{"url":"/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg","alt":"Fabio Bironin Dark Navy Two Piece Suit"}]'::jsonb,
    updated_at = NOW()
WHERE slug = 'fabio-bironin-dark-navy-wool-two-piece-suit-pg0003-3-03';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
    updated_at = NOW()
WHERE slug = 'why-a-tailored-suit-still-matters-in-2026';