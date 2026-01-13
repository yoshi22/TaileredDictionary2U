import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockEntrySelectResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockSrsUpsertResult: { error: unknown } = { error: null }

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
        if (table === 'entries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() =>
              Promise.resolve(mockEntrySelectResult)
            ),
          }
        }
        if (table === 'srs_data') {
          return {
            upsert: vi.fn().mockImplementation(() =>
              Promise.resolve(mockSrsUpsertResult)
            ),
          }
        }
        return {}
      }),
    })
  ),
}))

// Mock params
const mockParams = { params: { id: 'entry-123' } }

const sampleEntryWithSrs = {
  id: 'entry-123',
  srs_data: [{
    id: 'srs-123',
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 1,
    due_date: '2025-01-07T10:00:00Z',
    last_reviewed_at: '2025-01-06T10:00:00Z',
  }],
}

describe('POST /api/review/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockEntrySelectResult = { data: sampleEntryWithSrs, error: null }
    mockSrsUpsertResult = { error: null }
  })

  it('should submit review with rating 0 (Again)', async () => {
    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 0 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.entry_id).toBe('entry-123')
    expect(json.data.rating).toBe(0)
    expect(json.data.new_state).toBeDefined()
    // Rating 0 resets interval to 1
    expect(json.data.new_state.interval_days).toBe(1)
  })

  it('should submit review with rating 1 (Hard)', async () => {
    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 1 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.rating).toBe(1)
  })

  it('should submit review with rating 2 (Good)', async () => {
    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 2 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.rating).toBe(2)
    expect(json.data.new_state.interval_days).toBeGreaterThan(0)
  })

  it('should submit review with rating 3 (Easy)', async () => {
    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 3 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.rating).toBe(3)
    expect(json.data.new_state.ease_factor).toBeGreaterThanOrEqual(2.5)
  })

  it('should return 400 for invalid rating', async () => {
    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 5 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing rating', async () => {
    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: {},
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(400)
  })

  it('should return 404 for non-existent entry', async () => {
    mockEntrySelectResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 2 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(404)
  })

  it('should handle entry without existing SRS data', async () => {
    mockEntrySelectResult = {
      data: { id: 'entry-123', srs_data: null },
      error: null,
    }

    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 2 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.new_state).toBeDefined()
  })

  it('should handle database error on SRS update', async () => {
    mockSrsUpsertResult = { error: { message: 'Database error' } }

    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 2 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(500)
  })

  it('should update SRS state with correct calculation', async () => {
    // Start with initial state
    mockEntrySelectResult = {
      data: {
        id: 'entry-123',
        srs_data: [{
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          due_date: '2025-01-07T10:00:00Z',
          last_reviewed_at: null,
        }],
      },
      error: null,
    }

    const request = createMockRequest('/api/review/entry-123', {
      method: 'POST',
      body: { rating: 2 },
    })

    const response = await POST(request, mockParams)
    expect(response.status).toBe(200)

    const json = await response.json()
    // First Good rating should set interval to 1
    expect(json.data.new_state.repetitions).toBe(1)
  })
})
