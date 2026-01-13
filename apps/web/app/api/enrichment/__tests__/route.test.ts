import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  createMockUser,
  createMockRequest,
} from '@/__tests__/helpers/api-test-utils'

// Hoisted mock functions - these are hoisted along with vi.mock
const { mockConsumeGeneration, mockCheckGenerationEntitlement, mockGenerateEnrichment } = vi.hoisted(() => ({
  mockConsumeGeneration: vi.fn(() => Promise.resolve()),
  mockCheckGenerationEntitlement: vi.fn(),
  mockGenerateEnrichment: vi.fn(),
}))

// Mock data
let mockUser = createMockUser()
let mockEntrySelectResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockEntitlementCheck = { allowed: true, reason: null as string | null }
let mockEnrichmentResult = {
  translation_ja: 'テスト翻訳',
  translation_en: 'Test Translation',
  summary: 'A brief summary',
  examples: ['Example 1', 'Example 2'],
  related_terms: ['term1', 'term2'],
  reference_links: [{ title: 'Test', url: 'https://example.com' }],
}

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
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() =>
          Promise.resolve(mockEntrySelectResult)
        ),
      })),
    })
  ),
}))

// Mock billing/entitlements
vi.mock('@/lib/billing/entitlements', () => ({
  checkGenerationEntitlement: (...args: unknown[]) => mockCheckGenerationEntitlement(...args),
  consumeGeneration: (...args: unknown[]) => mockConsumeGeneration(...args),
}))

// Mock LLM provider
vi.mock('@/lib/llm', () => ({
  getOpenAIProvider: vi.fn(() => ({
    generateEnrichment: (...args: unknown[]) => mockGenerateEnrichment(...args),
  })),
  LLMError: class LLMError extends Error {
    code: string
    retryable: boolean
    constructor(code: string, message: string, retryable = false) {
      super(message)
      this.code = code
      this.retryable = retryable
    }
  },
}))

const sampleEntryWithoutEnrichment = {
  id: 'entry-123',
  user_id: 'user-123',
  deck_id: 'deck-123',
  term: 'machine learning',
  context: 'In AI context',
  enrichment: null,
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
}

const sampleEntryWithEnrichment = {
  ...sampleEntryWithoutEnrichment,
  enrichment: {
    translation_ja: '既存の翻訳',
    translation_en: 'Existing translation',
    summary: 'Existing summary',
    examples: ['Example'],
    related_terms: ['term'],
    reference_links: [],
  },
}

describe('POST /api/enrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsumeGeneration.mockClear()
    mockCheckGenerationEntitlement.mockClear()
    mockGenerateEnrichment.mockClear()
    mockCheckGenerationEntitlement.mockImplementation(() => Promise.resolve(mockEntitlementCheck))
    mockGenerateEnrichment.mockImplementation(() => Promise.resolve(mockEnrichmentResult))
    mockUser = createMockUser()
    mockEntrySelectResult = { data: sampleEntryWithoutEnrichment, error: null }
    mockEntitlementCheck = { allowed: true, reason: null }
  })

  it('should generate enrichment for valid entry', async () => {
    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.generated).toBe(true)
    expect(json.data.message).toBe('Enrichment generated successfully')
  })

  it('should return existing enrichment if already present', async () => {
    mockEntrySelectResult = { data: sampleEntryWithEnrichment, error: null }

    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.generated).toBe(false)
    expect(json.data.message).toBe('Entry already has enrichment')
  })

  it('should return 400 for invalid entry_id format', async () => {
    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: 'invalid-uuid' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing entry_id', async () => {
    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: {},
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 404 for non-existent entry', async () => {
    mockEntrySelectResult = { data: null, error: { message: 'Not found' } }

    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('should return 429 when generation limit exceeded', async () => {
    mockEntitlementCheck = { allowed: false, reason: 'Monthly limit exceeded' }
    mockCheckGenerationEntitlement.mockImplementation(() => Promise.resolve(mockEntitlementCheck))

    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    const response = await POST(request)
    expect(response.status).toBe(429)
  })

  it('should handle LLM errors gracefully', async () => {
    // Mock LLM to throw error
    const { LLMError } = await import('@/lib/llm')
    mockGenerateEnrichment.mockRejectedValueOnce(
      new LLMError('API_ERROR', 'API error', false)
    )

    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('should consume generation quota after successful enrichment', async () => {
    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    await POST(request)
    expect(mockConsumeGeneration).toHaveBeenCalledWith('user-123')
  })

  it('should not consume quota if entry already has enrichment', async () => {
    mockEntrySelectResult = { data: sampleEntryWithEnrichment, error: null }

    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    await POST(request)
    expect(mockConsumeGeneration).not.toHaveBeenCalled()
  })

  it('should check entitlement before generating', async () => {
    const request = createMockRequest('/api/enrichment', {
      method: 'POST',
      body: { entry_id: '123e4567-e89b-12d3-a456-426614174000' },
    })

    await POST(request)
    expect(mockCheckGenerationEntitlement).toHaveBeenCalledWith('user-123')
  })
})
