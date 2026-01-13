import { describe, it, expect } from 'vitest'
import {
  SrsRatingSchema,
  SubmitReviewSchema,
  StartReviewSessionSchema,
  GetDueEntriesQuerySchema,
} from '../review'

describe('SrsRatingSchema', () => {
  it('should accept rating 0 (Again)', () => {
    const result = SrsRatingSchema.safeParse(0)
    expect(result.success).toBe(true)
  })

  it('should accept rating 1 (Hard)', () => {
    const result = SrsRatingSchema.safeParse(1)
    expect(result.success).toBe(true)
  })

  it('should accept rating 2 (Good)', () => {
    const result = SrsRatingSchema.safeParse(2)
    expect(result.success).toBe(true)
  })

  it('should accept rating 3 (Easy)', () => {
    const result = SrsRatingSchema.safeParse(3)
    expect(result.success).toBe(true)
  })

  it('should reject rating -1', () => {
    const result = SrsRatingSchema.safeParse(-1)
    expect(result.success).toBe(false)
  })

  it('should reject rating 4', () => {
    const result = SrsRatingSchema.safeParse(4)
    expect(result.success).toBe(false)
  })

  it('should reject non-integer rating', () => {
    const result = SrsRatingSchema.safeParse(1.5)
    expect(result.success).toBe(false)
  })

  it('should reject string rating', () => {
    const result = SrsRatingSchema.safeParse('2')
    expect(result.success).toBe(false)
  })
})

describe('SubmitReviewSchema', () => {
  it('should accept valid review submission', () => {
    const result = SubmitReviewSchema.safeParse({ rating: 2 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rating).toBe(2)
    }
  })

  it('should reject missing rating', () => {
    const result = SubmitReviewSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject invalid rating value', () => {
    const result = SubmitReviewSchema.safeParse({ rating: 5 })
    expect(result.success).toBe(false)
  })
})

describe('StartReviewSessionSchema', () => {
  it('should use default limit when not provided', () => {
    const result = StartReviewSessionSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
    }
  })

  it('should accept valid session parameters', () => {
    const result = StartReviewSessionSchema.safeParse({
      deck_id: '123e4567-e89b-12d3-a456-426614174000',
      limit: 50,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deck_id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(result.data.limit).toBe(50)
    }
  })

  it('should accept null deck_id for all decks', () => {
    const result = StartReviewSessionSchema.safeParse({
      deck_id: null,
    })
    expect(result.success).toBe(true)
  })

  it('should coerce string limit to number', () => {
    const result = StartReviewSessionSchema.safeParse({
      limit: '30',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(30)
    }
  })

  it('should reject limit less than 1', () => {
    const result = StartReviewSessionSchema.safeParse({
      limit: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject limit greater than 100', () => {
    const result = StartReviewSessionSchema.safeParse({
      limit: 101,
    })
    expect(result.success).toBe(false)
  })
})

describe('GetDueEntriesQuerySchema', () => {
  it('should use default limit when not provided', () => {
    const result = GetDueEntriesQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
    }
  })

  it('should accept valid query parameters', () => {
    const result = GetDueEntriesQuerySchema.safeParse({
      deck_id: '123e4567-e89b-12d3-a456-426614174000',
      limit: 10,
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid deck_id format', () => {
    const result = GetDueEntriesQuerySchema.safeParse({
      deck_id: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('should coerce string limit to number', () => {
    const result = GetDueEntriesQuerySchema.safeParse({
      limit: '15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(15)
    }
  })

  it('should reject limit at boundary (0)', () => {
    const result = GetDueEntriesQuerySchema.safeParse({
      limit: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should accept limit at boundary (100)', () => {
    const result = GetDueEntriesQuerySchema.safeParse({
      limit: 100,
    })
    expect(result.success).toBe(true)
  })
})
