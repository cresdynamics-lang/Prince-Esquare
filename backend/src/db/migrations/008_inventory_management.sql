-- Migration: Inventory Management System
-- Description: Multi-shop inventory tracking with automatic stock calculations
-- Date: 2024-01-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- INVENTORY MANAGEMENT SYSTEM
-- Multi-Shop Inventory Tracking
-- ========================================

-- Shops/Branches Table
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements Table (Tracks all stock movements)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('opening_stock', 'sales', 'stock_in', 'stock_out', 'transfer_out', 'transfer_in')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reference_id UUID REFERENCES inventory_movements(id) ON DELETE SET NULL,
    reference_type VARCHAR(50),
    reference_details JSONB,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closing_stock INTEGER NOT NULL DEFAULT 0
);

-- Daily Stock Summary Table (End of day closing stock)
CREATE TABLE IF NOT EXISTS daily_stock_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    sales INTEGER NOT NULL DEFAULT 0,
    stock_in INTEGER NOT NULL DEFAULT 0,
    stock_out INTEGER NOT NULL DEFAULT 0,
    closing_stock INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, variant_id, shop_id, date)
);

-- Stock Transfer Table (Links transfers between shops)
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    from_shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    to_shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    total_quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Transfer Items Table (Detailed items in each transfer)
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger Functions
CREATE OR REPLACE FUNCTION update_inventory_closing_stock()
RETURNS TRIGGER AS $$
DECLARE
    prev_closing_stock INTEGER;
BEGIN
    -- Get previous closing stock for this product/shop combination
    SELECT closing_stock INTO prev_closing_stock
    FROM inventory_movements
    WHERE product_id = NEW.product_id
      AND shop_id = NEW.shop_id
      AND (variant_id IS NULL OR variant_id = NEW.variant_id)
      AND id < NEW.id
    ORDER BY id DESC
    LIMIT 1;
    
    -- Calculate new closing stock
    IF prev_closing_stock IS NULL THEN
        prev_closing_stock = 0;
    END IF;
    
    -- Update closing stock based on movement type
    IF NEW.movement_type = 'opening_stock' OR NEW.movement_type = 'stock_in' OR NEW.movement_type = 'transfer_in' THEN
        NEW.closing_stock = prev_closing_stock + NEW.quantity;
    ELSIF NEW.movement_type = 'sales' OR NEW.movement_type = 'stock_out' OR NEW.movement_type = 'transfer_out' THEN
        NEW.closing_stock = prev_closing_stock - NEW.quantity;
    END IF;
    
    -- Prevent negative stock
    IF NEW.closing_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Closing stock cannot be negative.';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_daily_stock_summary()
RETURNS TRIGGER AS $$
DECLARE
    summary_record RECORD;
BEGIN
    -- Find or create daily summary for this product/shop/date
    SELECT * INTO summary_record
    FROM daily_stock_summaries
    WHERE product_id = NEW.product_id
      AND shop_id = NEW.shop_id
      AND date = NEW.transaction_date
      AND (variant_id IS NULL OR variant_id = NEW.variant_id);
    
    IF summary_record IS NULL THEN
        -- Insert new daily summary
        INSERT INTO daily_stock_summaries (product_id, variant_id, shop_id, date, opening_stock, sales, stock_in, stock_out, closing_stock)
        VALUES (
            NEW.product_id,
            NEW.variant_id,
            NEW.shop_id,
            NEW.transaction_date,
            0,
            CASE WHEN NEW.movement_type = 'sales' THEN NEW.quantity ELSE 0 END,
            CASE WHEN NEW.movement_type = 'stock_in' OR NEW.movement_type = 'transfer_in' THEN NEW.quantity ELSE 0 END,
            CASE WHEN NEW.movement_type = 'stock_out' OR NEW.movement_type = 'transfer_out' THEN NEW.quantity ELSE 0 END,
            CASE 
                WHEN NEW.movement_type IN ('stock_in', 'transfer_in') THEN NEW.quantity
                WHEN NEW.movement_type = 'stock_out' OR NEW.movement_type = 'transfer_out' THEN -NEW.quantity
                ELSE 0 
            END
        );
    ELSE
        -- Update existing daily summary
        UPDATE daily_stock_summaries
        SET 
            sales = sales + CASE WHEN NEW.movement_type = 'sales' THEN NEW.quantity ELSE 0 END,
            stock_in = stock_in + CASE WHEN NEW.movement_type IN ('stock_in', 'transfer_in') THEN NEW.quantity ELSE 0 END,
            stock_out = stock_out + CASE WHEN NEW.movement_type IN ('stock_out', 'transfer_out') THEN NEW.quantity ELSE 0 END,
            closing_stock = opening_stock + stock_in - stock_out - sales
        WHERE id = summary_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for inventory movements
DROP TRIGGER IF EXISTS update_inventory_closing_stock_trigger ON inventory_movements;
CREATE TRIGGER update_inventory_closing_stock_trigger
BEFORE INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_inventory_closing_stock();

DROP TRIGGER IF EXISTS update_daily_stock_summary_trigger ON inventory_movements;
CREATE TRIGGER update_daily_stock_summary_trigger
AFTER INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_daily_stock_summary();

-- Triggers for stock transfers
DROP TRIGGER IF EXISTS update_stock_transfers_updated_at ON stock_transfers;
CREATE TRIGGER update_stock_transfers_updated_at
BEFORE UPDATE ON stock_transfers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_shop ON inventory_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_shop ON inventory_movements(product_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(transaction_date);

CREATE INDEX IF NOT EXISTS idx_daily_stock_summaries_product ON daily_stock_summaries(product_id);
CREATE INDEX IF NOT EXISTS idx_daily_stock_summaries_shop ON daily_stock_summaries(shop_id);
CREATE INDEX IF NOT EXISTS idx_daily_stock_summaries_date ON daily_stock_summaries(date);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_from ON stock_transfers(from_shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to ON stock_transfers(to_shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product ON stock_transfer_items(product_id);

-- View for current stock per product per shop
CREATE OR REPLACE VIEW v_current_stock AS
SELECT 
    im.product_id,
    im.variant_id,
    im.shop_id,
    s.name as shop_name,
    s.code as shop_code,
    p.name as product_name,
    p.slug as product_slug,
    COALESCE(
        (SELECT closing_stock FROM inventory_movements im2 
         WHERE im2.product_id = im.product_id 
           AND im2.shop_id = im.shop_id 
           AND (im2.variant_id IS NULL OR im2.variant_id = im.variant_id)
         ORDER BY id DESC LIMIT 1), 0
    ) as current_stock,
    (SELECT MIN(transaction_date) FROM inventory_movements im3 
     WHERE im3.product_id = im.product_id 
       AND im3.shop_id = im.shop_id 
       AND (im3.variant_id IS NULL OR im3.variant_id = im.variant_id)
    ) as first_movement_date
FROM inventory_movements im
JOIN shops s ON im.shop_id = s.id
JOIN products p ON im.product_id = p.id
GROUP BY im.product_id, im.variant_id, im.shop_id, s.name, s.code, p.name, p.slug;

-- View for stock movement summary by shop
CREATE OR REPLACE VIEW v_stock_summary_by_shop AS
SELECT 
    s.id as shop_id,
    s.name as shop_name,
    s.code as shop_code,
    COUNT(DISTINCT im.product_id) as total_products_tracked,
    COALESCE(SUM(CASE WHEN im.movement_type = 'opening_stock' THEN im.quantity ELSE 0 END), 0) as total_opening_stock,
    COALESCE(SUM(CASE WHEN im.movement_type = 'sales' THEN im.quantity ELSE 0 END), 0) as total_sales,
    COALESCE(SUM(CASE WHEN im.movement_type = 'stock_in' OR im.movement_type = 'transfer_in' THEN im.quantity ELSE 0 END), 0) as total_stock_in,
    COALESCE(SUM(CASE WHEN im.movement_type = 'stock_out' OR im.movement_type = 'transfer_out' THEN im.quantity ELSE 0 END), 0) as total_stock_out,
    COUNT(DISTINCT CASE WHEN im.movement_type = 'sales' THEN im.id END) as total_sales_transactions,
    COUNT(DISTINCT CASE WHEN im.movement_type IN ('stock_in', 'transfer_in') THEN im.id END) as total_stock_in_transactions,
    COUNT(DISTINCT CASE WHEN im.movement_type IN ('stock_out', 'transfer_out') THEN im.id END) as total_stock_out_transactions
FROM shops s
LEFT JOIN inventory_movements im ON s.id = im.shop_id
GROUP BY s.id, s.name, s.code;
