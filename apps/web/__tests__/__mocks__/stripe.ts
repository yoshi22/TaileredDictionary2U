import { vi } from 'vitest'

// Mock Stripe types
export interface MockStripeCheckoutSession {
  id: string
  url: string
  mode: 'subscription' | 'payment'
  customer: string
  subscription?: string
  metadata: Record<string, string>
}

export interface MockStripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  customer: string
  metadata: Record<string, string>
}

export interface MockStripeInvoice {
  id: string
  subscription?: string
  customer: string
  amount_paid: number
  amount_due: number
}

export interface MockStripeCustomer {
  id: string
  email: string
  metadata: Record<string, string>
}

export interface MockStripePortalSession {
  id: string
  url: string
}

// Create default mock responses
export function createMockCheckoutSession(
  overrides: Partial<MockStripeCheckoutSession> = {}
): MockStripeCheckoutSession {
  return {
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
    mode: 'subscription',
    customer: 'cus_test_123',
    metadata: {},
    ...overrides,
  }
}

export function createMockSubscription(
  overrides: Partial<MockStripeSubscription> = {}
): MockStripeSubscription {
  return {
    id: 'sub_test_123',
    status: 'active',
    customer: 'cus_test_123',
    metadata: {},
    ...overrides,
  }
}

export function createMockInvoice(
  overrides: Partial<MockStripeInvoice> = {}
): MockStripeInvoice {
  return {
    id: 'in_test_123',
    customer: 'cus_test_123',
    amount_paid: 980,
    amount_due: 0,
    ...overrides,
  }
}

export function createMockCustomer(
  overrides: Partial<MockStripeCustomer> = {}
): MockStripeCustomer {
  return {
    id: 'cus_test_123',
    email: 'test@example.com',
    metadata: {},
    ...overrides,
  }
}

export function createMockPortalSession(
  overrides: Partial<MockStripePortalSession> = {}
): MockStripePortalSession {
  return {
    id: 'bps_test_123',
    url: 'https://billing.stripe.com/test',
    ...overrides,
  }
}

// Create a mock Stripe client
export function createMockStripeClient() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue(createMockCheckoutSession()),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue(createMockPortalSession()),
      },
    },
    customers: {
      create: vi.fn().mockResolvedValue(createMockCustomer()),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  }
}

// Mock for the stripe module
export const mockStripeClient = createMockStripeClient()

// Helper to create a mock Stripe event
export function createMockStripeEvent(
  type: string,
  data: unknown,
  id: string = 'evt_test_123'
) {
  return {
    id,
    type,
    data: {
      object: data,
    },
  }
}
