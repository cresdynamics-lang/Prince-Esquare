-- Capture incomplete checkouts (phone + bag) before final Place order
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_is_draft_created
  ON orders (is_draft, created_at DESC)
  WHERE is_draft = true;

CREATE INDEX IF NOT EXISTS idx_orders_draft_phone
  ON orders ((regexp_replace(COALESCE(shipping_address->>'phone', ''), '\D', '', 'g')))
  WHERE is_draft = true;
