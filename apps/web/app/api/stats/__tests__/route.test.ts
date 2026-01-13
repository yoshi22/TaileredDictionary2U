import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

// Mock data - need to be mutable for tests
const mockData = {
  user: { id: 'user-123', email: 'test@example.com' } as { id: string; email: string } | null,
  authError: null as { message: string } | null,
  statsResult: { data: null as unknown, error: null as unknown },
  entitlementResult: { data: null as unknown, error: null as unknown },
  reviewCount: { count: 0 as number | null },
}

// Sample stats data
const sampleStats = {
  user_id: 'user-123',
  total_entries: 50,
  due_entries: 10,
  total_decks: 3,
}

const sampleEntitlement = {
  user_id: 'user-123',
  plan_type: 'plus',
  monthly_generation_used: 45,
  monthly_generation_limit: 200,
  credit_balance: 100,
}

// Mock Supabase client - uses mockData for dynamic values
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: mockData.user },
            error: mockData.authError,
          })
        ),
      },
      from: vi.fn((table: string) => {
        if (table === 'v_user_stats') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve(mockData.statsResult)),
          }
        }
        if (table === 'entitlements') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve(mockData.entitlementResult)),
          }
        }
        if (table === 'srs_data') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn(() => Promise.resolve(mockData.reviewCount)),
          }
        }
        return {}
      }),
    })
  ),
}))

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock data
    mockData.user = { id: 'user-123', email: 'test@example.com' }
    mockData.authError = null
    mockData.statsResult = { data: sampleStats, error: null }
    mockData.entitlementResult = { data: sampleEntitlement, error: null }
    mockData.reviewCount = { count: 5 }
  })

  it('should return stats for authenticated user', async () => {
    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.total_entries).toBe(50)
    expect(json.data.due_entries).toBe(10)
    expect(json.data.total_decks).toBe(3)
    expect(json.data.plan.type).toBe('plus')
    expect(json.data.plan.generation_limit).toBe(200)
  })

  it('should return 401 for unauthenticated user', async () => {
    mockData.user = null
    mockData.authError = { message: 'Not authenticated' }

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it('should return default values when stats not found', async () => {
    mockData.statsResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } }
    mockData.entitlementResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } }

    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.total_entries).toBe(0)
    expect(json.data.due_entries).toBe(0)
    expect(json.data.plan.type).toBe('free')
    expect(json.data.plan.generation_limit).toBe(20)
  })

  it('should handle database errors gracefully', async () => {
    mockData.statsResult = { data: null, error: { code: 'INTERNAL', message: 'Database error' } }

    const response = await GET()

    expect(response.status).toBe(500)
  })

  it('should return free plan defaults when no entitlement exists', async () => {
    mockData.entitlementResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } }

    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.plan.type).toBe('free')
    expect(json.data.plan.generation_limit).toBe(20)
    expect(json.data.plan.credit_balance).toBe(0)
  })
})
