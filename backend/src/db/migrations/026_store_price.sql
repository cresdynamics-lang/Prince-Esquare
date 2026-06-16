-- Warehouse (store) price tier — separate from shop/website retail price
ALTER TABLE pos_products
  ADD COLUMN IF NOT EXISTS store_price DECIMAL(10, 2);

COMMENT ON COLUMN pos_products.store_price IS 'Warehouse intake price; shop_price and online_price are the retail floor/web price';
