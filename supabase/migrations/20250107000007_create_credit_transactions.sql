-- ==============================================
-- Migration: Create credit_transactions table
-- Description: Credit purchase and consumption history
-- ==============================================

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'consume', 'refund', 'bonus')),
  amount INT NOT NULL,           -- Positive: add, Negative: consume
  balance_after INT NOT NULL,    -- Balance after transaction

  description TEXT,
  reference_id TEXT,             -- Stripe Payment Intent ID, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Comment
COMMENT ON TABLE credit_transactions IS 'Credit transaction history for audit trail';
