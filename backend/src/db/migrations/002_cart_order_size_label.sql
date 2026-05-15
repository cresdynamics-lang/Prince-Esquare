-- Per-line size selection (color remains in product_variants)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size_label VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_label VARCHAR(50);
