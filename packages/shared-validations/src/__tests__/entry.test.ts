import { describe, it, expect } from 'vitest'
import { CreateEntrySchema, UpdateEntrySchema, GetEntriesQuerySchema } from '../entry'

describe('CreateEntrySchema', () => {
  it('should accept valid input with term only', () => {
    const result = CreateEntrySchema.safeParse({
      term: 'machine learning',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.term).toBe('machine learning')
    }
  })

  it('should accept valid input with all fields', () => {
    const result = CreateEntrySchema.safeParse({
      term: 'API',
      context: 'In web development',
      deck_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.term).toBe('API')
      expect(result.data.context).toBe('In web development')
      expect(result.data.deck_id).toBe('123e4567-e89b-12d3-a456-426614174000')
    }
  })

  it('should reject empty term', () => {
    const result = CreateEntrySchema.safeParse({
      term: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('用語を入力してください')
    }
  })

  it('should reject term exceeding 200 characters', () => {
    const result = CreateEntrySchema.safeParse({
      term: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('用語は200文字以内で入力してください')
    }
  })

  it('should reject context exceeding 500 characters', () => {
    const result = CreateEntrySchema.safeParse({
      term: 'test',
      context: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('文脈は500文字以内で入力してください')
    }
  })

  it('should reject invalid deck_id format', () => {
    const result = CreateEntrySchema.safeParse({
      term: 'test',
      deck_id: 'invalid-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should accept null context and deck_id', () => {
    const result = CreateEntrySchema.safeParse({
      term: 'test',
      context: null,
      deck_id: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('UpdateEntrySchema', () => {
  it('should accept partial update with term only', () => {
    const result = UpdateEntrySchema.safeParse({
      term: 'updated term',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.term).toBe('updated term')
    }
  })

  it('should accept empty object (no updates)', () => {
    const result = UpdateEntrySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject empty term when provided', () => {
    const result = UpdateEntrySchema.safeParse({
      term: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid deck_id when provided', () => {
    const result = UpdateEntrySchema.safeParse({
      deck_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should accept null to clear optional fields', () => {
    const result = UpdateEntrySchema.safeParse({
      context: null,
      deck_id: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('GetEntriesQuerySchema', () => {
  it('should use default values when no input provided', () => {
    const result = GetEntriesQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.offset).toBe(0)
      expect(result.data.sort).toBe('created_at')
      expect(result.data.order).toBe('desc')
    }
  })

  it('should accept valid query parameters', () => {
    const result = GetEntriesQuerySchema.safeParse({
      deck_id: '123e4567-e89b-12d3-a456-426614174000',
      search: 'test',
      limit: 50,
      offset: 10,
      sort: 'term',
      order: 'asc',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
      expect(result.data.sort).toBe('term')
      expect(result.data.order).toBe('asc')
    }
  })

  it('should coerce string numbers to integers', () => {
    const result = GetEntriesQuerySchema.safeParse({
      limit: '30',
      offset: '5',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(30)
      expect(result.data.offset).toBe(5)
    }
  })

  it('should reject limit less than 1', () => {
    const result = GetEntriesQuerySchema.safeParse({
      limit: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject limit greater than 100', () => {
    const result = GetEntriesQuerySchema.safeParse({
      limit: 101,
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid sort value', () => {
    const result = GetEntriesQuerySchema.safeParse({
      sort: 'invalid_sort',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid order value', () => {
    const result = GetEntriesQuerySchema.safeParse({
      order: 'random',
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative offset', () => {
    const result = GetEntriesQuerySchema.safeParse({
      offset: -1,
    })
    expect(result.success).toBe(false)
  })
})
