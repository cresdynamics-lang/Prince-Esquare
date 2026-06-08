-- Link ecommerce products to POS inventory
ALTER TABLE pos_products
  ADD COLUMN IF NOT EXISTS ecommerce_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pos_stock_product_id UUID REFERENCES pos_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_pos_stock ON products(pos_stock_product_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_ecommerce ON pos_products(ecommerce_product_id);
