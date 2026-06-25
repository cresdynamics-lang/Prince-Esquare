-- Belt products were linked to POS-* sku rows (hidden from inventory).
-- Point them at the real product SKU rows instead.

UPDATE products p
SET pos_stock_product_id = pp.id,
    updated_at = NOW()
FROM pos_products pp
WHERE pp.ecommerce_product_id = p.id
  AND pp.sku = p.sku
  AND p.slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
  AND p.pos_stock_product_id IS DISTINCT FROM pp.id;

UPDATE pos_products pp
SET ecommerce_product_id = NULL
WHERE pp.sku LIKE 'POS-%'
  AND pp.ecommerce_product_id IN (
    SELECT id FROM products
    WHERE slug IN ('black-leather-belt-set', 'dark-brown-leather-belt-set')
  );

-- Hide inactive legacy belt POS rows from managed inventory
UPDATE pos_products pp
SET ecommerce_product_id = NULL
FROM products p
WHERE pp.ecommerce_product_id = p.id
  AND p.is_active = false
  AND p.category_id IN (SELECT id FROM categories WHERE slug = 'belts-ties');
