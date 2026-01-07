-- ==============================================
-- Migration: Create srs_data table
-- Description: SRS (Spaced Repetition System) data for entries
-- ==============================================

CREATE TABLE srs_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,

  -- SM-2 parameters
  ease_factor REAL NOT NULL DEFAULT 2.5,  -- Difficulty factor (1.3-2.5)
  interval_days INT NOT NULL DEFAULT 0,    -- Days until next review
  repetitions INT NOT NULL DEFAULT 0,      -- Consecutive correct answers

  -- Schedule
  due_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Next review date
  last_reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entry_id)
);

-- Indexes
CREATE INDEX idx_srs_data_entry_id ON srs_data(entry_id);
CREATE INDEX idx_srs_data_due_date ON srs_data(due_date);

-- Comment
COMMENT ON TABLE srs_data IS 'SRS scheduling data for spaced repetition learning';
