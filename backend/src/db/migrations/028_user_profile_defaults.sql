ALTER TABLE users
    ADD COLUMN IF NOT EXISTS default_shipping_address JSONB DEFAULT '{}'::jsonb;
