-- Add thesis column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS thesis TEXT;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_thesis_null ON products (id) WHERE thesis IS NULL;
