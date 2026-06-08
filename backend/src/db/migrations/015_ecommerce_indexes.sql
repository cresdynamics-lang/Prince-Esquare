-- Ecommerce query indexes for catalog, orders, cart, search

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
    ON product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id
    ON cart_items (user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_product
    ON cart_items (user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_created
    ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
    ON orders (payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON products (category_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_brand_active
    ON products (brand_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_slug
    ON products (slug);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id
    ON reviews (product_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
    ON wishlist (user_id);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users (role);
