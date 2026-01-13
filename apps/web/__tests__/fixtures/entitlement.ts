import type { Entitlement } from '@td2u/shared-types'

/**
 * Free plan entitlement with remaining quota
 */
export const freeEntitlementWithQuota: Entitlement = {
  id: 'ent-1',
  user_id: 'user-1',
  plan_type: 'free',
  monthly_generation_limit: 20,
  monthly_generation_used: 5,
  credit_balance: 0,
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-01-31T23:59:59Z',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Free plan entitlement with quota exceeded
 */
export const freeEntitlementQuotaExceeded: Entitlement = {
  id: 'ent-2',
  user_id: 'user-2',
  plan_type: 'free',
  monthly_generation_limit: 20,
  monthly_generation_used: 20,
  credit_balance: 0,
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-01-31T23:59:59Z',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Plus plan entitlement with credits available
 */
export const plusEntitlementWithCredits: Entitlement = {
  id: 'ent-3',
  user_id: 'user-3',
  plan_type: 'plus',
  monthly_generation_limit: 100,
  monthly_generation_used: 100,
  credit_balance: 50,
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-01-31T23:59:59Z',
  stripe_customer_id: 'cus_123',
  stripe_subscription_id: 'sub_123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Plus plan entitlement with quota exceeded and no credits
 */
export const plusEntitlementNoCredits: Entitlement = {
  id: 'ent-4',
  user_id: 'user-4',
  plan_type: 'plus',
  monthly_generation_limit: 100,
  monthly_generation_used: 100,
  credit_balance: 0,
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-01-31T23:59:59Z',
  stripe_customer_id: 'cus_456',
  stripe_subscription_id: 'sub_456',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Plus plan entitlement with remaining monthly quota
 */
export const plusEntitlementWithQuota: Entitlement = {
  id: 'ent-5',
  user_id: 'user-5',
  plan_type: 'plus',
  monthly_generation_limit: 100,
  monthly_generation_used: 50,
  credit_balance: 20,
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-01-31T23:59:59Z',
  stripe_customer_id: 'cus_789',
  stripe_subscription_id: 'sub_789',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
