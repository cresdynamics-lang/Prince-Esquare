-- Customer account status + contact fields for admin directory
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
