import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Entitlement } from '@td2u/shared-types'

export interface EntitlementCheckResult {
  allowed: boolean
  reason?: string
  entitlement: Entitlement | null
}

const BILLING_LOG_PREFIX = '[Billing]'

function logBilling(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(`${BILLING_LOG_PREFIX} ${message}`, payload)
    return
  }
  console.log(`${BILLING_LOG_PREFIX} ${message}`)
}

function logBillingError(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.error(`${BILLING_LOG_PREFIX} ${message}`, payload)
    return
  }
  console.error(`${BILLING_LOG_PREFIX} ${message}`)
}

/**
 * Check if user has remaining generation quota
 */
export async function checkGenerationEntitlement(
  userId: string
): Promise<EntitlementCheckResult> {
  logBilling('Checking generation entitlement', { userId })
  const supabase = createServiceRoleClient()

  const { data: entitlement, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !entitlement) {
    logBillingError('Entitlement lookup failed or missing', { userId, error })
    return {
      allowed: false,
      reason: 'Entitlement not found',
      entitlement: null,
    }
  }

  const monthlyRemaining =
    entitlement.monthly_generation_limit - entitlement.monthly_generation_used
  const hasCredits = entitlement.plan_type === 'plus' && entitlement.credit_balance > 0

  logBilling('Entitlement state', {
    userId,
    monthlyRemaining,
    creditBalance: entitlement.credit_balance,
    plan: entitlement.plan_type,
    hasCredits,
  })

  // Check monthly quota
  if (entitlement.monthly_generation_used < entitlement.monthly_generation_limit) {
    logBilling('Monthly quota available', { userId })
    return {
      allowed: true,
      entitlement,
    }
  }

  // Check credits (Plus plan only)
  if (entitlement.plan_type === 'plus' && entitlement.credit_balance > 0) {
    logBilling('Using credit balance', {
      userId,
      credit_balance: entitlement.credit_balance,
    })
    return {
      allowed: true,
      entitlement,
    }
  }

  logBilling('Generation limit exceeded', { userId })
  return {
    allowed: false,
    reason: 'Generation limit exceeded',
    entitlement,
  }
}

/**
 * Result from atomic generation consumption
 */
interface ConsumeGenerationResult {
  success: boolean
  source: 'monthly' | 'credit' | null
  remaining_monthly: number | null
  remaining_credits: number | null
  message: string
}

/**
 * Consume one generation from user's entitlement (atomic operation)
 * Uses RPC function with row-level locking to prevent race conditions
 * Monthly quota is used first, then credits (Plus plan only)
 */
export async function consumeGeneration(userId: string): Promise<void> {
  logBilling('Consuming generation quota (atomic)', { userId })
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .rpc('consume_generation_atomic', { p_user_id: userId })
    .single<ConsumeGenerationResult>()

  if (error) {
    logBillingError('RPC consume_generation_atomic failed', { userId, error })
    throw new Error('Failed to consume generation: ' + error.message)
  }

  if (!data || !data.success) {
    const message = data?.message || 'Unknown error'
    logBillingError('Generation consumption denied', { userId, message })
    throw new Error(message)
  }

  logBilling('Generation consumed successfully', {
    userId,
    source: data.source,
    remaining_monthly: data.remaining_monthly,
    remaining_credits: data.remaining_credits,
  })
}

/**
 * Consume one generation (legacy non-atomic version)
 * Kept for backwards compatibility - prefer consumeGeneration() instead
 * @deprecated Use consumeGeneration() which uses atomic RPC
 */
export async function consumeGenerationLegacy(userId: string): Promise<void> {
  logBilling('Consuming generation quota (legacy)', { userId })
  const supabase = createServiceRoleClient()

  const { data: entitlement, error: fetchError } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError || !entitlement) {
    logBillingError('Failed to fetch entitlement during consumption', {
      userId,
      error: fetchError,
    })
    throw new Error('Failed to fetch entitlement')
  }

  // Use monthly quota first
  if (entitlement.monthly_generation_used < entitlement.monthly_generation_limit) {
    const nextUsage = entitlement.monthly_generation_used + 1
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({
        monthly_generation_used: nextUsage,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      logBillingError('Failed to update monthly generation usage', {
        userId,
        error: updateError,
      })
      throw new Error('Failed to update generation usage')
    }
    logBilling('Monthly generation usage updated', {
      userId,
      monthly_generation_used: nextUsage,
    })
    return
  }

  // Use credits (Plus plan)
  if (entitlement.plan_type === 'plus' && entitlement.credit_balance > 0) {
    const nextBalance = entitlement.credit_balance - 1
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({
        credit_balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      logBillingError('Failed to decrement credit balance', {
        userId,
        error: updateError,
      })
      throw new Error('Failed to consume credit')
    }
    logBilling('Credit balance decremented', {
      userId,
      credit_balance: nextBalance,
    })
    return
  }

  logBillingError('No available generation quota or credits', { userId })
  throw new Error('No available generation quota or credits')
}

/**
 * Get user's entitlement record
 */
export async function getEntitlement(userId: string): Promise<Entitlement | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    logBillingError('Failed to get entitlement', { userId, error })
    return null
  }

  return data as Entitlement
}

/**
 * Activate Plus plan for a user
 * Called when subscription is successfully created via Stripe webhook
 */
export async function activatePlusPlan(
  userId: string,
  stripeCustomerId: string,
  subscriptionId: string
): Promise<void> {
  logBilling('Activating Plus plan', { userId, stripeCustomerId, subscriptionId })
  const supabase = createServiceRoleClient()

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const { error } = await supabase
    .from('entitlements')
    .update({
      plan_type: 'plus',
      monthly_generation_limit: 200,
      monthly_generation_used: 0,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    logBillingError('Failed to activate Plus plan', { userId, error })
    throw new Error('Failed to activate Plus plan')
  }

  logBilling('Plus plan activated successfully', { userId })
}

/**
 * Deactivate Plus plan (downgrade to Free)
 * Called when subscription is cancelled or payment fails
 */
export async function deactivatePlusPlan(userId: string): Promise<void> {
  logBilling('Deactivating Plus plan', { userId })
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('entitlements')
    .update({
      plan_type: 'free',
      monthly_generation_limit: 20,
      // Keep credit_balance - don't remove purchased credits
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    logBillingError('Failed to deactivate Plus plan', { userId, error })
    throw new Error('Failed to deactivate Plus plan')
  }

  logBilling('Plus plan deactivated, downgraded to Free', { userId })
}

/**
 * Add credits to user's balance
 * Records the transaction in credit_transactions table
 */
export async function addCredits(
  userId: string,
  amount: number,
  transactionType: 'purchase' | 'bonus' | 'refund' = 'purchase',
  description?: string
): Promise<void> {
  logBilling('Adding credits', { userId, amount, transactionType })
  const supabase = createServiceRoleClient()

  // Get current entitlement
  const { data: entitlement, error: fetchError } = await supabase
    .from('entitlements')
    .select('credit_balance')
    .eq('user_id', userId)
    .single()

  if (fetchError || !entitlement) {
    logBillingError('Failed to fetch entitlement for credit addition', { userId, error: fetchError })
    throw new Error('Failed to fetch entitlement')
  }

  const newBalance = entitlement.credit_balance + amount

  // Update credit balance
  const { error: updateError } = await supabase
    .from('entitlements')
    .update({
      credit_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    logBillingError('Failed to update credit balance', { userId, error: updateError })
    throw new Error('Failed to update credit balance')
  }

  // Record transaction
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      transaction_type: transactionType,
      description: description || `Credit ${transactionType}: ${amount} credits`,
      balance_after: newBalance,
    })

  if (txError) {
    logBillingError('Failed to record credit transaction', { userId, error: txError })
    // Don't throw - credit was added, just logging failed
  }

  logBilling('Credits added successfully', { userId, amount, newBalance })
}

/**
 * Update Stripe customer ID for a user
 */
export async function updateStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  logBilling('Updating Stripe customer ID', { userId, stripeCustomerId })
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('entitlements')
    .update({
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    logBillingError('Failed to update Stripe customer ID', { userId, error })
    throw new Error('Failed to update Stripe customer ID')
  }

  logBilling('Stripe customer ID updated', { userId })
}
