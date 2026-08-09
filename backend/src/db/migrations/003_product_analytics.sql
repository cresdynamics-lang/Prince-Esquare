-- Product view / cart-add events for admin dashboard analytics
CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'cart_add')),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_events_type_created
    ON product_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_product
    ON product_events (product_id, created_at DESC);
