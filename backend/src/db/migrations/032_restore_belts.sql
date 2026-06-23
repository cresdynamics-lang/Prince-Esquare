-- Restore the two belt products removed by the trim migration.

INSERT INTO products (
  name,
  slug,
  description,
  price,
  discount_price,
  category_id,
  brand_id,
  stock_quantity,
  is_featured,
  is_active,
  thumbnail,
  images
)
SELECT
  'Stefano Ricci Leather Belt',
  'stefano-ricci-leather-belt',
  'Signature Stefano Ricci buckle on premium calfskin leather.',
  65000,
  NULL,
  c.id,
  b.id,
  0,
  true,
  true,
  '/WhatsApp Image 2026-05-12 at 8.07.27 PM.jpeg',
  '[]'::jsonb
FROM categories c
LEFT JOIN brands b ON b.name = 'Stefano Ricci'
WHERE c.slug = 'belts-ties'
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  thumbnail = EXCLUDED.thumbnail,
  images = EXCLUDED.images,
  updated_at = NOW();

INSERT INTO products (
  name,
  slug,
  description,
  price,
  discount_price,
  category_id,
  brand_id,
  stock_quantity,
  is_featured,
  is_active,
  thumbnail,
  images
)
SELECT
  'Black Pebbled Leather Dress Belt',
  'black-pebbled-leather-dress-belt',
  'Black coarse-pebbled leather dress belt with brushed silver-tone rectangular buckle.',
  2100,
  NULL,
  c.id,
  b.id,
  0,
  true,
  true,
  '/WhatsApp Image 2026-05-12 at 8.07.22 PM.jpeg',
  '[]'::jsonb
FROM categories c
LEFT JOIN brands b ON b.name = 'Prince Esquire'
WHERE c.slug = 'belts-ties'
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  thumbnail = EXCLUDED.thumbnail,
  images = EXCLUDED.images,
  updated_at = NOW();
