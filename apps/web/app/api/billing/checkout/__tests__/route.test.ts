import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Mock Stripe - must be defined before vi.mock
const mockCheckoutCreate = vi.fn()
const mockCustomerCreate = vi.fn()

vi.mock('@/lib/billing/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
    customers: {
      create: (...args: unknown[]) => mockCustomerCreate(...args),
    },
  },
  STRIPE_PRICES: {
    PLUS_MONTHLY: 'price_plus_monthly',
    CREDIT_50: 'price_credit_50',
    CREDIT_100: 'price_credit_100',
    CREDIT_250: 'price_credit_250',
  },
  isPlusPlanPriceId: (id: string) => id === 'price_plus_monthly',
  isCreditPackPriceId: (id: string) =>
    ['price_credit_50', 'price_credit_100', 'price_credit_250'].includes(id),
}))

// Mock data
let mockUser = createMockUser()
let mockEntitlement: unknown = { stripe_customer_id: 'cus_existing' }

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
const mockUpdateStripeCustomerId = vi.fn()

vi.mock('@/lib/billing/entitlements', () => ({
  getEntitlement: (...args: unknown[]) => mockGetEntitlement(...args),
  updateStripeCustomerId: (...args: unknown[]) => mockUpdateStripeCustomerId(...args),
}))

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockEntitlement = { stripe_customer_id: 'cus_existing' }
    mockGetEntitlement.mockResolvedValue(mockEntitlement)
    mockUpdateStripeCustomerId.mockResolvedValue(undefined)
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    })
    mockCustomerCreate.mockResolvedValue({
      id: 'cus_test_123',
      email: 'test@example.com',
    })
  })

  it('should create checkout session for Plus subscription', async () => {
    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: { price_id: 'price_plus_monthly' },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.checkout_url).toBeDefined()
    expect(json.data.session_id).toBeDefined()

    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_existing',
      })
    )
  })

  it('should create checkout session for credit pack (payment mode)', async () => {
    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: { price_id: 'price_credit_100' },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
      })
    )
  })

  it('should create Stripe customer if not exists', async () => {
    mockGetEntitlement.mockResolvedValue({ stripe_customer_id: null })

    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: { price_id: 'price_plus_monthly' },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockUser.email,
        metadata: { user_id: mockUser.id },
      })
    )
  })

  it('should reject invalid price_id', async () => {
    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: { price_id: 'invalid_price' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject empty price_id', async () => {
    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: { price_id: '' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject missing price_id', async () => {
    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: {},
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should handle Stripe API errors', async () => {
    mockCheckoutCreate.mockRejectedValue(new Error('Stripe API error'))

    const request = createMockRequest('/api/billing/checkout', {
      method: 'POST',
      body: { price_id: 'price_plus_monthly' },
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
