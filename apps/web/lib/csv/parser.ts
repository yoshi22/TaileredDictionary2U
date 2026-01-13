/**
 * CSV Parser
 * Parse CSV content to objects with validation
 */

import {
  CsvRow,
  CsvRowError,
  CsvParseResult,
  CSV_IMPORT_COLUMNS,
  CSV_IMPORT_REQUIRED_COLUMNS,
  CSV_MAX_ROWS,
} from './types'

/**
 * Remove BOM (Byte Order Mark) from string
 */
function removeBOM(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }
  return content
}

/**
 * Parse a CSV line handling quoted fields
 * Supports: quoted fields, escaped quotes (""), newlines in quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true
      } else if (char === ',') {
        // Field separator
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  // Push last field
  result.push(current.trim())

  return result
}

/**
 * Split CSV content into lines, handling newlines within quoted fields
 */
function splitCSVLines(content: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Skip \r\n as single line break
      if (char === '\r' && content[i + 1] === '\n') {
        i++
      }
      if (current.trim()) {
        lines.push(current)
      }
      current = ''
    } else {
      current += char
    }
  }

  // Push last line
  if (current.trim()) {
    lines.push(current)
  }

  return lines
}

/**
 * Validate header row and return column indices
 */
function validateHeader(
  headerFields: string[]
): { indices: Map<string, number>; errors: string[] } {
  const indices = new Map<string, number>()
  const errors: string[] = []
  const normalizedFields = headerFields.map((f) => f.toLowerCase().trim())

  // Find indices for known columns
  for (const column of CSV_IMPORT_COLUMNS) {
    const index = normalizedFields.indexOf(column)
    if (index !== -1) {
      indices.set(column, index)
    }
  }

  // Check required columns
  for (const required of CSV_IMPORT_REQUIRED_COLUMNS) {
    if (!indices.has(required)) {
      errors.push(`Missing required column: ${required}`)
    }
  }

  return { indices, errors }
}

/**
 * Parse CSV content to CsvRow objects
 */
export function parseCSV(content: string): CsvParseResult {
  const rows: CsvRow[] = []
  const errors: CsvRowError[] = []

  // Remove BOM and normalize line endings
  const cleanContent = removeBOM(content)
  const lines = splitCSVLines(cleanContent)

  if (lines.length === 0) {
    errors.push({ row: 0, message: 'CSV file is empty' })
    return { rows, errors }
  }

  // Parse and validate header
  const headerFields = parseCSVLine(lines[0])
  const { indices, errors: headerErrors } = validateHeader(headerFields)

  if (headerErrors.length > 0) {
    for (const error of headerErrors) {
      errors.push({ row: 1, message: error })
    }
    return { rows, errors }
  }

  // Check row limit (excluding header)
  if (lines.length - 1 > CSV_MAX_ROWS) {
    errors.push({
      row: 0,
      message: `Too many rows. Maximum is ${CSV_MAX_ROWS}, got ${lines.length - 1}`,
    })
    return { rows, errors }
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1 // 1-indexed for user display
    const fields = parseCSVLine(lines[i])

    // Get field values by column name
    const termIndex = indices.get('term')!
    const term = fields[termIndex]?.trim() || ''

    const contextIndex = indices.get('context')
    const context =
      contextIndex !== undefined ? fields[contextIndex]?.trim() || null : null

    const deckIdIndex = indices.get('deck_id')
    const deckId =
      deckIdIndex !== undefined ? fields[deckIdIndex]?.trim() || null : null

    // Validate term (required)
    if (!term) {
      errors.push({
        row: rowNumber,
        message: 'Term is required',
        field: 'term',
      })
      continue
    }

    // Validate term length
    if (term.length > 200) {
      errors.push({
        row: rowNumber,
        term,
        message: 'Term must be 200 characters or less',
        field: 'term',
      })
      continue
    }

    // Validate context length
    if (context && context.length > 500) {
      errors.push({
        row: rowNumber,
        term,
        message: 'Context must be 500 characters or less',
        field: 'context',
      })
      continue
    }

    // Validate deck_id format (UUID)
    if (deckId && !isValidUUID(deckId)) {
      errors.push({
        row: rowNumber,
        term,
        message: 'Invalid deck_id format (must be UUID)',
        field: 'deck_id',
      })
      continue
    }

    rows.push({
      term,
      context,
      deck_id: deckId,
    })
  }

  return { rows, errors }
}

/**
 * Validate UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Generate sample CSV content for download template
 */
export function generateSampleCSV(): string {
  const header = CSV_IMPORT_COLUMNS.join(',')
  const sampleRows = [
    '"apple","a common fruit",""',
    '"dictionary","a book of words and definitions",""',
    '"programming","the process of writing code",""',
  ]

  return [header, ...sampleRows].join('\n')
}
