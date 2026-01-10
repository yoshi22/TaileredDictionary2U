-- ==============================================
-- Migration: Fix views and grant permissions
-- Description: Grant view access to authenticated users
-- ==============================================

-- Grant access to authenticated users for all views
GRANT SELECT ON v_user_stats TO authenticated;
GRANT SELECT ON v_entries_with_srs TO authenticated;
GRANT SELECT ON v_due_entries TO authenticated;
