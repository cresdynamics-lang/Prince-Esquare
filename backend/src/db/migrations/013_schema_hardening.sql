-- Schema hardening: constraint fixes, extensions, composite indexes

-- Fix erroneous global UNIQUE on date (schema.sql bug) if it was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'daily_stock_summaries'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE (date)'
    ) THEN
        ALTER TABLE daily_stock_summaries DROP CONSTRAINT daily_stock_summaries_date_key;
    END IF;
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Link lookup indexes (run npm run link:products to dedupe before enforcing UNIQUE in prod)
CREATE INDEX IF NOT EXISTS idx_pos_products_ecommerce_lookup
    ON pos_products (ecommerce_product_id)
    WHERE ecommerce_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_pos_stock_lookup
    ON products (pos_stock_product_id)
    WHERE pos_stock_product_id IS NOT NULL;

-- POS daily snapshots: fast date lookups
CREATE INDEX IF NOT EXISTS idx_pos_daily_snapshots_date
    ON pos_daily_stock_snapshots (date DESC);

CREATE INDEX IF NOT EXISTS idx_pos_daily_snapshots_product_date
    ON pos_daily_stock_snapshots (product_id, date DESC);

-- Legacy inventory composite lookup
CREATE INDEX IF NOT EXISTS idx_inventory_movements_lookup
    ON inventory_movements (product_id, shop_id, variant_id, id DESC);

CREATE INDEX IF NOT EXISTS idx_daily_stock_summaries_composite
    ON daily_stock_summaries (product_id, shop_id, date);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id
    ON stock_transfer_items (transfer_id);
