-- Prince Esquare Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(255),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo VARCHAR(255),
    description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    thumbnail VARCHAR(255),
    images JSONB DEFAULT '[]',
    ratings_avg DECIMAL(3, 2) DEFAULT 0.0,
    ratings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Size', 'Color'
    value VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0.0,
    stock_quantity INTEGER DEFAULT 0,
    stock_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0.0,
    expiry_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0.0,
    discount_amount DECIMAL(10, 2) DEFAULT 0.0,
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banners Table
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    image VARCHAR(255) NOT NULL,
    link VARCHAR(255),
    position VARCHAR(50) DEFAULT 'home_hero',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('store_name', 'PRINCE ESQUIRE'),
('support_email', 'prince.esquire.staff@gmail.com'),
('phone_number', '0724-494089'),
('store_currency', 'KES')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    
    -- Calculated fields (updated by triggers)
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
            0, -- opening_stock will be recalculated
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

-- ========================================
-- INVENTORY API ENDPOINTS
-- ========================================

-- ENDPOINT: Get all shops
-- GET /api/admin/shops

-- ENDPOINT: Create shop
-- POST /api/admin/shops
-- Body: { name, slug, code, address, phone, email }

-- ENDPOINT: Get inventory for product
-- GET /api/admin/inventory/:productId?shopId=xxx&variantId=xxx

-- ENDPOINT: Set opening stock (once only)
-- POST /api/admin/inventory/opening-stock
-- Body: { productId, shopId, quantity, variantId? }
-- Note: Checks if opening stock already exists for this product/shop

-- ENDPOINT: Record sales
-- POST /api/admin/inventory/sales
-- Body: { productId, shopId, quantity, variantId?, referenceId?, referenceType? }

-- ENDPOINT: Record stock in
-- POST /api/admin/inventory/stock-in
-- Body: { productId, shopId, quantity, variantId?, fromShopId? }

-- ENDPOINT: Record stock out
-- POST /api/admin/inventory/stock-out
-- Body: { productId, shopId, quantity, variantId?, toShopId? }

-- ENDPOINT: Transfer between shops
-- POST /api/admin/inventory/transfer
-- Body: { fromShopId, toShopId, items: [{ productId, variantId?, quantity }] }

-- ENDPOINT: Get daily stock summary
-- GET /api/admin/inventory/summary?date=2024-01-15&shopId=xxx

-- ENDPOINT: Get movement history
-- GET /api/admin/inventory/movements?productId=xxx&shopId=xxx&limit=50

-- ENDPOINT: Close day (move closing to next day opening)
-- POST /api/admin/inventory/close-day?date=2024-01-15

-- Constraints and indexes
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

-- ========================================
-- INVENTORY MODEL (backend/src/models/inventoryModel.js)
-- ========================================

-- const db = require('../config/db');

-- // Get all shops
-- exports.getShops = async () => {
--     const result = await db.query('SELECT * FROM shops ORDER BY name');
--     return result.rows;
-- };

-- // Get shop by ID
-- exports.getShopById = async (id) => {
--     const result = await db.query('SELECT * FROM shops WHERE id = $1', [id]);
--     return result.rows[0];
-- };

-- // Create shop
-- exports.createShop = async (shopData) => {
--     const { name, slug, code, address, phone, email } = shopData;
--     const result = await db.query(
--         'INSERT INTO shops (name, slug, code, address, phone, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
--         [name, slug, code, address || null, phone || null, email || null]
--     );
--     return result.rows[0];
-- };

-- // Update shop
-- exports.updateShop = async (id, shopData) => {
--     const { name, code, address, phone, email, is_active } = shopData;
--     const result = await db.query(
--         'UPDATE shops SET name = $1, code = $2, address = $3, phone = $4, email = $5, is_active = $6 WHERE id = $7 RETURNING *',
--         [name, code, address || null, phone || null, email || null, is_active !== undefined ? is_active : true, id]
--     );
--     return result.rows[0];
-- };

-- // Delete shop
-- exports.deleteShop = async (id) => {
--     await db.query('DELETE FROM shops WHERE id = $1', [id]);
-- };

-- // Check if opening stock exists for product/shop
-- exports.openingStockExists = async (productId, shopId, variantId) => {
--     const result = await db.query(
--         'SELECT COUNT(*) as count FROM inventory_movements WHERE product_id = $1 AND shop_id = $2 AND movement_type = $3 AND (variant_id = $4 OR (variant_id IS NULL AND $4 IS NULL))',
--         [productId, shopId, 'opening_stock', variantId || null]
--     );
--     return parseInt(result.rows[0].count) > 0;
-- };

-- // Set opening stock (once only)
-- exports.setOpeningStock = async (productId, shopId, quantity, variantId, description) => {
--     const result = await db.query(
--         'INSERT INTO inventory_movements (product_id, variant_id, shop_id, movement_type, quantity, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
--         [productId, variantId || null, shopId, 'opening_stock', quantity, description || 'Opening stock setup']
--     );
--     return result.rows[0];
-- };

-- // Record sales
-- exports.recordSales = async (productId, shopId, quantity, variantId, referenceId, referenceType, description) => {
--     const result = await db.query(
--         'INSERT INTO inventory_movements (product_id, variant_id, shop_id, movement_type, quantity, reference_id, reference_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
--         [productId, variantId || null, shopId, 'sales', quantity, referenceId || null, referenceType || null, description || 'Sales transaction']
--     );
--     return result.rows[0];
-- };

-- // Record stock in
-- exports.recordStockIn = async (productId, shopId, quantity, variantId, fromShopId, description) => {
--     const result = await db.query(
--         'INSERT INTO inventory_movements (product_id, variant_id, shop_id, movement_type, quantity, reference_id, reference_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
--         [productId, variantId || null, shopId, fromShopId ? 'transfer_in' : 'stock_in', quantity, fromShopId || null, fromShopId ? 'stock_transfer' : 'supplier', description || 'Stock received']
--     );
--     return result.rows[0];
-- };

-- // Record stock out
-- exports.recordStockOut = async (productId, shopId, quantity, variantId, toShopId, description) => {
--     const result = await db.query(
--         'INSERT INTO inventory_movements (product_id, variant_id, shop_id, movement_type, quantity, reference_id, reference_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
--         [productId, variantId || null, shopId, toShopId ? 'transfer_out' : 'stock_out', quantity, toShopId || null, toShopId ? 'stock_transfer' : 'consumption', description || 'Stock moved']
--     );
--     return result.rows[0];
-- };

-- // Create stock transfer
-- exports.createStockTransfer = async (fromShopId, toShopId, items) => {
--     const client = await db.pool.connect();
--     try {
--         await client.query('BEGIN');
        
--         // Create transfer record
--         const transferResult = await client.query(
--             'INSERT INTO stock_transfers (from_shop_id, to_shop_id, total_quantity, status) VALUES ($1, $2, $3, $4) RETURNING *',
--             [fromShopId, toShopId, items.reduce((sum, item) => sum + item.quantity, 0), 'pending']
--         );
--         const transferId = transferResult.rows[0].id;
        
--         // Add items and record movements
--         for (const item of items) {
--             // Record stock out from source shop
--             await client.query(
--                 'INSERT INTO inventory_movements (product_id, variant_id, shop_id, movement_type, quantity, reference_id, reference_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
--                 [item.productId, item.variantId || null, fromShopId, 'transfer_out', item.quantity, transferId, 'stock_transfer', `Transfer to shop`]
--             );
        
--             // Record stock in to destination shop
--             await client.query(
--                 'INSERT INTO inventory_movements (product_id, variant_id, shop_id, movement_type, quantity, reference_id, reference_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
--                 [item.productId, item.variantId || null, toShopId, 'transfer_in', item.quantity, transferId, 'stock_transfer', `Transfer from shop`]
--             );
        
--             // Add transfer item
--             await client.query(
--                 'INSERT INTO stock_transfer_items (transfer_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
--                 [transferId, item.productId, item.variantId || null, item.quantity]
--             );
--         }
        
--         await client.query('COMMIT');
--         return transferResult.rows[0];
--     } catch (error) {
--         await client.query('ROLLBACK');
--         throw error;
--     } finally {
--         client.release();
--     }
-- };

-- // Get inventory for product
-- exports.getInventory = async (productId, shopId, variantId, limit = 50) => {
--     let query = `
--         SELECT im.*, 
--                v.name as variant_name,
--                v.value as variant_value,
--                u.name as user_name
--         FROM inventory_movements im
--         LEFT JOIN product_variants v ON im.variant_id = v.id
--         LEFT JOIN users u ON im.user_id = u.id
--         WHERE im.product_id = $1 AND im.shop_id = $2
--     `;
--     const params = [productId, shopId];
--     let paramCount = 3;
    
--     if (variantId) {
--         query += ` AND im.variant_id = $${paramCount}`;
--         params.push(variantId);
--         paramCount++;
--     }
    
--     query += ` ORDER BY im.created_at DESC LIMIT $${paramCount}`;
--     params.push(limit);
    
--     const result = await db.query(query, params);
--     return result.rows;
-- };

-- // Get daily stock summary
-- exports.getDailySummary = async (date, shopId) => {
--     let query = `
--         SELECT dss.*, p.name as product_name, p.slug as product_slug, v.name as variant_name, v.value as variant_value, s.name as shop_name
--         FROM daily_stock_summaries dss
--         JOIN products p ON dss.product_id = p.id
--         LEFT JOIN product_variants v ON dss.variant_id = v.id
--         JOIN shops s ON dss.shop_id = s.id
--         WHERE dss.date = $1
--     `;
--     const params = [date];
    
--     if (shopId) {
--         query += ` AND dss.shop_id = $2`;
--         params.push(shopId);
--     }
    
--     query += ` ORDER BY p.name, v.name`;
    
--     const result = await db.query(query, params);
--     return result.rows;
-- };

-- // Get stock transfers
-- exports.getStockTransfers = async (status, limit = 50) => {
--     let query = `
--         SELECT st.*, 
--                from_s.name as from_shop_name,
--                to_s.name as to_shop_name,
--                COUNT(sti.id) as item_count,
--                COALESCE(SUM(sti.quantity), 0) as total_items
--         FROM stock_transfers st
--         JOIN shops from_s ON st.from_shop_id = from_s.id
--         JOIN shops to_s ON st.to_shop_id = to_s.id
--         LEFT JOIN stock_transfer_items sti ON st.id = sti.transfer_id
--     `;
--     const params = [];
    
--     if (status) {
--         query += ` WHERE st.status = $1`;
--         params.push(status);
--     }
    
--     query += ` GROUP BY st.id, from_s.name, to_s.name ORDER BY st.created_at DESC LIMIT $${params.length + 1}`;
--     params.push(limit);
    
--     const result = await db.query(query, params);
--     return result.rows;
-- };

-- // Get current stock view
-- exports.getCurrentStock = async (shopId) => {
--     let query = 'SELECT * FROM v_current_stock WHERE 1=1';
--     const params = [];
    
--     if (shopId) {
--         query += ` AND shop_id = $1`;
--         params.push(shopId);
--     }
    
--     query += ` ORDER BY product_name`;
    
--     const result = await db.query(query, params);
--     return result.rows;
-- };

-- // Close day (generate next day opening stock from current day closing)
-- exports.closeDay = async (date) => {
--     const client = await db.pool.connect();
--     try {
--         await client.query('BEGIN');
        
--         // Get yesterday's closing stock and insert as today's opening stock
--         const result = await client.query(
--             `INSERT INTO daily_stock_summaries (product_id, variant_id, shop_id, date, opening_stock, sales, stock_in, stock_out, closing_stock)
--              SELECT product_id, variant_id, shop_id, $1::date + 1, closing_stock, 0, 0, 0, closing_stock
--              FROM daily_stock_summaries
--              WHERE date = $1
--              ON CONFLICT (product_id, variant_id, shop_id, date) DO NOTHING
--              RETURNING *`,
--             [date]
--         );
        
--         await client.query('COMMIT');
--         return result.rows;
--     } catch (error) {
--         await client.query('ROLLBACK');
--         throw error;
--     } finally {
--         client.release();
--     }
-- };
