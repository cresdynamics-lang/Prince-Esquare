-- Migration 009: Standalone inventory items (not tied to product catalog)
-- These are fixed item types tracked across shops

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the 24 fixed item types
INSERT INTO inventory_items (name) VALUES
  ('Shirts'), ('Khakis'), ('Knitted Pollos'), ('Polos'),
  ('Office Shoes'), ('Casual Shoes'), ('Loafers'), ('Linen Trousers'),
  ('Blazers'), ('Suits'), ('Track Suits'), ('Vests'), ('Capes'),
  ('Hats'), ('Ties'), ('Belts'), ('Jackets'), ('Half-Jackets'),
  ('Sweat Shirts'), ('Socks'), ('Sweaters'), ('Jeans'), ('T-Shirts'),
  ('Gurkha Pants')
ON CONFLICT (name) DO NOTHING;

-- Stock movements table using item_id (references inventory_items, not products)
CREATE TABLE IF NOT EXISTS shop_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('opening_stock','sales','stock_in','stock_out','transfer_out','transfer_in')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    closing_stock INTEGER NOT NULL DEFAULT 0,
    reference_type VARCHAR(50),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock transfers table
CREATE TABLE IF NOT EXISTS shop_stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    to_shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop_stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES shop_stock_transfers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Trigger: auto-calculate closing_stock before insert
CREATE OR REPLACE FUNCTION calc_shop_closing_stock()
RETURNS TRIGGER AS $$
DECLARE
    prev INTEGER;
BEGIN
    SELECT closing_stock INTO prev
    FROM shop_stock_movements
    WHERE item_id = NEW.item_id AND shop_id = NEW.shop_id
    ORDER BY created_at DESC LIMIT 1;

    prev := COALESCE(prev, 0);

    IF NEW.movement_type IN ('opening_stock','stock_in','transfer_in') THEN
        NEW.closing_stock := prev + NEW.quantity;
    ELSE
        NEW.closing_stock := prev - NEW.quantity;
    END IF;

    IF NEW.closing_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Cannot go below zero.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_shop_closing_stock ON shop_stock_movements;
CREATE TRIGGER trg_calc_shop_closing_stock
BEFORE INSERT ON shop_stock_movements
FOR EACH ROW EXECUTE FUNCTION calc_shop_closing_stock();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ssm_item ON shop_stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_ssm_shop ON shop_stock_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_ssm_item_shop ON shop_stock_movements(item_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_ssm_date ON shop_stock_movements(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ssm_type ON shop_stock_movements(movement_type);
