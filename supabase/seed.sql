-- ==============================================
-- Seed Data for Development
-- ==============================================
-- Note: This seed file is for local development only.
-- Run with: supabase db seed

-- Seed data will be added after authentication is set up
-- and test users are created through the auth flow.

-- Example seed format (uncomment and modify after setup):
/*
-- Create test entries for a specific user
INSERT INTO entries (user_id, deck_id, term, context)
SELECT
  p.id,
  d.id,
  'Example Term',
  'Example context for the term'
FROM profiles p
JOIN decks d ON p.id = d.user_id
WHERE p.email = 'test@example.com'
AND d.name = 'Default'
LIMIT 1;
*/
