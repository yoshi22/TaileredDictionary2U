-- ==============================================
-- Migration: Create profiles table
-- Description: User profiles linked to auth.users
-- ==============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_profiles_email ON profiles(email);

-- Comment
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth';
