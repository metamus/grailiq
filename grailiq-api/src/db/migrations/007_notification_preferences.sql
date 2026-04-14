-- Migration 007: notification preferences per user
-- Stored as JSONB to stay flexible. Defaults are applied server-side.
-- Example:
--   {
--     "restock": { "email": true, "push": true },
--     "priceTarget": { "email": true, "push": true },
--     "weeklyDigest": { "email": true },
--     "quietHours": { "enabled": true, "start": "22:00", "end": "07:00", "timezone": "America/Los_Angeles" }
--   }

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
