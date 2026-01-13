/**
 * Abuse Detection Module
 *
 * Detects abnormal usage patterns and reports to Sentry for alerting.
 * Uses Upstash Redis for tracking request counts with sliding windows.
 */

import { Redis } from '@upstash/redis'
import * as Sentry from '@sentry/nextjs'

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

const ABUSE_LOG_PREFIX = '[AbuseDetection]'

/**
 * Abuse pattern types
 */
export type AbusePatternType =
  | 'entry_spike'
  | 'enrichment_spike'
  | 'long_text_abuse'
  | 'csv_import_spike'

/**
 * Abuse detection thresholds
 */
const THRESHOLDS = {
  entry_spike: { limit: 30, window: 600 }, // 30 entries in 10 minutes
  enrichment_spike: { limit: 20, window: 300 }, // 20 enrichments in 5 minutes
  long_text_abuse: { limit: 5, window: 3600 }, // 5 long texts in 1 hour
  csv_import_spike: { limit: 5, window: 3600 }, // 5 imports in 1 hour
} as const

/**
 * Severity levels for abuse patterns
 */
const SEVERITY: Record<AbusePatternType, 'warning' | 'error'> = {
  entry_spike: 'warning',
  enrichment_spike: 'error',
  long_text_abuse: 'warning',
  csv_import_spike: 'error',
}

/**
 * Abuse event data for Sentry
 */
interface AbuseEvent {
  type: AbusePatternType
  userId: string
  count: number
  threshold: number
  windowSeconds: number
  metadata?: Record<string, unknown>
}

/**
 * Report abuse to Sentry
 */
function reportAbuse(event: AbuseEvent): void {
  const severity = SEVERITY[event.type]

  console.warn(`${ABUSE_LOG_PREFIX} Abuse detected:`, {
    type: event.type,
    userId: event.userId,
    count: event.count,
    threshold: event.threshold,
  })

  // Send to Sentry
  Sentry.captureMessage(`Abuse detected: ${event.type}`, {
    level: severity,
    tags: {
      abuse_type: event.type,
      user_id: event.userId,
    },
    extra: {
      count: event.count,
      threshold: event.threshold,
      window_seconds: event.windowSeconds,
      ...event.metadata,
    },
  })
}

/**
 * Increment counter and check for abuse pattern
 * Returns true if abuse is detected
 */
async function checkAndIncrement(
  key: string,
  threshold: number,
  windowSeconds: number
): Promise<{ count: number; isAbuse: boolean }> {
  if (!redis) {
    // Skip abuse detection if Redis is not configured
    return { count: 0, isAbuse: false }
  }

  try {
    // Increment counter with TTL
    const count = await redis.incr(key)

    // Set expiry only on first increment
    if (count === 1) {
      await redis.expire(key, windowSeconds)
    }

    const isAbuse = count > threshold

    return { count, isAbuse }
  } catch (error) {
    console.error(`${ABUSE_LOG_PREFIX} Redis error:`, error)
    // Don't block on Redis errors
    return { count: 0, isAbuse: false }
  }
}

/**
 * Detect abuse pattern for a specific action
 *
 * @param type - The type of abuse pattern to check
 * @param userId - The user ID performing the action
 * @param metadata - Optional additional data for the Sentry event
 * @returns Promise<boolean> - true if abuse is detected
 */
export async function detectAbusePattern(
  type: AbusePatternType,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  if (!redis) {
    // Skip if Redis not configured (development mode)
    return false
  }

  const { limit, window } = THRESHOLDS[type]
  const key = `abuse:${type}:${userId}`

  const { count, isAbuse } = await checkAndIncrement(key, limit, window)

  if (isAbuse) {
    reportAbuse({
      type,
      userId,
      count,
      threshold: limit,
      windowSeconds: window,
      metadata,
    })
  }

  return isAbuse
}

/**
 * Check for entry creation spike
 */
export async function detectEntrySpike(userId: string): Promise<boolean> {
  return detectAbusePattern('entry_spike', userId)
}

/**
 * Check for enrichment generation spike
 */
export async function detectEnrichmentSpike(userId: string): Promise<boolean> {
  return detectAbusePattern('enrichment_spike', userId)
}

/**
 * Check for long text abuse (repeated max-length inputs)
 *
 * @param userId - The user ID
 * @param textLength - The length of the submitted text
 * @param maxLength - The maximum allowed length
 */
export async function detectLongTextAbuse(
  userId: string,
  textLength: number,
  maxLength: number
): Promise<boolean> {
  // Only track if text is 90% or more of max length
  if (textLength < maxLength * 0.9) {
    return false
  }

  return detectAbusePattern('long_text_abuse', userId, {
    textLength,
    maxLength,
    percentOfMax: Math.round((textLength / maxLength) * 100),
  })
}

/**
 * Check for CSV import spike
 */
export async function detectCsvImportSpike(
  userId: string,
  rowCount?: number
): Promise<boolean> {
  return detectAbusePattern('csv_import_spike', userId, { rowCount })
}

/**
 * Get current abuse counter (for debugging/monitoring)
 */
export async function getAbuseCounter(
  type: AbusePatternType,
  userId: string
): Promise<number | null> {
  if (!redis) {
    return null
  }

  try {
    const key = `abuse:${type}:${userId}`
    const count = await redis.get<number>(key)
    return count
  } catch (error) {
    console.error(`${ABUSE_LOG_PREFIX} Failed to get counter:`, error)
    return null
  }
}

/**
 * Reset abuse counter (for admin/testing purposes)
 */
export async function resetAbuseCounter(
  type: AbusePatternType,
  userId: string
): Promise<void> {
  if (!redis) {
    return
  }

  try {
    const key = `abuse:${type}:${userId}`
    await redis.del(key)
  } catch (error) {
    console.error(`${ABUSE_LOG_PREFIX} Failed to reset counter:`, error)
  }
}
