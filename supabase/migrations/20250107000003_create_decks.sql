-- ==============================================
-- Migration: Create decks table
-- Description: User vocabulary decks
-- ==============================================

CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  entry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_decks_user_id ON decks(user_id);

-- Comment
COMMENT ON TABLE decks IS 'User vocabulary decks for organizing entries';
