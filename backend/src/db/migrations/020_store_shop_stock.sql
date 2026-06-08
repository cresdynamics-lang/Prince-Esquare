-- Store (warehouse) vs Shop (sales floor) — two location stock levels per product
CREATE TABLE IF NOT EXISTS pos_store_stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES pos_products(id) ON DELETE CASCADE,
  current_qty INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_store_stock_product ON pos_store_stock_levels (product_id);

COMMENT ON TABLE pos_store_stock_levels IS 'Warehouse/store stock — source for shop replenishment (Stock In to shop).';
