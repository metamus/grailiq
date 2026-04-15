-- Daily Grails table for featured product curation
CREATE TABLE IF NOT EXISTS daily_grails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  featured_date DATE UNIQUE NOT NULL,
  thesis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_daily_grails_featured_date ON daily_grails (featured_date DESC);
CREATE INDEX idx_daily_grails_product_id ON daily_grails (product_id);
