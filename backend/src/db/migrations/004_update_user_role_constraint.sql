-- Drop the constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- Add the new constraint including 'staff'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'staff'));
