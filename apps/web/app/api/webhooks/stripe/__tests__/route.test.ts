import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Stripe - must be defined before vi.mock
const mockConstructEvent = vi.fn()

vi.mock('@/lib/billing/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
  getCreditAmountFromPriceId: (priceId: string) => {
    const amounts: Record<string, number> = {
      price_credit_50: 50,
      price_credit_100: 100,
      price_credit_250: 250,
    }
    return amounts[priceId] || null
  },
  isPlusPlanPriceId: (id: string) => id === 'price_plus_monthly',
}))

// Mock entitlements
const mockActivatePlusPlan = vi.fn()
const mockDeactivatePlusPlan = vi.fn()
const mockAddCredits = vi.fn()

vi.mock('@/lib/billing/entitlements', () => ({
  activatePlusPlan: (...args: unknown[]) => mockActivatePlusPlan(...args),
  deactivatePlusPlan: (...args: unknown[]) => mockDeactivatePlusPlan(...args),
  addCredits: (...args: unknown[]) => mockAddCredits(...args),
}))

// Mock data
let mockEventProcessed = false

// Mock Supabase for webhook_events table
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table === 'webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: () =>
            Promise.resolve({
              data: mockEventProcessed ? { id: 'exists' } : null,
              error: mockEventProcessed ? null : { code: 'PGRST116' },
            }),
          insert: () => Promise.resolve({ error: null }),
        }
      }
      return {}
    },
  }),
}))

function createWebhookRequest(body: string, signature: string = 'valid_sig') {
  return new NextRequest(new URL('http://localhost:3000/api/webhooks/stripe'), {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': signature,
    },
  })
}

// Helper functions for creating mock data
function createMockCheckoutSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
    mode: 'subscription',
    customer: 'cus_test_123',
    metadata: {},
    ...overrides,
  }
}

function createMockSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_test_123',
    status: 'active',
    customer: 'cus_test_123',
    metadata: {},
    ...overrides,
  }
}

function createMockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'in_test_123',
    customer: 'cus_test_123',
    amount_paid: 980,
    amount_due: 0,
    ...overrides,
  }
}

function createMockStripeEvent(type: string, data: unknown, id: string = 'evt_test_123') {
  return {
    id,
    type,
    data: { object: data },
  }
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEventProcessed = false
  })

  it('should reject requests without signature', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/webhooks/stripe'),
      {
        method: 'POST',
        body: '{}',
      }
    )

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBe('Missing signature')
  })

  it('should reject invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = createWebhookRequest('{}')
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('should skip already processed events (idempotency)', async () => {
    mockEventProcessed = true
    const event = createMockStripeEvent(
      'checkout.session.completed',
      createMockCheckoutSession()
    )
    mockConstructEvent.mockReturnValue(event)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.skipped).toBe(true)
  })

  describe('checkout.session.completed', () => {
    it('should activate Plus plan for subscription checkout', async () => {
      const session = createMockCheckoutSession({
        mode: 'subscription',
        subscription: 'sub_123',
        customer: 'cus_123',
        metadata: { user_id: 'user_123' },
      })
      const event = createMockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockActivatePlusPlan).toHaveBeenCalledWith(
        'user_123',
        'cus_123',
        'sub_123'
      )
    })

    it('should add credits for payment checkout', async () => {
      const session = createMockCheckoutSession({
        mode: 'payment',
        customer: 'cus_123',
        metadata: { user_id: 'user_123', price_id: 'price_credit_100' },
      })
      const event = createMockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockAddCredits).toHaveBeenCalledWith(
        'user_123',
        100,
        'purchase',
        expect.any(String)
      )
    })

    it('should handle session without user_id metadata', async () => {
      const session = createMockCheckoutSession({
        metadata: {},
      })
      const event = createMockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockActivatePlusPlan).not.toHaveBeenCalled()
    })
  })

  describe('customer.subscription.deleted', () => {
    it('should deactivate Plus plan', async () => {
      const subscription = createMockSubscription({
        metadata: { user_id: 'user_123' },
      })
      const event = createMockStripeEvent(
        'customer.subscription.deleted',
        subscription
      )
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockDeactivatePlusPlan).toHaveBeenCalledWith('user_123')
    })
  })

  describe('customer.subscription.updated', () => {
    it('should activate Plus plan when subscription becomes active', async () => {
      const subscription = createMockSubscription({
        status: 'active',
        customer: 'cus_123',
        metadata: { user_id: 'user_123' },
      })
      const event = createMockStripeEvent(
        'customer.subscription.updated',
        subscription
      )
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockActivatePlusPlan).toHaveBeenCalledWith(
        'user_123',
        'cus_123',
        'sub_test_123'
      )
    })

    it('should deactivate Plus plan when subscription is canceled', async () => {
      const subscription = createMockSubscription({
        status: 'canceled',
        metadata: { user_id: 'user_123' },
      })
      const event = createMockStripeEvent(
        'customer.subscription.updated',
        subscription
      )
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockDeactivatePlusPlan).toHaveBeenCalledWith('user_123')
    })
  })

  describe('invoice events', () => {
    it('should log invoice.paid event', async () => {
      const invoice = createMockInvoice({
        subscription: 'sub_123',
      })
      const event = createMockStripeEvent('invoice.paid', invoice)
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should log invoice.payment_failed event', async () => {
      const invoice = createMockInvoice()
      const event = createMockStripeEvent('invoice.payment_failed', invoice)
      mockConstructEvent.mockReturnValue(event)

      const request = createWebhookRequest(JSON.stringify(event))
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  it('should handle unknown event types gracefully', async () => {
    const event = createMockStripeEvent('unknown.event.type', {})
    mockConstructEvent.mockReturnValue(event)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.received).toBe(true)
  })
})
