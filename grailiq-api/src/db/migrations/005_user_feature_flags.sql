-- Migration 005: per-user feature flags
-- Lets us ship experimental surfaces to specific users without a full flag
-- platform. `feature_flags` is a JSONB blob like:
--   { "new_dashboard": true, "watchlist": true, "ai_summaries": false }
-- Routes read with COALESCE((feature_flags->>'key')::bool, default).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_feature_flags
  ON users USING GIN (feature_flags);
