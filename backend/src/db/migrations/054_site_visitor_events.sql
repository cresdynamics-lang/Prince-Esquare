-- Live visitor & traffic analytics for admin dashboard
CREATE TABLE IF NOT EXISTS site_visitor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('page_view', 'product_click', 'product_add_cart')),
    path VARCHAR(512),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_slug VARCHAR(255),
    product_name TEXT,
    product_price DECIMAL(12, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_visitor_events_created
    ON site_visitor_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_visitor_events_session
    ON site_visitor_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_visitor_events_type_created
    ON site_visitor_events (event_type, created_at DESC);
