-- Migration 003: Score history
-- Rolling daily snapshot for week-over-week movers. Idempotent.

CREATE TABLE IF NOT EXISTS score_history (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score NUMERIC(3, 1) NOT NULL,
  signal investment_signal,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_score_history_product_recorded
  ON score_history(product_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_recorded
  ON score_history(recorded_at DESC);
