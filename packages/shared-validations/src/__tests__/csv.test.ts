import { describe, it, expect } from 'vitest'
import {
  CsvRowSchema,
  CsvImportOptionsSchema,
  CsvExportQuerySchema,
} from '../csv'

describe('CsvRowSchema', () => {
  describe('valid data', () => {
    it('should accept minimal valid row with only term', () => {
      const result = CsvRowSchema.safeParse({ term: 'test term' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.term).toBe('test term')
        expect(result.data.context).toBeNull()
        expect(result.data.deck_id).toBeNull()
      }
    })

    it('should accept row with term and context', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test term',
        context: 'test context',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.term).toBe('test term')
        expect(result.data.context).toBe('test context')
      }
    })

    it('should accept row with all fields', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test term',
        context: 'test context',
        deck_id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.deck_id).toBe('123e4567-e89b-12d3-a456-426614174000')
      }
    })

    it('should transform empty context to null', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test term',
        context: '',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.context).toBeNull()
      }
    })

    it('should transform null context to null', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test term',
        context: null,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.context).toBeNull()
      }
    })

    it('should accept term at max length (200)', () => {
      const result = CsvRowSchema.safeParse({
        term: 'a'.repeat(200),
      })
      expect(result.success).toBe(true)
    })

    it('should accept context at max length (500)', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test',
        context: 'a'.repeat(500),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid data', () => {
    it('should reject missing term', () => {
      const result = CsvRowSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject empty term', () => {
      const result = CsvRowSchema.safeParse({ term: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Term is required')
      }
    })

    it('should reject term exceeding max length', () => {
      const result = CsvRowSchema.safeParse({
        term: 'a'.repeat(201),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Term must be 200 characters or less')
      }
    })

    it('should reject context exceeding max length', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test',
        context: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Context must be 500 characters or less')
      }
    })

    it('should reject invalid deck_id format', () => {
      const result = CsvRowSchema.safeParse({
        term: 'test',
        deck_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid deck_id format')
      }
    })
  })
})

describe('CsvImportOptionsSchema', () => {
  describe('valid data', () => {
    it('should accept empty options', () => {
      const result = CsvImportOptionsSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skip_duplicates).toBe(false)
      }
    })

    it('should accept valid deck_id', () => {
      const result = CsvImportOptionsSchema.safeParse({
        deck_id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should accept skip_duplicates true', () => {
      const result = CsvImportOptionsSchema.safeParse({
        skip_duplicates: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skip_duplicates).toBe(true)
      }
    })

    it('should coerce string "true" to boolean', () => {
      const result = CsvImportOptionsSchema.safeParse({
        skip_duplicates: 'true',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skip_duplicates).toBe(true)
      }
    })

    it('should coerce any non-empty string to true (JS truthy behavior)', () => {
      // Note: z.coerce.boolean() uses JavaScript truthy coercion
      // Any non-empty string (including "false") becomes true
      const result = CsvImportOptionsSchema.safeParse({
        skip_duplicates: 'anything',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skip_duplicates).toBe(true)
      }
    })

    it('should accept null deck_id', () => {
      const result = CsvImportOptionsSchema.safeParse({
        deck_id: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid data', () => {
    it('should reject invalid deck_id', () => {
      const result = CsvImportOptionsSchema.safeParse({
        deck_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('CsvExportQuerySchema', () => {
  describe('valid data', () => {
    it('should accept empty query', () => {
      const result = CsvExportQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept valid deck_id', () => {
      const result = CsvExportQuerySchema.safeParse({
        deck_id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.deck_id).toBe('123e4567-e89b-12d3-a456-426614174000')
      }
    })
  })

  describe('invalid data', () => {
    it('should reject invalid deck_id', () => {
      const result = CsvExportQuerySchema.safeParse({
        deck_id: 'invalid-uuid',
      })
      expect(result.success).toBe(false)
    })
  })
})
