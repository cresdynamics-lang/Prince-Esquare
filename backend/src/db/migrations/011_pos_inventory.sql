-- Migration 011: POS & Inventory tables (pos_* prefix)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE "PosRole" AS ENUM ('ADMIN', 'SELLER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PosMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'SALE_POS', 'SALE_ONLINE', 'VOID', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PosChannel" AS ENUM ('POS', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PosPaymentMethod" AS ENUM ('CASH', 'MPESA', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS pos_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role "PosRole" NOT NULL DEFAULT 'SELLER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  shop_price DECIMAL(10, 2) NOT NULL,
  online_price DECIMAL(10, 2),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES pos_products(id) ON DELETE CASCADE,
  size VARCHAR(50),
  color VARCHAR(50),
  sku_variant VARCHAR(100) UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES pos_products(id) ON DELETE CASCADE,
  current_qty INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES pos_products(id),
  variant_id UUID REFERENCES pos_product_variants(id) ON DELETE SET NULL,
  movement_type "PosMovementType" NOT NULL,
  qty INT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES pos_profiles(id),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_daily_stock_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES pos_products(id),
  date DATE NOT NULL,
  opening_qty INT NOT NULL DEFAULT 0,
  stock_in_qty INT NOT NULL DEFAULT 0,
  stock_out_qty INT NOT NULL DEFAULT 0,
  sales_qty INT NOT NULL DEFAULT 0,
  closing_qty INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, date)
);

CREATE TABLE IF NOT EXISTS pos_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES pos_profiles(id),
  clock_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clock_out TIMESTAMP,
  total_cash DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_mpesa DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  shift_id UUID REFERENCES pos_shifts(id),
  seller_id UUID REFERENCES pos_profiles(id),
  channel "PosChannel" NOT NULL,
  payment_method "PosPaymentMethod" NOT NULL,
  mpesa_ref VARCHAR(50),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  is_voided BOOLEAN NOT NULL DEFAULT FALSE,
  void_reason TEXT,
  voided_by UUID REFERENCES pos_profiles(id),
  voided_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pos_products(id),
  variant_id UUID REFERENCES pos_product_variants(id) ON DELETE SET NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pos_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id UUID,
  performed_by UUID REFERENCES pos_profiles(id),
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value) VALUES
  ('pos_sellers_can_discount', 'false'),
  ('pos_low_stock_threshold', '5')
ON CONFLICT (key) DO NOTHING;
