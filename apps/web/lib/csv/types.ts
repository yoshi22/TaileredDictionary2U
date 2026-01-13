/**
 * CSV Types
 * CSV import/export related type definitions
 */

/**
 * CSV parse result for a single row
 */
export interface CsvRow {
  term: string
  context?: string | null
  deck_id?: string | null
}

/**
 * CSV parse error with row information
 */
export interface CsvRowError {
  row: number
  term?: string
  message: string
  field?: string
}

/**
 * Result of CSV parsing
 */
export interface CsvParseResult {
  rows: CsvRow[]
  errors: CsvRowError[]
}

/**
 * Import options for CSV
 */
export interface CsvImportOptions {
  deckId?: string | null
  skipDuplicates?: boolean
}

/**
 * Import result
 */
export interface CsvImportResult {
  total: number
  imported: number
  skipped: number
  failed: number
  errors: CsvRowError[]
}

/**
 * Entry data for export
 */
export interface CsvExportEntry {
  term: string
  context: string | null
  deck_name: string | null
  translation_ja: string | null
  translation_en: string | null
  summary: string | null
  examples: string[] | null
  related_terms: string[] | null
}

/**
 * Export options
 */
export interface CsvExportOptions {
  deckId?: string
  includeEnrichment?: boolean
}

/**
 * CSV column definitions for export
 */
export const CSV_EXPORT_COLUMNS = [
  'term',
  'context',
  'deck_name',
  'translation_ja',
  'translation_en',
  'summary',
  'examples',
  'related_terms',
] as const

/**
 * Required columns for import
 */
export const CSV_IMPORT_REQUIRED_COLUMNS = ['term'] as const

/**
 * Optional columns for import
 */
export const CSV_IMPORT_OPTIONAL_COLUMNS = ['context', 'deck_id'] as const

/**
 * All valid import columns
 */
export const CSV_IMPORT_COLUMNS = [
  ...CSV_IMPORT_REQUIRED_COLUMNS,
  ...CSV_IMPORT_OPTIONAL_COLUMNS,
] as const

/**
 * Maximum file size for import (5MB)
 */
export const CSV_MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Maximum number of rows for import
 */
export const CSV_MAX_ROWS = 500

/**
 * Delimiter for array fields in export
 */
export const CSV_ARRAY_DELIMITER = '|'
