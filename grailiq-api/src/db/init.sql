-- GrailIQ Database Initialization Script
-- This script creates all tables, enums, and TimescaleDB configuration
-- Run this against a fresh Supabase database to initialize the schema

-- ──────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────

CREATE TYPE product_type AS ENUM (
  'booster_box',
  'etb',
  'booster_pack',
  'collection_box',
  'blister_pack',
  'tin',
  'premium_collection',
  'other'
);

CREATE TYPE price_source AS ENUM ('tcgplayer', 'ebay');

CREATE TYPE subscription_tier AS ENUM ('free', 'collector', 'investor');

CREATE TYPE portfolio_source AS ENUM (
  'pokemon_center',
  'amazon',
  'target',
  'walmart',
  'best_buy',
  'lgs',
  'ebay',
  'other'
);

CREATE TYPE retailer AS ENUM (
  'pokemon_center',
  'amazon',
  'target',
  'walmart',
  'best_buy',
  'all'
);

CREATE TYPE investment_signal AS ENUM (
  'buy',
  'hold',
  'watch',
  'avoid'
);

-- ──────────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────────

-- Pokemon TCG expansion sets
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  series VARCHAR(100) NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE,
  total_cards INTEGER,
  is_out_of_print BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sealed products (booster boxes, ETBs, etc.)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type product_type NOT NULL,
  msrp NUMERIC(10, 2),
  image_url TEXT,
  tcgplayer_id VARCHAR(50),
  ebay_search_term VARCHAR(255),
  grailiq_score NUMERIC(3, 1),
  investment_signal investment_signal,
  signal_rationale TEXT,
  score_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Price history — TimescaleDB hypertable on recorded_at
CREATE TABLE price_history (
  id BIGSERIAL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source price_source NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  market_price NUMERIC(10, 2),
  low_price NUMERIC(10, 2),
  high_price NUMERIC(10, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, recorded_at)
);

-- Registered users (synced from Clerk via webhook)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  preferred_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User portfolio holdings
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_price NUMERIC(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE,
  source portfolio_source,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User restock alert subscriptions
CREATE TABLE alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer retailer NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Retailer-specific product mappings (URL + SKU + last-seen state).
-- Used by the restock worker to do real stock detection and fire
-- notifications only on out-of-stock -> in-stock transitions.
CREATE TABLE retailer_products (
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

-- ──────────────────────────────────────────────
-- TimescaleDB Hypertable Configuration
-- ──────────────────────────────────────────────

SELECT create_hypertable('price_history', 'recorded_at', if_not_exists => TRUE);

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────

-- Price history indexes
CREATE INDEX idx_price_history_product_id ON price_history(product_id, recorded_at DESC);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);
CREATE INDEX idx_price_history_source ON price_history(source, recorded_at DESC);

-- Sets indexes
CREATE INDEX idx_sets_code ON sets(code);
CREATE INDEX idx_sets_series ON sets(series);
CREATE INDEX idx_sets_is_out_of_print ON sets(is_out_of_print);

-- Products indexes
CREATE INDEX idx_products_set_id ON products(set_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_investment_signal ON products(investment_signal);

-- Users indexes
CREATE INDEX idx_users_supabase_id ON users(supabase_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- Portfolio items indexes
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_items_product_id ON portfolio_items(product_id);
CREATE INDEX idx_portfolio_items_user_product ON portfolio_items(user_id, product_id);

-- Alert subscriptions indexes
CREATE INDEX idx_alert_subscriptions_user_id ON alert_subscriptions(user_id);
CREATE INDEX idx_alert_subscriptions_product_id ON alert_subscriptions(product_id);
CREATE INDEX idx_alert_subscriptions_is_active ON alert_subscriptions(is_active);

-- Retailer products indexes
CREATE INDEX idx_retailer_products_product_id ON retailer_products(product_id);
CREATE INDEX idx_retailer_products_retailer ON retailer_products(retailer);
CREATE INDEX idx_retailer_products_enabled ON retailer_products(is_enabled) WHERE is_enabled = TRUE;

-- ──────────────────────────────────────────────
-- Constraints
-- ──────────────────────────────────────────────

ALTER TABLE portfolio_items ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);
ALTER TABLE products ADD CONSTRAINT check_msrp_positive CHECK (msrp > 0);
