CREATE TABLE IF NOT EXISTS restock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  search_query VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (email, search_query)
);

CREATE INDEX IF NOT EXISTS idx_restock_alerts_email ON restock_alerts(email);
CREATE INDEX IF NOT EXISTS idx_restock_alerts_query ON restock_alerts(search_query);
