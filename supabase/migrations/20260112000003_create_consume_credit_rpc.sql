-- Create consume_credit_atomic function for atomic credit consumption
-- This prevents race conditions when multiple requests try to consume credits simultaneously

CREATE OR REPLACE FUNCTION consume_generation_atomic(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  source TEXT,
  remaining_monthly INTEGER,
  remaining_credits INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entitlement RECORD;
  v_source TEXT;
  v_new_monthly_used INTEGER;
  v_new_credit_balance INTEGER;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT *
  INTO v_entitlement
  FROM entitlements
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if entitlement exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      'Entitlement not found'::TEXT;
    RETURN;
  END IF;

  -- Try to use monthly quota first
  IF v_entitlement.monthly_generation_used < v_entitlement.monthly_generation_limit THEN
    v_new_monthly_used := v_entitlement.monthly_generation_used + 1;
    v_source := 'monthly';

    UPDATE entitlements
    SET
      monthly_generation_used = v_new_monthly_used,
      updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      v_source,
      (v_entitlement.monthly_generation_limit - v_new_monthly_used)::INTEGER,
      v_entitlement.credit_balance::INTEGER,
      'Monthly quota consumed'::TEXT;
    RETURN;
  END IF;

  -- Try to use credits (Plus plan only)
  IF v_entitlement.plan_type = 'plus' AND v_entitlement.credit_balance > 0 THEN
    v_new_credit_balance := v_entitlement.credit_balance - 1;
    v_source := 'credit';

    UPDATE entitlements
    SET
      credit_balance = v_new_credit_balance,
      updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record credit consumption transaction
    INSERT INTO credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      balance_after
    ) VALUES (
      p_user_id,
      -1,
      'consumption',
      'AI generation credit consumed',
      v_new_credit_balance
    );

    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      v_source,
      0::INTEGER,
      v_new_credit_balance::INTEGER,
      'Credit consumed'::TEXT;
    RETURN;
  END IF;

  -- No quota or credits available
  RETURN QUERY SELECT
    FALSE::BOOLEAN,
    NULL::TEXT,
    0::INTEGER,
    v_entitlement.credit_balance::INTEGER,
    'No available generation quota or credits'::TEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION consume_generation_atomic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_generation_atomic(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION consume_generation_atomic IS 'Atomically consume one generation from monthly quota or credit balance. Uses row-level locking to prevent race conditions.';
