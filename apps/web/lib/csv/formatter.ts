/**
 * CSV Formatter
 * Format entries to CSV for export
 */

import type { EntryWithSrs, Enrichment } from '@td2u/shared-types'
import { CSV_EXPORT_COLUMNS, CSV_ARRAY_DELIMITER } from './types'

/**
 * Escape a field value for CSV
 * - Wrap in quotes if contains comma, quote, or newline
 * - Escape internal quotes by doubling them
 */
function escapeField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // Check if escaping is needed
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Format array field to string with delimiter
 */
function formatArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) {
    return ''
  }
  return arr.join(CSV_ARRAY_DELIMITER)
}

/**
 * Extract enrichment fields safely
 */
function extractEnrichmentFields(enrichment: Enrichment | null): {
  translation_ja: string
  translation_en: string
  summary: string
  examples: string
  related_terms: string
} {
  if (!enrichment) {
    return {
      translation_ja: '',
      translation_en: '',
      summary: '',
      examples: '',
      related_terms: '',
    }
  }

  return {
    translation_ja: enrichment.translation_ja || '',
    translation_en: enrichment.translation_en || '',
    summary: enrichment.summary || '',
    examples: formatArray(enrichment.examples),
    related_terms: formatArray(enrichment.related_terms),
  }
}

/**
 * Format a single entry to CSV row
 */
function formatEntryRow(entry: EntryWithSrs): string {
  const enrichmentFields = extractEnrichmentFields(entry.enrichment)

  const fields = [
    escapeField(entry.term),
    escapeField(entry.context),
    escapeField(entry.deck_name),
    escapeField(enrichmentFields.translation_ja),
    escapeField(enrichmentFields.translation_en),
    escapeField(enrichmentFields.summary),
    escapeField(enrichmentFields.examples),
    escapeField(enrichmentFields.related_terms),
  ]

  return fields.join(',')
}

/**
 * Format entries array to CSV string
 */
export function formatEntriesToCSV(entries: EntryWithSrs[]): string {
  // Create header row
  const header = CSV_EXPORT_COLUMNS.join(',')

  // Create data rows
  const dataRows = entries.map(formatEntryRow)

  // Combine with newlines
  return [header, ...dataRows].join('\n')
}

/**
 * Generate filename for CSV export
 */
export function generateExportFilename(deckName?: string | null): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const baseName = deckName
    ? `td2u-${sanitizeFilename(deckName)}`
    : 'td2u-entries'

  return `${baseName}-${timestamp}.csv`
}

/**
 * Sanitize string for use in filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

/**
 * Add BOM for Excel compatibility (UTF-8 with BOM)
 */
export function addBOM(content: string): string {
  return '\ufeff' + content
}
