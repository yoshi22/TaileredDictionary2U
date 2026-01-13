import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockSelectResult: { data: unknown; error: unknown } = { data: [], error: null }
let mockInsertResult: { data: unknown; error: unknown } = { data: null, error: null }

// Sample deck data
const sampleDeck = {
  id: 'deck-123',
  user_id: 'user-123',
  name: 'Test Deck',
  description: 'A test deck for vocabulary',
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
}

const sampleDeckList = [
  sampleDeck,
  {
    ...sampleDeck,
    id: 'deck-456',
    name: 'Another Deck',
  },
]

// Mock getAuthUser
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getAuthUser: vi.fn(() => Promise.resolve(mockUser)),
    withRateLimit: vi.fn(() => Promise.resolve()),
    getClientIdentifier: vi.fn(() => Promise.resolve('user-123')),
  }
})

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn((table: string) => {
        if (table === 'decks') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockImplementation(() =>
              Promise.resolve(mockSelectResult)
            ),
            single: vi.fn().mockImplementation(() =>
              Promise.resolve(mockInsertResult)
            ),
          }
        }
        return {}
      }),
    })
  ),
}))

describe('GET /api/decks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockSelectResult = { data: sampleDeckList, error: null }
  })

  it('should return decks for authenticated user', async () => {
    const request = createMockRequest('/api/decks')
    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data).toHaveLength(2)
    expect(json.data[0].name).toBe('Test Deck')
  })

  it('should return empty array when no decks exist', async () => {
    mockSelectResult = { data: [], error: null }

    const request = createMockRequest('/api/decks')
    const response = await GET()

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data).toHaveLength(0)
  })

  it('should handle database errors gracefully', async () => {
    mockSelectResult = { data: null, error: { message: 'Database error' } }

    const request = createMockRequest('/api/decks')
    const response = await GET()

    expect(response.status).toBe(500)
  })
})

describe('POST /api/decks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockInsertResult = { data: sampleDeck, error: null }
  })

  it('should create a new deck with valid data', async () => {
    const request = createMockRequest('/api/decks', {
      method: 'POST',
      body: {
        name: 'New Deck',
        description: 'A new test deck',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const json = await response.json()
    expect(json.data).toBeDefined()
  })

  it('should create deck without description', async () => {
    const request = createMockRequest('/api/decks', {
      method: 'POST',
      body: {
        name: 'Deck Without Description',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('should reject empty name', async () => {
    const request = createMockRequest('/api/decks', {
      method: 'POST',
      body: {
        name: '',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject name exceeding max length', async () => {
    const request = createMockRequest('/api/decks', {
      method: 'POST',
      body: {
        name: 'a'.repeat(101),
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject description exceeding max length', async () => {
    const request = createMockRequest('/api/decks', {
      method: 'POST',
      body: {
        name: 'Valid Name',
        description: 'a'.repeat(501),
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should handle database errors on insert', async () => {
    mockInsertResult = { data: null, error: { message: 'Insert failed' } }

    const request = createMockRequest('/api/decks', {
      method: 'POST',
      body: {
        name: 'Test Deck',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
