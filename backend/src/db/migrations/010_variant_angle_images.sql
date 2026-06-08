-- Multi-angle product views (front, side, back) per variant
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS angle_images JSONB DEFAULT '[]';
