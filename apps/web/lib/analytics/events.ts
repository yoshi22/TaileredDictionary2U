import { track } from '@vercel/analytics'

/**
 * Analytics event tracking utilities
 *
 * Uses Vercel Analytics for tracking user events.
 * Events are automatically sent to Vercel when deployed.
 * In development, events are logged to console.
 */

export const trackEvent = {
  // Auth events
  userSignedUp: (method: 'email' | 'google') => {
    track('user_signed_up', { method })
  },

  userLoggedIn: (method: 'email' | 'google') => {
    track('user_logged_in', { method })
  },

  userLoggedOut: () => {
    track('user_logged_out')
  },

  // Entry events
  entryCreated: (deckId?: string) => {
    track('entry_created', { deck_id: deckId || 'default' })
  },

  entryUpdated: (entryId: string) => {
    track('entry_updated', { entry_id: entryId })
  },

  entryDeleted: (entryId: string) => {
    track('entry_deleted', { entry_id: entryId })
  },

  // Enrichment events
  enrichmentGenerated: (success: boolean, errorCode?: string) => {
    track('enrichment_generated', {
      success,
      error_code: errorCode || undefined,
    })
  },

  enrichmentRegenerated: (entryId: string) => {
    track('enrichment_regenerated', { entry_id: entryId })
  },

  // Review events
  reviewSessionStarted: (entryCount: number) => {
    track('review_session_started', { entry_count: entryCount })
  },

  reviewAnswered: (rating: number, entryId: string) => {
    track('review_answered', { rating, entry_id: entryId })
  },

  reviewSessionCompleted: (
    entriesReviewed: number,
    durationSeconds: number,
    correctCount: number
  ) => {
    track('review_session_completed', {
      entries_reviewed: entriesReviewed,
      duration_seconds: durationSeconds,
      correct_count: correctCount,
      accuracy: entriesReviewed > 0 ? correctCount / entriesReviewed : 0,
    })
  },

  // Deck events
  deckCreated: (deckId: string) => {
    track('deck_created', { deck_id: deckId })
  },

  deckDeleted: (deckId: string) => {
    track('deck_deleted', { deck_id: deckId })
  },

  // Billing events
  checkoutStarted: (plan: 'plus' | 'credits', priceId: string) => {
    track('checkout_started', { plan, price_id: priceId })
  },

  checkoutCompleted: (plan: 'plus' | 'credits') => {
    track('checkout_completed', { plan })
  },

  checkoutCanceled: (plan: 'plus' | 'credits') => {
    track('checkout_canceled', { plan })
  },

  subscriptionActivated: () => {
    track('subscription_activated')
  },

  subscriptionCanceled: () => {
    track('subscription_canceled')
  },

  creditsPurchased: (amount: number) => {
    track('credits_purchased', { amount })
  },

  // Page events (optional, Vercel Analytics tracks page views automatically)
  pricingPageViewed: () => {
    track('pricing_page_viewed')
  },

  // Error events
  errorOccurred: (errorCode: string, errorMessage?: string) => {
    track('error_occurred', {
      error_code: errorCode,
      error_message: errorMessage?.slice(0, 100),
    })
  },
}

/**
 * Server-side event tracking
 * Note: Vercel Analytics track() is client-side only.
 * For server-side events, we log them for now.
 * Consider using a server-side analytics service for production.
 */
export function logServerEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, properties)
  }
  // In production, you might want to send to a server-side analytics service
  // e.g., Mixpanel server-side, Segment, or custom logging
}
