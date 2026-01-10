-- ==============================================
-- Migration: Fix missing srs_data records
-- Description: Create srs_data for entries that don't have it
-- ==============================================

-- Insert srs_data for entries that don't have one
INSERT INTO srs_data (entry_id, due_date)
SELECT e.id, NOW()
FROM entries e
LEFT JOIN srs_data s ON e.id = s.entry_id
WHERE s.id IS NULL;
