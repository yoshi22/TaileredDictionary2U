import { vi } from 'vitest'

/**
 * Create a mock query builder with chainable methods
 */
export const createMockQueryBuilder = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return builder
}

/**
 * Create a mock Supabase response
 */
export const createMockResponse = <T>(
  data: T | null,
  error: { message: string; code?: string } | null = null,
  count: number | null = null
) => ({
  data,
  error,
  count,
})

/**
 * Create a mock user
 */
export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Create a mock session
 */
export const createMockSession = (overrides: Record<string, unknown> = {}) => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
})

/**
 * Create a mock Supabase client
 */
export const createMockSupabaseClient = () => {
  const mockQueryBuilder = createMockQueryBuilder()

  return {
    from: vi.fn(() => mockQueryBuilder),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: createMockSession() },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: createMockUser(), session: createMockSession() },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: createMockUser(), session: createMockSession() },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn((callback) => {
        // Call with initial authenticated state
        callback('SIGNED_IN', createMockSession())
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        }
      }),
    },
    _queryBuilder: mockQueryBuilder,
  }
}

/**
 * Sample entry data for testing
 */
export const sampleEntry = {
  id: 'entry-1',
  user_id: 'test-user-id',
  deck_id: 'deck-1',
  term: 'test term',
  context: 'test context',
  enrichment: {
    translation_ja: 'テスト翻訳',
    translation_en: 'test translation',
    summary: 'Test summary',
    examples: ['Example 1', 'Example 2'],
    related_terms: ['related1', 'related2'],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

/**
 * Sample deck data for testing
 */
export const sampleDeck = {
  id: 'deck-1',
  user_id: 'test-user-id',
  name: 'Test Deck',
  description: 'Test deck description',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
