import Stripe from 'stripe'

/**
 * Stripe client for server-side API calls
 *
 * Usage:
 * - Checkout session creation
 * - Webhook signature verification
 * - Customer portal session creation
 * - Subscription management
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

/**
 * Stripe Price IDs from environment variables
 * These should be configured in Stripe Dashboard and set in .env.local
 */
export const STRIPE_PRICES = {
  /** Plus Plan monthly subscription - ¥980/month */
  PLUS_MONTHLY: process.env.STRIPE_PLUS_PRICE_ID!,
  /** Credit Pack: 50 credits - ¥500 */
  CREDIT_50: process.env.STRIPE_CREDIT_50_PRICE_ID!,
  /** Credit Pack: 100 credits - ¥980 */
  CREDIT_100: process.env.STRIPE_CREDIT_100_PRICE_ID!,
  /** Credit Pack: 250 credits - ¥2,200 */
  CREDIT_250: process.env.STRIPE_CREDIT_250_PRICE_ID!,
} as const

/**
 * Credit amounts for each credit pack
 */
export const CREDIT_AMOUNTS: Record<string, number> = {
  [STRIPE_PRICES.CREDIT_50]: 50,
  [STRIPE_PRICES.CREDIT_100]: 100,
  [STRIPE_PRICES.CREDIT_250]: 250,
}

/**
 * Get credit amount from Price ID
 */
export function getCreditAmountFromPriceId(priceId: string): number | null {
  return CREDIT_AMOUNTS[priceId] ?? null
}

/**
 * Check if a Price ID is for a credit pack (one-time purchase)
 */
export function isCreditPackPriceId(priceId: string): boolean {
  return priceId === STRIPE_PRICES.CREDIT_50 ||
         priceId === STRIPE_PRICES.CREDIT_100 ||
         priceId === STRIPE_PRICES.CREDIT_250
}

/**
 * Check if a Price ID is for Plus subscription
 */
export function isPlusPlanPriceId(priceId: string): boolean {
  return priceId === STRIPE_PRICES.PLUS_MONTHLY
}
