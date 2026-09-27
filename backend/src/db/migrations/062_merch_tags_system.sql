-- Merch tag system v2: separate pricing / freshness / merch tags
-- Spec: is_on_sale | get_new+new_until | merch_tags[] (limited, editors_choice, presidential_pick, bespoke, bestseller)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS get_new BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bespoke_lead_time_days INTEGER;

-- Ensure new_until exists (from 061)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS new_until TIMESTAMPTZ;

-- Normalize hyphenated tag ids → underscore; strip 'new' from merch_tags (freshness is get_new)
UPDATE products
SET merch_tags = (
  SELECT COALESCE(ARRAY_AGG(DISTINCT x ORDER BY x), '{}')
  FROM (
    SELECT CASE
      WHEN t IN ('editors-choice', 'editors_choice') THEN 'editors_choice'
      WHEN t IN ('presidential-pick', 'presidential_pick') THEN 'presidential_pick'
      WHEN t = 'new' THEN NULL
      ELSE t
    END AS x
    FROM unnest(COALESCE(merch_tags, '{}')) AS t
  ) s
  WHERE x IS NOT NULL
    AND x IN ('limited', 'editors_choice', 'presidential_pick', 'bespoke', 'bestseller')
);

-- Backfill freshness from remaining new window or recent creates
UPDATE products
SET get_new = true,
    new_until = COALESCE(new_until, created_at + INTERVAL '21 days')
WHERE is_active = true
  AND (
    (new_until IS NOT NULL AND new_until > NOW())
    OR created_at > NOW() - INTERVAL '21 days'
  );

-- Expire get_new where window already passed (keep new_until for history)
UPDATE products
SET get_new = false
WHERE get_new = true
  AND new_until IS NOT NULL
  AND new_until <= NOW();

-- Default bespoke lead days where tagged
UPDATE products
SET bespoke_lead_time_days = COALESCE(bespoke_lead_time_days, 14)
WHERE 'bespoke' = ANY(COALESCE(merch_tags, '{}'));

CREATE INDEX IF NOT EXISTS idx_products_get_new
  ON products (get_new)
  WHERE get_new = true;

CREATE INDEX IF NOT EXISTS idx_products_merch_bestseller
  ON products USING GIN (merch_tags)
  WHERE merch_tags @> ARRAY['bestseller']::text[];
