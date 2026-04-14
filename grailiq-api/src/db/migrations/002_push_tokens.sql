-- Migration 002: Expo push notification tokens
--
-- One row per physical device per user. Enables server -> client push
-- via Expo's push API for restock alerts.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token VARCHAR(255) NOT NULL,
  platform VARCHAR(16) NOT NULL,
  device_id VARCHAR(100),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_enabled ON push_tokens(is_enabled) WHERE is_enabled = TRUE;
