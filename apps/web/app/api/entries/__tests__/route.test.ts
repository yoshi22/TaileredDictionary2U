import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import {
  createMockUser,
  createMockRequest,
  sampleEntry,
  sampleEntryList,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockSelectResult: { data: unknown; error: unknown; count?: number | null } = { data: [], error: null, count: 0 }
let mockInsertResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockDeckCheckResult: { data: unknown; error: unknown } = { data: { id: 'deck-123' }, error: null }
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
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockImplementation(() =>
              Promise.resolve(mockSelectResult)
            ),
            single: vi.fn().mockImplementation(() =>
              Promise.resolve(mockInsertResult)
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

describe('GET /api/entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockSelectResult = { data: sampleEntryList, error: null, count: 2 }
  })

  it('should return entries for authenticated user', async () => {
    const request = createMockRequest('/api/entries')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data).toHaveLength(2)
    expect(json.data[0].term).toBe('machine learning')
    expect(json.pagination).toBeDefined()
    expect(json.pagination.total).toBe(2)
  })

  it('should apply pagination parameters', async () => {
    const request = createMockRequest('/api/entries', {
      searchParams: { limit: '10', offset: '20' },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('should filter by deck_id', async () => {
    const request = createMockRequest('/api/entries', {
      searchParams: { deck_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('should filter by search term', async () => {
    const request = createMockRequest('/api/entries', {
      searchParams: { search: 'machine' },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('should reject invalid limit parameter', async () => {
    const request = createMockRequest('/api/entries', {
      searchParams: { limit: '0' },
    })

    const response = await GET(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject invalid sort parameter', async () => {
    const request = createMockRequest('/api/entries', {
      searchParams: { sort: 'invalid' },
    })

    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('should handle database errors gracefully', async () => {
    mockSelectResult = { data: null, error: { message: 'Database error' }, count: null }

    const request = createMockRequest('/api/entries')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockInsertResult = { data: sampleEntry, error: null }
    mockDeckCheckResult = { data: { id: 'deck-123' }, error: null }
    mockSrsUpsertResult = { error: null }
  })

  it('should create a new entry with valid data', async () => {
    const request = createMockRequest('/api/entries', {
      method: 'POST',
      body: {
        term: 'machine learning',
        context: 'In AI context',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const json = await response.json()
    expect(json.data).toBeDefined()
  })

  it('should create entry with deck_id', async () => {
    const request = createMockRequest('/api/entries', {
      method: 'POST',
      body: {
        term: 'API',
        deck_id: '123e4567-e89b-12d3-a456-426614174000',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('should reject empty term', async () => {
    const request = createMockRequest('/api/entries', {
      method: 'POST',
      body: {
        term: '',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject term exceeding max length', async () => {
    const request = createMockRequest('/api/entries', {
      method: 'POST',
      body: {
        term: 'a'.repeat(201),
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 404 for invalid deck_id', async () => {
    mockDeckCheckResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/entries', {
      method: 'POST',
      body: {
        term: 'test',
        deck_id: '123e4567-e89b-12d3-a456-426614174000',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('should handle database errors on insert', async () => {
    mockInsertResult = { data: null, error: { message: 'Insert failed' } }

    const request = createMockRequest('/api/entries', {
      method: 'POST',
      body: {
        term: 'test term',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
