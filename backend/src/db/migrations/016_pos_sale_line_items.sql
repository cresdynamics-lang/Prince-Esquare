-- Track individual ecommerce product sold at POS (name + price per line)
ALTER TABLE pos_sale_items
  ADD COLUMN IF NOT EXISTS ecommerce_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE pos_sale_items
  ADD COLUMN IF NOT EXISTS line_name VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_pos_sale_items_ecommerce
  ON pos_sale_items (ecommerce_product_id)
  WHERE ecommerce_product_id IS NOT NULL;
