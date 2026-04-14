-- Migration 001: Retailer product mappings
--
-- Adds the retailer_products table used by the real-stock-detection pipeline.
-- Run once against an existing GrailIQ database (init.sql is only for fresh setups).
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS retailer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer retailer NOT NULL,
  url TEXT NOT NULL,
  sku VARCHAR(100),
  last_in_stock BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_price NUMERIC(10, 2),
  last_error TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, retailer, url)
);

CREATE INDEX IF NOT EXISTS idx_retailer_products_product_id ON retailer_products(product_id);
CREATE INDEX IF NOT EXISTS idx_retailer_products_retailer ON retailer_products(retailer);
CREATE INDEX IF NOT EXISTS idx_retailer_products_enabled ON retailer_products(is_enabled) WHERE is_enabled = TRUE;
