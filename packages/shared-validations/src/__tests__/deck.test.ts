import { describe, it, expect } from 'vitest'
import { CreateDeckSchema, UpdateDeckSchema } from '../deck'

describe('CreateDeckSchema', () => {
  it('should accept valid deck with name only', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'My Deck',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('My Deck')
    }
  })

  it('should accept valid deck with all fields', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'Technical Terms',
      description: 'A collection of technical vocabulary',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Technical Terms')
      expect(result.data.description).toBe('A collection of technical vocabulary')
    }
  })

  it('should reject empty name', () => {
    const result = CreateDeckSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Deck名を入力してください')
    }
  })

  it('should reject name exceeding 100 characters', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Deck名は100文字以内で入力してください')
    }
  })

  it('should reject description exceeding 500 characters', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'Test Deck',
      description: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('説明は500文字以内で入力してください')
    }
  })

  it('should accept null description', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'Test',
      description: null,
    })
    expect(result.success).toBe(true)
  })

  it('should accept name at boundary (100 characters)', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'a'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  it('should accept description at boundary (500 characters)', () => {
    const result = CreateDeckSchema.safeParse({
      name: 'Test',
      description: 'a'.repeat(500),
    })
    expect(result.success).toBe(true)
  })
})

describe('UpdateDeckSchema', () => {
  it('should accept partial update with name only', () => {
    const result = UpdateDeckSchema.safeParse({
      name: 'Updated Name',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Updated Name')
    }
  })

  it('should accept partial update with description only', () => {
    const result = UpdateDeckSchema.safeParse({
      description: 'New description',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('New description')
    }
  })

  it('should accept empty object (no updates)', () => {
    const result = UpdateDeckSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject empty name when provided', () => {
    const result = UpdateDeckSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject name exceeding 100 characters', () => {
    const result = UpdateDeckSchema.safeParse({
      name: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('should reject description exceeding 500 characters', () => {
    const result = UpdateDeckSchema.safeParse({
      description: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('should accept null to clear description', () => {
    const result = UpdateDeckSchema.safeParse({
      description: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
    }
  })

  it('should accept full update with all fields', () => {
    const result = UpdateDeckSchema.safeParse({
      name: 'New Name',
      description: 'New Description',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('New Name')
      expect(result.data.description).toBe('New Description')
    }
  })
})
