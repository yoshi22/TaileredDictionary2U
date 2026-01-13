import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'
import { errors } from './errors'

// Check if Upstash is configured
const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client only if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Rate limiters for different use cases
 */
export const rateLimiters = {
  // General API requests - 100 requests per minute
  api: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        prefix: 'ratelimit:api',
        analytics: true,
      })
    : null,

  // Entry creation - 50 per hour
  entryCreate: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(50, '1 h'),
        prefix: 'ratelimit:entry_create',
        analytics: true,
      })
    : null,

  // AI enrichment - 10 per minute (on top of quota)
  enrichment: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'ratelimit:enrichment',
        analytics: true,
      })
    : null,

  // Deck creation - 20 per hour
  deckCreate: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(20, '1 h'),
        prefix: 'ratelimit:deck_create',
        analytics: true,
      })
    : null,

  // Checkout - 5 per hour
  checkout: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.fixedWindow(5, '1 h'),
        prefix: 'ratelimit:checkout',
        analytics: true,
      })
    : null,

  // Auth attempts - 5 per 15 minutes
  auth: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.fixedWindow(5, '15 m'),
        prefix: 'ratelimit:auth',
        analytics: true,
      })
    : null,

  // CSV import - 3 per hour (bulk operation)
  csvImport: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.fixedWindow(3, '1 h'),
        prefix: 'ratelimit:csv_import',
        analytics: true,
      })
    : null,

  // CSV export - 10 per hour
  csvExport: isUpstashConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'ratelimit:csv_export',
        analytics: true,
      })
    : null,
}

/**
 * Get client identifier (IP or user ID)
 */
export async function getClientIdentifier(userId?: string): Promise<string> {
  if (userId) {
    return `user:${userId}`
  }

  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'
  return `ip:${ip}`
}

/**
 * Check rate limit and throw error if exceeded
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<void> {
  // Skip rate limiting if not configured (development mode)
  if (!limiter) {
    return
  }

  const { success, remaining, reset, limit } = await limiter.limit(identifier)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    throw errors.rateLimitExceeded(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    )
  }

  // Log remaining for debugging
  if (remaining < limit * 0.2) {
    console.warn(`[RateLimit] Low remaining: ${remaining}/${limit} for ${identifier}`)
  }
}

/**
 * Rate limit response headers
 */
export async function getRateLimitHeaders(
  limiter: Ratelimit | null,
  identifier: string
): Promise<Record<string, string>> {
  if (!limiter) {
    return {}
  }

  const { remaining, reset, limit } = await limiter.limit(identifier)

  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining - 1)), // -1 because we just consumed one
    'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
  }
}

/**
 * Wrapper function for rate-limited API handlers
 */
export async function withRateLimit(
  limiterKey: keyof typeof rateLimiters,
  identifier: string
): Promise<void> {
  const limiter = rateLimiters[limiterKey]
  await checkRateLimit(limiter, identifier)
}
