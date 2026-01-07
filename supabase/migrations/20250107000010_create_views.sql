-- ==============================================
-- Migration: Create views
-- Description: Convenience views for common queries
-- ==============================================

-- View: Entries with SRS data
CREATE VIEW v_entries_with_srs AS
SELECT
  e.id,
  e.user_id,
  e.deck_id,
  e.term,
  e.context,
  e.enrichment,
  e.created_at,
  e.updated_at,
  s.ease_factor,
  s.interval_days,
  s.repetitions,
  s.due_date,
  s.last_reviewed_at,
  d.name AS deck_name
FROM entries e
JOIN srs_data s ON e.id = s.entry_id
LEFT JOIN decks d ON e.deck_id = d.id;

-- View: Due entries (for review)
CREATE VIEW v_due_entries AS
SELECT *
FROM v_entries_with_srs
WHERE due_date <= NOW()
ORDER BY due_date ASC;

-- View: User statistics
CREATE VIEW v_user_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT e.id) AS total_entries,
  COUNT(DISTINCT CASE WHEN s.due_date <= NOW() THEN e.id END) AS due_entries,
  COUNT(DISTINCT d.id) AS total_decks,
  ent.plan_type,
  ent.monthly_generation_used,
  ent.monthly_generation_limit,
  ent.credit_balance
FROM profiles p
LEFT JOIN entries e ON p.id = e.user_id
LEFT JOIN srs_data s ON e.id = s.entry_id
LEFT JOIN decks d ON p.id = d.user_id
LEFT JOIN entitlements ent ON p.id = ent.user_id
GROUP BY p.id, ent.plan_type, ent.monthly_generation_used, ent.monthly_generation_limit, ent.credit_balance;

-- Comment
COMMENT ON VIEW v_entries_with_srs IS 'Entries joined with SRS data and deck name';
COMMENT ON VIEW v_due_entries IS 'Entries due for review';
COMMENT ON VIEW v_user_stats IS 'User statistics including entry counts and entitlement info';
