-- Cost price for profit tracking (POS + website products)
ALTER TABLE pos_products
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);
