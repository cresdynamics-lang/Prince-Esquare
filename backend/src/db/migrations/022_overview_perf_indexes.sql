-- Faster POS overview and low-stock queries

CREATE INDEX IF NOT EXISTS idx_pos_products_sku_catalog
    ON pos_products (sku)
    WHERE sku LIKE 'PE-CAT-%';

CREATE INDEX IF NOT EXISTS idx_pos_stock_levels_product_qty
    ON pos_stock_levels (product_id, current_qty);

CREATE INDEX IF NOT EXISTS idx_pos_products_low_stock
    ON pos_products (low_stock_threshold, id)
    WHERE sku LIKE 'PE-CAT-%';

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
    ON product_variants (product_id);
