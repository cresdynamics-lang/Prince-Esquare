-- Draft website listing data stored on inventory items (category, variants, images)
ALTER TABLE pos_products
  ADD COLUMN IF NOT EXISTS website_details JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_pos_products_website_details
  ON pos_products USING gin (website_details);
