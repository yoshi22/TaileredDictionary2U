import { createClient } from '@/lib/supabase/server'
import type { Entitlement } from '@td2u/shared-types'

export interface EntitlementCheckResult {
  allowed: boolean
  reason?: string
  entitlement: Entitlement | null
}

/**
 * Check if user has remaining generation quota
 */
export async function checkGenerationEntitlement(
  userId: string
): Promise<EntitlementCheckResult> {
  const supabase = await createClient()

  const { data: entitlement, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !entitlement) {
    return {
      allowed: false,
      reason: 'Entitlement not found',
      entitlement: null,
    }
  }

  // Check monthly quota
  if (entitlement.monthly_generation_used < entitlement.monthly_generation_limit) {
    return {
      allowed: true,
      entitlement,
    }
  }

  // Check credits (Plus plan only)
  if (entitlement.plan_type === 'plus' && entitlement.credit_balance > 0) {
    return {
      allowed: true,
      entitlement,
    }
  }

  return {
    allowed: false,
    reason: 'Generation limit exceeded',
    entitlement,
  }
}

/**
 * Consume one generation from user's entitlement
 * Uses monthly quota first, then credits
 */
export async function consumeGeneration(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: entitlement, error: fetchError } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError || !entitlement) {
    throw new Error('Failed to fetch entitlement')
  }

  // Use monthly quota first
  if (entitlement.monthly_generation_used < entitlement.monthly_generation_limit) {
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({
        monthly_generation_used: entitlement.monthly_generation_used + 1,
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Failed to update generation usage')
    }
    return
  }

  // Use credits (Plus plan)
  if (entitlement.plan_type === 'plus' && entitlement.credit_balance > 0) {
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({ credit_balance: entitlement.credit_balance - 1 })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Failed to consume credit')
    }
    return
  }

  throw new Error('No available generation quota or credits')
}
