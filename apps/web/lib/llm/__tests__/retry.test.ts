import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry } from '../retry'
import { LLMError } from '../types'

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await withRetry(fn, { maxRetries: 0 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable error and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMError('Rate limit', '429', true))
      .mockResolvedValueOnce('success')

    const result = await withRetry(fn, { maxRetries: 3, initialDelay: 1 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should retry maximum number of times and then throw', async () => {
    const error = new LLMError('Service unavailable', '503', true)
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 1 })
    ).rejects.toThrow('Service unavailable')

    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should not retry on non-retryable LLMError', async () => {
    const error = new LLMError('Invalid API key', 'AUTH_ERROR', false)
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelay: 1 })
    ).rejects.toThrow('Invalid API key')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on generic errors (not LLMError)', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success')

    const result = await withRetry(fn, { maxRetries: 2, initialDelay: 1 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should use default options when not provided', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await withRetry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should properly chain multiple retries before success', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce('success')

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelay: 1,
      backoffMultiplier: 2,
    })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should throw the last error after exhausting retries', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockRejectedValueOnce(new Error('Final Error'))

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 1 })
    ).rejects.toThrow('Final Error')

    expect(fn).toHaveBeenCalledTimes(3)
  })
})
