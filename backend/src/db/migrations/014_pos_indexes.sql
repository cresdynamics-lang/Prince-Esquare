-- POS query indexes for sales, shifts, movements, search

CREATE INDEX IF NOT EXISTS idx_pos_sales_created_voided
    ON pos_sales (created_at DESC) WHERE is_voided = false;

CREATE INDEX IF NOT EXISTS idx_pos_sales_shift_voided
    ON pos_sales (shift_id) WHERE is_voided = false;

CREATE INDEX IF NOT EXISTS idx_pos_sales_seller_created
    ON pos_sales (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_sales_channel_created
    ON pos_sales (channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale_id
    ON pos_sale_items (sale_id);

CREATE INDEX IF NOT EXISTS idx_pos_sale_items_product_id
    ON pos_sale_items (product_id);

CREATE INDEX IF NOT EXISTS idx_pos_shifts_seller_open
    ON pos_shifts (seller_id) WHERE clock_out IS NULL;

CREATE INDEX IF NOT EXISTS idx_pos_shifts_seller_clock_in
    ON pos_shifts (seller_id, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_pos_movements_product_date
    ON pos_stock_movements (product_id, date);

CREATE INDEX IF NOT EXISTS idx_pos_movements_created
    ON pos_stock_movements (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_movements_product_type
    ON pos_stock_movements (product_id, movement_type);

CREATE INDEX IF NOT EXISTS idx_pos_variants_product_id
    ON pos_product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_pos_audit_created
    ON pos_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_audit_performed_by
    ON pos_audit_logs (performed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_profiles_email
    ON pos_profiles (email);

CREATE INDEX IF NOT EXISTS idx_pos_profiles_role_active
    ON pos_profiles (role, is_active);

CREATE INDEX IF NOT EXISTS idx_pos_products_name_trgm
    ON pos_products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_pos_products_sku_trgm
    ON pos_products USING gin (sku gin_trgm_ops);
