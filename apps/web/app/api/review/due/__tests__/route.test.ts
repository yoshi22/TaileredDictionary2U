import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import {
  createMockUser,
  createMockRequest,
  sampleEntry,
  sampleEntryList,
} from '@/__tests__/helpers/api-test-utils'

// Mock data
let mockUser = createMockUser()
let mockSelectResult: { data: unknown; error: unknown } = { data: [], error: null }

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
      from: vi.fn(() => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(() => {
            // Return the chain for chained .eq() calls
            return {
              ...chain,
              then: (resolve: (value: unknown) => void) => resolve(mockSelectResult),
            }
          }),
        }
        // Make the chain awaitable after all method calls
        return {
          ...chain,
          then: (resolve: (value: unknown) => void) => resolve(mockSelectResult),
        }
      }),
    })
  ),
}))

// Create due entries (due_date in the past)
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow

const dueEntry = {
  ...sampleEntry,
  id: 'due-entry-1',
  srs_data: [{
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 1,
    due_date: pastDate,
    last_reviewed_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  }],
}

const notDueEntry = {
  ...sampleEntry,
  id: 'not-due-entry',
  srs_data: [{
    ease_factor: 2.5,
    interval_days: 7,
    repetitions: 3,
    due_date: futureDate,
    last_reviewed_at: new Date().toISOString(),
  }],
}

describe('GET /api/review/due', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = createMockUser()
    mockSelectResult = { data: [dueEntry], error: null }
  })

  it('should return due entries for authenticated user', async () => {
    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.entries).toBeDefined()
    expect(json.data.total).toBeDefined()
  })

  it('should filter entries by due date', async () => {
    mockSelectResult = { data: [dueEntry, notDueEntry], error: null }

    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    // Only the due entry should be returned
    expect(json.data.entries.length).toBe(1)
    expect(json.data.entries[0].id).toBe('due-entry-1')
  })

  it('should apply limit parameter', async () => {
    const manyDueEntries = Array(30).fill(null).map((_, i) => ({
      ...dueEntry,
      id: `due-entry-${i}`,
    }))
    mockSelectResult = { data: manyDueEntries, error: null }

    const request = createMockRequest('/api/review/due', {
      searchParams: { limit: '10' },
    })
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.entries.length).toBe(10)
  })

  it('should filter by deck_id', async () => {
    const request = createMockRequest('/api/review/due', {
      searchParams: { deck_id: '123e4567-e89b-12d3-a456-426614174000' },
    })
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('should return empty array when no entries are due', async () => {
    mockSelectResult = { data: [notDueEntry], error: null }

    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.entries).toHaveLength(0)
    expect(json.data.total).toBe(0)
  })

  it('should reject invalid limit parameter', async () => {
    const request = createMockRequest('/api/review/due', {
      searchParams: { limit: '0' },
    })
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('should reject invalid deck_id format', async () => {
    const request = createMockRequest('/api/review/due', {
      searchParams: { deck_id: 'invalid-uuid' },
    })
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('should handle database errors gracefully', async () => {
    mockSelectResult = { data: null, error: { message: 'Database error' } }

    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })

  it('should sort entries by due date (oldest first)', async () => {
    const olderDueDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() // 3 days ago
    const newerDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago

    const olderEntry = {
      ...dueEntry,
      id: 'older-entry',
      srs_data: [{ ...dueEntry.srs_data[0], due_date: olderDueDate }],
    }
    const newerEntry = {
      ...dueEntry,
      id: 'newer-entry',
      srs_data: [{ ...dueEntry.srs_data[0], due_date: newerDueDate }],
    }

    mockSelectResult = { data: [newerEntry, olderEntry], error: null }

    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.entries.length).toBe(2)
    // Older entry should come first
    expect(json.data.entries[0].id).toBe('older-entry')
  })

  it('should format entry response correctly', async () => {
    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    const entry = json.data.entries[0]

    expect(entry.id).toBeDefined()
    expect(entry.term).toBeDefined()
    expect(entry.ease_factor).toBeDefined()
    expect(entry.interval_days).toBeDefined()
    expect(entry.repetitions).toBeDefined()
    expect(entry.due_date).toBeDefined()
    expect(entry.deck_name).toBeDefined()
  })

  it('should use default limit of 20', async () => {
    const manyDueEntries = Array(50).fill(null).map((_, i) => ({
      ...dueEntry,
      id: `due-entry-${i}`,
    }))
    mockSelectResult = { data: manyDueEntries, error: null }

    const request = createMockRequest('/api/review/due')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.entries.length).toBe(20)
  })
})
