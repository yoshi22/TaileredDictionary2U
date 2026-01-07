-- ==============================================
-- Migration: Create entitlements table
-- Description: User entitlements (plans, usage limits, credits)
-- ==============================================

CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan information
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'plus')),

  -- Monthly generation limits
  monthly_generation_limit INT NOT NULL DEFAULT 20,
  monthly_generation_used INT NOT NULL DEFAULT 0,

  -- Credit balance (Plus only)
  credit_balance INT NOT NULL DEFAULT 0,

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX idx_entitlements_stripe_customer ON entitlements(stripe_customer_id);

-- Comment
COMMENT ON TABLE entitlements IS 'User entitlements for plan type, usage limits, and credits';
