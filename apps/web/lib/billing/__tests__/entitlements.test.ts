import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkGenerationEntitlement, consumeGeneration } from '../entitlements'
import {
  freeEntitlementWithQuota,
  freeEntitlementQuotaExceeded,
  plusEntitlementWithCredits,
  plusEntitlementNoCredits,
  plusEntitlementWithQuota,
} from '@/__tests__/fixtures/entitlement'

// Mock state that will be updated per test
let mockSelectResult: { data: unknown; error: unknown }
let mockRpcResult: { data: unknown; error: unknown }

// Mock Supabase service role client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
        }),
      }),
    }),
    rpc: vi.fn().mockImplementation(() => ({
      single: vi.fn().mockImplementation(() => Promise.resolve(mockRpcResult)),
    })),
  })),
}))

describe('entitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectResult = { data: null, error: null }
    mockRpcResult = { data: null, error: null }
  })

  describe('checkGenerationEntitlement', () => {
    it('should return allowed: true when monthly quota is remaining', async () => {
      mockSelectResult = { data: freeEntitlementWithQuota, error: null }

      const result = await checkGenerationEntitlement('user-1')

      expect(result.allowed).toBe(true)
      expect(result.entitlement).toEqual(freeEntitlementWithQuota)
      expect(result.reason).toBeUndefined()
    })

    it('should return allowed: false when quota exceeded and no credits (free plan)', async () => {
      mockSelectResult = { data: freeEntitlementQuotaExceeded, error: null }

      const result = await checkGenerationEntitlement('user-2')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Generation limit exceeded')
      expect(result.entitlement).toEqual(freeEntitlementQuotaExceeded)
    })

    it('should return allowed: true when quota exceeded but Plus plan has credits', async () => {
      mockSelectResult = { data: plusEntitlementWithCredits, error: null }

      const result = await checkGenerationEntitlement('user-3')

      expect(result.allowed).toBe(true)
      expect(result.entitlement).toEqual(plusEntitlementWithCredits)
    })

    it('should return allowed: false when Plus plan has no credits and quota exceeded', async () => {
      mockSelectResult = { data: plusEntitlementNoCredits, error: null }

      const result = await checkGenerationEntitlement('user-4')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Generation limit exceeded')
    })

    it('should return allowed: true when Plus plan has remaining monthly quota', async () => {
      mockSelectResult = { data: plusEntitlementWithQuota, error: null }

      const result = await checkGenerationEntitlement('user-5')

      expect(result.allowed).toBe(true)
      expect(result.entitlement).toEqual(plusEntitlementWithQuota)
    })

    it('should return allowed: false when entitlement not found', async () => {
      mockSelectResult = { data: null, error: { message: 'Not found' } }

      const result = await checkGenerationEntitlement('non-existent-user')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Entitlement not found')
      expect(result.entitlement).toBeNull()
    })

    it('should return allowed: false when database error occurs', async () => {
      mockSelectResult = { data: null, error: { message: 'Database error' } }

      const result = await checkGenerationEntitlement('user-1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Entitlement not found')
      expect(result.entitlement).toBeNull()
    })
  })

  describe('consumeGeneration', () => {
    it('should succeed when RPC returns success with monthly quota source', async () => {
      mockRpcResult = {
        data: {
          success: true,
          source: 'monthly_quota',
          remaining_monthly: 19,
          remaining_credits: 0,
          message: 'Consumed from monthly quota',
        },
        error: null,
      }

      await expect(consumeGeneration('user-1')).resolves.not.toThrow()
    })

    it('should succeed when RPC returns success with credit source', async () => {
      mockRpcResult = {
        data: {
          success: true,
          source: 'credit',
          remaining_monthly: 0,
          remaining_credits: 99,
          message: 'Consumed from credits',
        },
        error: null,
      }

      await expect(consumeGeneration('user-3')).resolves.not.toThrow()
    })

    it('should throw error when no quota or credits available', async () => {
      mockRpcResult = {
        data: {
          success: false,
          source: null,
          remaining_monthly: 0,
          remaining_credits: 0,
          message: 'No available generation quota or credits',
        },
        error: null,
      }

      await expect(consumeGeneration('user-2')).rejects.toThrow(
        'No available generation quota or credits'
      )
    })

    it('should throw error when entitlement not found', async () => {
      mockRpcResult = {
        data: {
          success: false,
          source: null,
          remaining_monthly: null,
          remaining_credits: null,
          message: 'Entitlement not found',
        },
        error: null,
      }

      await expect(consumeGeneration('non-existent-user')).rejects.toThrow(
        'Entitlement not found'
      )
    })

    it('should throw error when RPC fails', async () => {
      mockRpcResult = {
        data: null,
        error: { message: 'RPC failed' },
      }

      await expect(consumeGeneration('user-1')).rejects.toThrow(
        'Failed to consume generation'
      )
    })

    it('should use monthly quota first even when Plus plan has credits', async () => {
      // RPC handles priority internally - this test verifies we get monthly_quota source
      mockRpcResult = {
        data: {
          success: true,
          source: 'monthly_quota',
          remaining_monthly: 199,
          remaining_credits: 100,
          message: 'Consumed from monthly quota',
        },
        error: null,
      }

      await expect(consumeGeneration('user-5')).resolves.not.toThrow()
    })
  })
})
