-- Per-product in-store price (POS). Falls back to discount_price / price when null.
ALTER TABLE products ADD COLUMN IF NOT EXISTS pos_sell_price DECIMAL(10, 2);

COMMENT ON COLUMN products.pos_sell_price IS
  'Shop/POS sell price for this product. When null, POS uses discount_price or price.';
