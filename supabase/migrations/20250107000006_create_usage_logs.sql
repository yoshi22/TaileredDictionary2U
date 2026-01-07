-- ==============================================
-- Migration: Create usage_logs table
-- Description: User action logs for analytics
-- ==============================================

CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  /*
  action_type values:
  - 'generation': AI enrichment generation
  - 'review': Review session completed
  - 'entry_create': Entry created
  - 'entry_delete': Entry deleted
  - 'deck_create': Deck created
  */
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Comment
COMMENT ON TABLE usage_logs IS 'User action logs for analytics and monitoring';
