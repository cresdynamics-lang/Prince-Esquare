-- Phase 0: taxonomy v2 — hierarchy metadata + product cross/merch tags
-- Does not delete categories; seed script upserts the locked tree.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nav_copy TEXT,
  ADD COLUMN IF NOT EXISTS hero_image TEXT,
  ADD COLUMN IF NOT EXISTS tile_image TEXT,
  ADD COLUMN IF NOT EXISTS is_nav_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS depth INTEGER NOT NULL DEFAULT 0;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cross_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS merch_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS new_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_categories_parent_sort
  ON categories (parent_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_nav_primary
  ON categories (is_nav_primary)
  WHERE is_nav_primary = true;

CREATE INDEX IF NOT EXISTS idx_products_cross_tags
  ON products USING GIN (cross_tags);

CREATE INDEX IF NOT EXISTS idx_products_merch_tags
  ON products USING GIN (merch_tags);

CREATE INDEX IF NOT EXISTS idx_products_new_until
  ON products (new_until)
  WHERE new_until IS NOT NULL;
