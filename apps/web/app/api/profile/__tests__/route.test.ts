import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockProfileResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockEntitlementResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockUpdateResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockInsertResult: { data: unknown; error: unknown } = { data: null, error: null }

// Sample data
const sampleProfile = {
  id: 'user-123',
  email: 'test@example.com',
  display_name: 'Test User',
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
}

const sampleEntitlement = {
  user_id: 'user-123',
  plan_type: 'plus',
  monthly_generation_used: 45,
  monthly_generation_limit: 200,
  credit_balance: 100,
}

// Mock getAuthUser
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getAuthUser: vi.fn(() => Promise.resolve(mockUser)),
  }
})

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              // Return insert result if available, otherwise profile result
              if (mockInsertResult.data) {
                return Promise.resolve(mockInsertResult)
              }
              if (mockUpdateResult.data) {
                return Promise.resolve(mockUpdateResult)
              }
              return Promise.resolve(mockProfileResult)
            }),
          }
        }
        if (table === 'entitlements') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() =>
              Promise.resolve(mockEntitlementResult)
            ),
          }
        }
        return {}
      }),
    })
  ),
}))

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockProfileResult = { data: sampleProfile, error: null }
    mockEntitlementResult = { data: sampleEntitlement, error: null }
    mockInsertResult = { data: null, error: null }
    mockUpdateResult = { data: null, error: null }
  })

  it('should return profile with entitlement for authenticated user', async () => {
    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.email).toBe('test@example.com')
    expect(json.data.display_name).toBe('Test User')
    expect(json.data.entitlement).toBeDefined()
    expect(json.data.entitlement.plan_type).toBe('plus')
  })

  it('should create profile if not exists', async () => {
    mockProfileResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } }
    mockInsertResult = { data: sampleProfile, error: null }

    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data).toBeDefined()
  })

  it('should return profile without entitlement when entitlement not found', async () => {
    mockEntitlementResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } }

    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.email).toBe('test@example.com')
  })

  it('should handle database errors gracefully', async () => {
    mockProfileResult = { data: null, error: { code: 'INTERNAL', message: 'Database error' } }

    const response = await GET()

    expect(response.status).toBe(500)
  })
})

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockUpdateResult = { data: { ...sampleProfile, display_name: 'Updated Name' }, error: null }
  })

  it('should update display_name', async () => {
    const request = createMockRequest('/api/profile', {
      method: 'PATCH',
      body: {
        display_name: 'Updated Name',
      },
    })

    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.display_name).toBe('Updated Name')
  })

  it('should handle database errors on update', async () => {
    mockUpdateResult = { data: null, error: { message: 'Update failed' } }

    const request = createMockRequest('/api/profile', {
      method: 'PATCH',
      body: {
        display_name: 'New Name',
      },
    })

    const response = await PATCH(request)
    expect(response.status).toBe(500)
  })
})
