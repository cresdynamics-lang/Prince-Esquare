CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default settings
INSERT INTO settings (key, value) VALUES 
('store_name', 'PRINCE ESQUIRE'),
('support_email', 'prince.esquire.staff@gmail.com'),
('phone_number', '0724-494089'),
('store_currency', 'KES')
ON CONFLICT (key) DO NOTHING;
