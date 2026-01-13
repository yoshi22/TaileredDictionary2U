import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Mock Stripe - must be defined before vi.mock
const mockPortalCreate = vi.fn()

vi.mock('@/lib/billing/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: (...args: unknown[]) => mockPortalCreate(...args),
      },
    },
  },
}))

// Mock data
let mockUser = createMockUser()

// Mock getAuthUser
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getAuthUser: () => Promise.resolve(mockUser),
  }
})

// Mock entitlements
const mockGetEntitlement = vi.fn()

vi.mock('@/lib/billing/entitlements', () => ({
  getEntitlement: (...args: unknown[]) => mockGetEntitlement(...args),
}))

describe('POST /api/billing/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockGetEntitlement.mockResolvedValue({ stripe_customer_id: 'cus_existing' })
    mockPortalCreate.mockResolvedValue({
      id: 'bps_test_123',
      url: 'https://billing.stripe.com/test',
    })
  })

  it('should create portal session for existing customer', async () => {
    const request = createMockRequest('/api/billing/portal', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.portal_url).toBeDefined()

    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing',
      })
    )
  })

  it('should reject if no Stripe customer exists', async () => {
    mockGetEntitlement.mockResolvedValue({ stripe_customer_id: null })

    const request = createMockRequest('/api/billing/portal', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject if entitlement not found', async () => {
    mockGetEntitlement.mockResolvedValue(null)

    const request = createMockRequest('/api/billing/portal', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should handle Stripe API errors', async () => {
    mockPortalCreate.mockRejectedValue(new Error('Stripe API error'))

    const request = createMockRequest('/api/billing/portal', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('should set correct return URL', async () => {
    const request = createMockRequest('/api/billing/portal', {
      method: 'POST',
    })

    await POST(request)

    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: expect.stringContaining('/settings'),
      })
    )
  })
})
