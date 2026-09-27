-- Admin-managed sale catalog flag (replaces hard-coded category filters)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_on_sale
  ON products (is_on_sale)
  WHERE is_on_sale = true;

-- Seed current hard-coded sale catalog so existing ads/storefront stay intact
UPDATE products p
SET is_on_sale = true
FROM categories c
WHERE p.category_id = c.id
  AND p.is_active = true
  AND p.stock_quantity > 0
  AND (
    c.slug = 'track-suits'
    OR c.slug = 'khaki'
    OR (c.slug = 'formal-shoes' AND p.name NOT ILIKE '%boot%')
    OR c.slug = 'boots'
    OR (c.slug = 'formal-shoes' AND p.name ILIKE '%boot%')
  );
