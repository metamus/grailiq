-- Migration 006: Lightweight analytics events
-- First-party event stream — no third-party analytics needed for week 1.
-- user_id is nullable because we capture some pre-auth events (landing
-- visits, /score views, sign-up attempts that failed).

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  event_name VARCHAR(80) NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  referrer TEXT,
  path TEXT,
  user_agent TEXT,
  ip_hash VARCHAR(64),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_name_time ON analytics_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_time ON analytics_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON analytics_events(occurred_at DESC);
