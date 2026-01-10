import { LLMError } from './types'

interface RetryOptions {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

/**
 * Execute function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | undefined
  let delay = opts.initialDelay

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry non-retryable errors
      if (error instanceof LLMError && !error.retryable) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break
      }

      // Wait before retrying
      await sleep(delay)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
