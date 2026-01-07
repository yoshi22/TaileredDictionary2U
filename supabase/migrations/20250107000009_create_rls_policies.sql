-- ==============================================
-- Migration: Create RLS policies
-- Description: Row Level Security for all tables
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ==================
-- Profiles policies
-- ==================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==================
-- Entitlements policies
-- ==================
CREATE POLICY "Users can view own entitlements"
  ON entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Note: entitlements INSERT/UPDATE is server-side only (service role)

-- ==================
-- Decks policies
-- ==================
CREATE POLICY "Users can view own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- ==================
-- Entries policies
-- ==================
CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- ==================
-- SRS Data policies
-- ==================
CREATE POLICY "Users can view own srs_data"
  ON srs_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = srs_data.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own srs_data"
  ON srs_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = srs_data.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- ==================
-- Usage Logs policies
-- ==================
CREATE POLICY "Users can view own usage_logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Note: usage_logs INSERT is server-side only (service role)

-- ==================
-- Credit Transactions policies
-- ==================
CREATE POLICY "Users can view own credit_transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Note: credit_transactions INSERT is server-side only (service role)
