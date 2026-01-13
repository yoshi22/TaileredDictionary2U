import { describe, it, expect } from 'vitest'
import {
  EnrichmentSchema,
  GenerateEnrichmentRequestSchema,
  LLMEnrichmentResponseSchema,
  ReferenceLinkSchema,
} from '../enrichment'

describe('ReferenceLinkSchema', () => {
  it('should accept valid reference link', () => {
    const result = ReferenceLinkSchema.safeParse({
      title: 'Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Test',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid URL', () => {
    const result = ReferenceLinkSchema.safeParse({
      title: 'Test',
      url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing title', () => {
    const result = ReferenceLinkSchema.safeParse({
      url: 'https://example.com',
    })
    expect(result.success).toBe(false)
  })
})

describe('EnrichmentSchema', () => {
  const validEnrichment = {
    translation_ja: '機械学習',
    translation_en: 'Machine Learning',
    summary: 'A brief summary',
    examples: ['Example 1', 'Example 2'],
    related_terms: ['AI', 'deep learning'],
    reference_links: [{ title: 'Wiki', url: 'https://example.com' }],
  }

  it('should accept valid enrichment data', () => {
    const result = EnrichmentSchema.safeParse(validEnrichment)
    expect(result.success).toBe(true)
  })

  it('should accept enrichment with optional fields', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      generated_at: '2025-01-07T10:00:00Z',
      model: 'gpt-4o-mini',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty examples array', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      examples: [],
    })
    expect(result.success).toBe(false)
  })

  it('should reject examples array with more than 5 items', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      examples: ['1', '2', '3', '4', '5', '6'],
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty related_terms array', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      related_terms: [],
    })
    expect(result.success).toBe(false)
  })

  it('should reject related_terms array with more than 10 items', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      related_terms: Array(11).fill('term'),
    })
    expect(result.success).toBe(false)
  })

  it('should reject reference_links array with more than 5 items', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      reference_links: Array(6).fill({ title: 'Test', url: 'https://example.com' }),
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid generated_at format', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      generated_at: 'invalid-date',
    })
    expect(result.success).toBe(false)
  })

  it('should accept empty reference_links array', () => {
    const result = EnrichmentSchema.safeParse({
      ...validEnrichment,
      reference_links: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('GenerateEnrichmentRequestSchema', () => {
  it('should accept valid UUID', () => {
    const result = GenerateEnrichmentRequestSchema.safeParse({
      entry_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUID', () => {
    const result = GenerateEnrichmentRequestSchema.safeParse({
      entry_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing entry_id', () => {
    const result = GenerateEnrichmentRequestSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('LLMEnrichmentResponseSchema', () => {
  it('should accept valid LLM response', () => {
    const result = LLMEnrichmentResponseSchema.safeParse({
      translation_ja: '日本語',
      translation_en: 'English',
      summary: 'A summary',
      examples: ['Example'],
      related_terms: ['Related'],
      reference_links: [{ title: 'Link', url: 'https://example.com' }],
    })
    expect(result.success).toBe(true)
  })

  it('should accept response with empty arrays', () => {
    const result = LLMEnrichmentResponseSchema.safeParse({
      translation_ja: '日本語',
      translation_en: 'English',
      summary: 'A summary',
      examples: [],
      related_terms: [],
      reference_links: [],
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing required fields', () => {
    const result = LLMEnrichmentResponseSchema.safeParse({
      translation_ja: '日本語',
      // missing other required fields
    })
    expect(result.success).toBe(false)
  })

  it('should accept reference_links with non-URL strings (LLM output)', () => {
    // LLMEnrichmentResponseSchema is more lenient than EnrichmentSchema
    const result = LLMEnrichmentResponseSchema.safeParse({
      translation_ja: '日本語',
      translation_en: 'English',
      summary: 'A summary',
      examples: ['Example'],
      related_terms: ['Related'],
      reference_links: [{ title: 'Link', url: 'possibly-invalid-url' }],
    })
    expect(result.success).toBe(true)
  })
})
