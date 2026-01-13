import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for mock query builder
export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
}

// Create mock response helper
export function createMockResponse<T>(data: T | null, error: Error | null = null) {
  return { data, error }
}

// Create a mock query builder that returns the specified response
export function createMockQueryBuilder(response: { data: unknown; error: Error | null }): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(response),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
  }
  return builder
}

// Create a mock Supabase client
export function createMockSupabaseClient(queryBuilder: MockQueryBuilder): Partial<SupabaseClient> {
  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    } as unknown as SupabaseClient['auth'],
  }
}

// Default mock for Supabase server client
export const mockSupabaseServerClient = vi.fn()

// Mock for createServiceRoleClient
export const mockServiceRoleClient = vi.fn()
