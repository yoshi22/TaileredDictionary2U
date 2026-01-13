import { vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Create a mock authenticated user
 */
export function createMockUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: overrides.id ?? 'user-123',
    email: overrides.email ?? 'test@example.com',
  }
}

/**
 * Create a mock NextRequest
 */
export function createMockRequest(
  path: string,
  options: {
    method?: string
    body?: unknown
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, searchParams = {} } = options

  const url = new URL(path, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

/**
 * Mock Supabase query builder result
 */
export function createMockSupabaseResult<T>(data: T | null, error: unknown = null) {
  return { data, error, count: Array.isArray(data) ? data.length : null }
}

/**
 * Create mock Supabase query chain for select queries
 */
export function createMockSelectChain<T>(result: { data: T | null; error: unknown; count?: number | null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn().mockImplementation((callback) => callback(result)),
  }

  // Make the chain awaitable
  Object.assign(chain, Promise.resolve(result))

  return chain
}

/**
 * Create mock Supabase query chain for insert queries
 */
export function createMockInsertChain<T>(result: { data: T | null; error: unknown }) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }
  return chain
}

/**
 * Create mock Supabase query chain for update queries
 */
export function createMockUpdateChain<T>(result: { data: T | null; error: unknown }) {
  const chain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }
  return chain
}

/**
 * Create mock Supabase query chain for delete queries
 */
export function createMockDeleteChain(result: { error: unknown }) {
  const chain = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  }
  return chain
}

/**
 * Parse JSON from NextResponse
 */
export async function parseResponseJson(response: Response) {
  const text = await response.text()
  return JSON.parse(text)
}

/**
 * Sample entry fixture for API tests
 */
export const sampleEntry = {
  id: 'entry-123',
  user_id: 'user-123',
  deck_id: 'deck-123',
  term: 'machine learning',
  context: 'In AI context',
  enrichment: null,
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
  srs_data: [{
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    due_date: '2025-01-07T10:00:00Z',
    last_reviewed_at: null,
  }],
  decks: [{ name: 'Test Deck' }],
}

/**
 * Sample entry list fixture
 */
export const sampleEntryList = [
  sampleEntry,
  {
    ...sampleEntry,
    id: 'entry-456',
    term: 'deep learning',
  },
]
