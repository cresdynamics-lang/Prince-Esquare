-- Sets: outfit look products (one image, multiple garments) + Sets category
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS set_components JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.set_components IS
  'Outfit set pieces: [{id, name, category_hint, size, price, note}] — product.price should equal sum of prices';

INSERT INTO categories (name, slug, description, parent_id, is_featured)
SELECT 'Sets', 'sets', 'Styled outfit looks — multiple pieces in one image', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sets' AND parent_id IS NULL);
