-- Monthly Generation Reset Cron Job
-- Resets monthly_generation_used for all users at the beginning of each month

-- Enable pg_cron extension if not already enabled
-- Note: This needs to be enabled in Supabase Dashboard for production
-- Settings -> Database -> Extensions -> pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres (required for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the monthly reset function
CREATE OR REPLACE FUNCTION reset_monthly_generations()
RETURNS void AS $$
BEGIN
  UPDATE entitlements
  SET
    monthly_generation_used = 0,
    current_period_start = DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC'),
    current_period_end = DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month',
    updated_at = NOW()
  WHERE plan_type IN ('free', 'plus');

  -- Log the reset for auditing
  INSERT INTO usage_logs (
    user_id,
    action_type,
    metadata
  )
  SELECT
    user_id,
    'monthly_reset',
    jsonb_build_object(
      'reset_at', NOW(),
      'period_start', DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC'),
      'period_end', DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month'
    )
  FROM entitlements
  WHERE plan_type IN ('free', 'plus');

  RAISE LOG 'Monthly generation reset completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run at 00:00 UTC on the 1st of each month
-- Note: This will fail in local development if pg_cron is not enabled
-- In production, enable pg_cron through Supabase Dashboard
DO $$
BEGIN
  -- Remove existing job if it exists
  PERFORM cron.unschedule('monthly-generation-reset');
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not enabled, skipping cron job setup';
  WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
END;
$$;

-- Schedule new job
DO $$
BEGIN
  PERFORM cron.schedule(
    'monthly-generation-reset',
    '0 0 1 * *',  -- At 00:00 on day 1 of every month
    'SELECT reset_monthly_generations()'
  );
  RAISE NOTICE 'Monthly reset cron job scheduled successfully';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not enabled. Enable it in Supabase Dashboard -> Settings -> Database -> Extensions';
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to schedule cron job: %', SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION reset_monthly_generations() IS
  'Resets monthly_generation_used to 0 for all users at the beginning of each billing period';
