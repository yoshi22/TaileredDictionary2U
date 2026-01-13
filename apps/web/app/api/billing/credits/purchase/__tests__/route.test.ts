import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockEntitlement: {
  user_id: string
  plan_type: string
  stripe_customer_id: string | null
} | null = null
let mockStripeSession: { url: string; id: string } | null = null

// Mock getAuthUser
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getAuthUser: vi.fn(() => Promise.resolve(mockUser)),
  }
})

// Mock entitlements
vi.mock('@/lib/billing/entitlements', () => ({
  getEntitlement: vi.fn(() => Promise.resolve(mockEntitlement)),
  updateStripeCustomerId: vi.fn(() => Promise.resolve()),
}))

// Mock Stripe
vi.mock('@/lib/billing/stripe', () => ({
  stripe: {
    customers: {
      create: vi.fn(() =>
        Promise.resolve({ id: 'cus_new_123' })
      ),
    },
    checkout: {
      sessions: {
        create: vi.fn(() =>
          Promise.resolve(mockStripeSession)
        ),
      },
    },
  },
  STRIPE_PRICES: {
    CREDIT_50: 'price_credit_50',
    CREDIT_100: 'price_credit_100',
    CREDIT_250: 'price_credit_250',
    PLUS_MONTHLY: 'price_plus_monthly',
  },
  getCreditAmountFromPriceId: vi.fn((priceId: string) => {
    const map: Record<string, number> = {
      'price_credit_50': 50,
      'price_credit_100': 100,
      'price_credit_250': 250,
    }
    return map[priceId] ?? null
  }),
}))

describe('POST /api/billing/credits/purchase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockEntitlement = {
      user_id: 'user-123',
      plan_type: 'plus',
      stripe_customer_id: 'cus_123',
    }
    mockStripeSession = {
      url: 'https://checkout.stripe.com/session-123',
      id: 'session-123',
    }
  })

  it('should create checkout session for valid credit purchase', async () => {
    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '100',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.checkout_url).toBe('https://checkout.stripe.com/session-123')
    expect(json.data.credit_amount).toBe(100)
  })

  it('should accept 50 credits', async () => {
    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '50',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should accept 250 credits', async () => {
    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '250',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should reject invalid credit amount', async () => {
    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '999',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject free plan users', async () => {
    mockEntitlement = {
      user_id: 'user-123',
      plan_type: 'free',
      stripe_customer_id: null,
    }

    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '100',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject users without entitlement', async () => {
    mockEntitlement = null

    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '100',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('should create Stripe customer if not exists', async () => {
    mockEntitlement = {
      user_id: 'user-123',
      plan_type: 'plus',
      stripe_customer_id: null, // No existing customer
    }

    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {
        credits: '100',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // Verify Stripe customer creation was called
    const stripe = await import('@/lib/billing/stripe')
    expect(stripe.stripe.customers.create).toHaveBeenCalled()
  })

  it('should reject missing credits field', async () => {
    const request = createMockRequest('/api/billing/credits/purchase', {
      method: 'POST',
      body: {},
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
