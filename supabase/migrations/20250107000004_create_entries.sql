-- ==============================================
-- Migration: Create entries table
-- Description: Vocabulary entries with AI enrichment
-- ==============================================

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  context TEXT,

  -- AI-generated enrichment (JSONB)
  enrichment JSONB,
  /*
  enrichment structure:
  {
    "translation_ja": "Japanese translation",
    "translation_en": "English translation",
    "summary": "3-line summary",
    "examples": ["example 1", "example 2", "example 3"],
    "related_terms": ["term 1", "term 2", "term 3"],
    "reference_links": [
      {"title": "Title", "url": "https://..."}
    ],
    "generated_at": "2025-01-01T00:00:00Z",
    "model": "gpt-4o-mini"
  }
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_deck_id ON entries(deck_id);
CREATE INDEX idx_entries_term ON entries(term);
CREATE INDEX idx_entries_created_at ON entries(created_at DESC);

-- Full-text search index (simple for Japanese support)
CREATE INDEX idx_entries_term_search ON entries USING gin(to_tsvector('simple', term));

-- Comment
COMMENT ON TABLE entries IS 'Vocabulary entries with optional AI-generated enrichment';
