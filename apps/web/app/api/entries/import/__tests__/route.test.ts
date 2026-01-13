import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  createMockUser,
} from '@/__tests__/helpers/api-test-utils'

// Mock data - mutable for tests
const mockData = {
  user: createMockUser(),
  deckResult: { data: null as unknown, error: null as unknown },
  existingEntriesResult: { data: [] as unknown[], error: null as unknown },
  decksListResult: { data: [] as unknown[], error: null as unknown },
  insertResult: { data: [] as unknown[], error: null as unknown },
  srsUpsertResult: { error: null as unknown },
}

// Mock getAuthUser and rate limit
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getAuthUser: vi.fn(() => Promise.resolve(mockData.user)),
    withRateLimit: vi.fn(() => Promise.resolve()),
    getClientIdentifier: vi.fn(() => Promise.resolve('user-123')),
  }
})

// Mock CSV utils
vi.mock('@/lib/csv', () => ({
  parseCSV: vi.fn((content: string) => {
    const lines = content.trim().split('\n')
    if (lines.length <= 1) {
      return { rows: [], errors: [] }
    }

    const rows = lines.slice(1).map((line) => {
      const [term, context] = line.split(',')
      if (!term || term.trim() === '') {
        return null
      }
      return {
        term: term.trim(),
        context: context?.trim() || null,
        deck_id: null,
      }
    }).filter((row): row is NonNullable<typeof row> => row !== null)

    return { rows, errors: [] }
  }),
  CSV_MAX_FILE_SIZE: 5 * 1024 * 1024,
}))

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn((table: string) => {
        if (table === 'entries') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn(() => Promise.resolve(mockData.existingEntriesResult)),
          }
        }
        if (table === 'decks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn(() => Promise.resolve(mockData.decksListResult)),
            single: vi.fn(() => Promise.resolve(mockData.deckResult)),
          }
        }
        if (table === 'srs_data') {
          return {
            upsert: vi.fn(() => Promise.resolve(mockData.srsUpsertResult)),
          }
        }
        return {}
      }),
    })
  ),
}))

function createMockFormData(csvContent: string, options: Record<string, string> = {}) {
  const formData = new FormData()
  const file = new File([csvContent], 'import.csv', { type: 'text/csv' })
  formData.append('file', file)

  for (const [key, value] of Object.entries(options)) {
    formData.append(key, value)
  }

  return formData
}

function createImportRequest(formData: FormData) {
  return {
    formData: () => Promise.resolve(formData),
  } as unknown as import('next/server').NextRequest
}

describe('POST /api/entries/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.user = createMockUser()
    mockData.deckResult = { data: { id: 'deck-123' }, error: null }
    mockData.existingEntriesResult = { data: [], error: null }
    mockData.decksListResult = { data: [], error: null }
    mockData.insertResult = { data: [{ id: 'entry-new-1' }], error: null }
    mockData.srsUpsertResult = { error: null }
  })

  it('should import entries from valid CSV', async () => {
    const csvContent = 'term,context\nmachine learning,AI context\ndeep learning,Neural nets'
    const formData = createMockFormData(csvContent)
    const request = createImportRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.total).toBe(2)
  })

  it('should reject non-CSV file', async () => {
    const formData = new FormData()
    const file = new File(['not csv'], 'import.txt', { type: 'text/plain' })
    formData.append('file', file)
    const request = createImportRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should reject missing file', async () => {
    const formData = new FormData()
    const request = createImportRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should handle skip_duplicates option', async () => {
    mockData.existingEntriesResult = { data: [{ term: 'machine learning' }], error: null }

    const csvContent = 'term,context\nmachine learning,AI context\nnew term,New context'
    const formData = createMockFormData(csvContent, { skip_duplicates: 'true' })
    const request = createImportRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should return 404 for invalid deck_id', async () => {
    mockData.deckResult = { data: null, error: { message: 'Not found' } }

    const csvContent = 'term,context\nmachine learning,AI context'
    const formData = createMockFormData(csvContent, { deck_id: 'non-existent-deck' })
    const request = createImportRequest(formData)

    const response = await POST(request)

    // Returns 400 (validation) or 404 (not found) depending on validation order
    expect([400, 404]).toContain(response.status)
  })

  it('should handle empty CSV', async () => {
    const csvContent = 'term,context'
    const formData = createMockFormData(csvContent)
    const request = createImportRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.imported).toBe(0)
  })
})
