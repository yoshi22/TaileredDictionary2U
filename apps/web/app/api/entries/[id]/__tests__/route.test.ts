import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'
import {
  createMockUser,
  createMockRequest,
  sampleEntry,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockSelectResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockUpdateResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockDeleteResult: { error: unknown } = { error: null }
let mockDeckCheckResult: { data: unknown; error: unknown } = { data: { id: 'deck-123' }, error: null }

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
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() =>
              Promise.resolve(mockSelectResult)
            ),
          }
        }
        if (table === 'decks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() =>
              Promise.resolve(mockDeckCheckResult)
            ),
          }
        }
        if (table === 'srs_data') {
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() =>
              Promise.resolve(mockDeleteResult)
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

describe('GET /api/entries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockSelectResult = { data: sampleEntry, error: null }
  })

  it('should return entry for valid id', async () => {
    const request = createMockRequest('/api/entries/entry-123')
    const response = await GET(request, mockParams)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.id).toBe('entry-123')
    expect(json.data.term).toBe('machine learning')
  })

  it('should return 404 for non-existent entry', async () => {
    mockSelectResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/entries/non-existent')
    const response = await GET(request, { params: { id: 'non-existent' } })

    expect(response.status).toBe(404)
  })

  it('should format SRS data correctly', async () => {
    const request = createMockRequest('/api/entries/entry-123')
    const response = await GET(request, mockParams)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.ease_factor).toBe(2.5)
    expect(json.data.interval_days).toBe(0)
    expect(json.data.repetitions).toBe(0)
  })

  it('should include deck name in response', async () => {
    const request = createMockRequest('/api/entries/entry-123')
    const response = await GET(request, mockParams)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.deck_name).toBe('Test Deck')
  })
})

describe('PATCH /api/entries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockSelectResult = { data: { id: 'entry-123' }, error: null }
    mockUpdateResult = { data: sampleEntry, error: null }
    mockDeckCheckResult = { data: { id: 'deck-123' }, error: null }
  })

  it('should update entry with valid data', async () => {
    // For PATCH, we need the update chain to return the updated entry
    vi.mocked(vi.fn()).mockImplementation(() =>
      Promise.resolve({ data: { ...sampleEntry, term: 'updated term' }, error: null })
    )

    const request = createMockRequest('/api/entries/entry-123', {
      method: 'PATCH',
      body: {
        term: 'updated term',
      },
    })

    const response = await PATCH(request, mockParams)
    expect(response.status).toBe(200)
  })

  it('should return 404 for non-existent entry', async () => {
    mockSelectResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/entries/entry-123', {
      method: 'PATCH',
      body: {
        term: 'updated term',
      },
    })

    const response = await PATCH(request, mockParams)
    expect(response.status).toBe(404)
  })

  it('should reject invalid update data', async () => {
    const request = createMockRequest('/api/entries/entry-123', {
      method: 'PATCH',
      body: {
        term: '', // Empty term is invalid
      },
    })

    const response = await PATCH(request, mockParams)
    expect(response.status).toBe(400)
  })

  it('should return 404 for invalid deck_id', async () => {
    mockDeckCheckResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/entries/entry-123', {
      method: 'PATCH',
      body: {
        deck_id: '123e4567-e89b-12d3-a456-426614174000',
      },
    })

    const response = await PATCH(request, mockParams)
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/entries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockSelectResult = { data: { id: 'entry-123' }, error: null }
    mockDeleteResult = { error: null }
  })

  it('should delete entry successfully', async () => {
    const request = createMockRequest('/api/entries/entry-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, mockParams)
    expect(response.status).toBe(204)
  })

  it('should return 404 for non-existent entry', async () => {
    mockSelectResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/entries/entry-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, mockParams)
    expect(response.status).toBe(404)
  })
})
