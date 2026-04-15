-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_user_id, referee_user_id)
);

-- Indexes
CREATE INDEX idx_referrals_referrer ON referrals (referrer_user_id);
CREATE INDEX idx_referrals_referee ON referrals (referee_user_id);
CREATE INDEX idx_referrals_status ON referrals (status);
