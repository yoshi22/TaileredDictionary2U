/**
 * プランタイプ
 */
export type PlanType = 'free' | 'plus';

/**
 * ユーザーの権利・使用量情報
 */
export interface Entitlement {
  id: string;
  user_id: string;
  plan_type: PlanType;
  monthly_generation_limit: number;
  monthly_generation_used: number;
  credit_balance: number;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * クレジット取引タイプ
 */
export type CreditTransactionType = 'purchase' | 'consume' | 'refund' | 'bonus';

/**
 * クレジット取引記録
 */
export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: CreditTransactionType;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

/**
 * 使用ログのアクションタイプ
 */
export type UsageActionType =
  | 'generation'
  | 'review'
  | 'entry_create'
  | 'entry_delete'
  | 'deck_create';

/**
 * 使用ログ
 */
export interface UsageLog {
  id: string;
  user_id: string;
  action_type: UsageActionType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * 使用量チェック結果
 */
export interface EntitlementCheck {
  allowed: boolean;
  remaining_quota: number;
  credit_balance: number;
  will_use_credit: boolean;
  reason?: 'quota_available' | 'credit_available' | 'quota_exceeded' | 'no_credits';
}
