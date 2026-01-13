import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  successResponse,
  handleApiError,
  errors,
  withRateLimit,
  getClientIdentifier,
} from '@/lib/api'
import { CsvImportOptionsSchema } from '@td2u/shared-validations'
import {
  parseCSV,
  CSV_MAX_FILE_SIZE,
  type CsvImportResult,
  type CsvRowError,
} from '@/lib/csv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH_SIZE = 50

/**
 * POST /api/entries/import
 * Import entries from CSV file
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    // Rate limit check
    const identifier = await getClientIdentifier(user.id)
    await withRateLimit('csvImport', identifier)

    const supabase = await createClient()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')
    const deckIdParam = formData.get('deck_id')
    const skipDuplicatesParam = formData.get('skip_duplicates')

    // Validate file
    if (!file || !(file instanceof File)) {
      throw errors.validationError({ file: ['CSV file is required'] })
    }

    // Check file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      throw errors.validationError({ file: ['File must be a CSV file'] })
    }

    // Check file size
    if (file.size > CSV_MAX_FILE_SIZE) {
      throw errors.validationError({
        file: [`File too large. Maximum size is ${CSV_MAX_FILE_SIZE / 1024 / 1024}MB`],
      })
    }

    // Parse options
    const optionsResult = CsvImportOptionsSchema.safeParse({
      deck_id: deckIdParam || undefined,
      skip_duplicates: skipDuplicatesParam === 'true',
    })

    if (!optionsResult.success) {
      throw errors.validationError(optionsResult.error.flatten())
    }

    const { deck_id: optionDeckId, skip_duplicates } = optionsResult.data

    // Verify deck ownership if specified
    if (optionDeckId) {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id')
        .eq('id', optionDeckId)
        .eq('user_id', user.id)
        .single()

      if (deckError || !deck) {
        throw errors.notFound('Deck')
      }
    }

    // Read and parse CSV
    const content = await file.text()
    const { rows, errors: parseErrors } = parseCSV(content)

    const result: CsvImportResult = {
      total: rows.length + parseErrors.length,
      imported: 0,
      skipped: 0,
      failed: parseErrors.length,
      errors: [...parseErrors],
    }

    if (rows.length === 0) {
      return successResponse(result)
    }

    // Get existing terms if skip_duplicates is enabled
    let existingTerms = new Set<string>()
    if (skip_duplicates) {
      const { data: existingEntries } = await supabase
        .from('entries')
        .select('term')
        .eq('user_id', user.id)

      if (existingEntries) {
        existingTerms = new Set(
          existingEntries.map((e) => e.term.toLowerCase())
        )
      }
    }

    // Validate deck_ids in rows
    const uniqueDeckIds = new Set<string>()
    for (const row of rows) {
      const deckId = row.deck_id || optionDeckId
      if (deckId) {
        uniqueDeckIds.add(deckId)
      }
    }

    // Verify all deck_ids belong to user
    const validDeckIds = new Set<string>()
    if (uniqueDeckIds.size > 0) {
      const { data: decks } = await supabase
        .from('decks')
        .select('id')
        .eq('user_id', user.id)
        .in('id', Array.from(uniqueDeckIds))

      if (decks) {
        for (const deck of decks) {
          validDeckIds.add(deck.id)
        }
      }
    }

    // Prepare entries for insertion
    const entriesToInsert: Array<{
      user_id: string
      term: string
      context: string | null
      deck_id: string | null
    }> = []

    const additionalErrors: CsvRowError[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 for 1-indexed and header row

      // Check for duplicates
      if (skip_duplicates && existingTerms.has(row.term.toLowerCase())) {
        result.skipped++
        continue
      }

      // Determine deck_id
      const deckId = row.deck_id || optionDeckId || null

      // Validate deck_id
      if (deckId && !validDeckIds.has(deckId)) {
        additionalErrors.push({
          row: rowNumber,
          term: row.term,
          message: 'Deck not found or does not belong to you',
          field: 'deck_id',
        })
        result.failed++
        continue
      }

      entriesToInsert.push({
        user_id: user.id,
        term: row.term,
        context: row.context || null,
        deck_id: deckId,
      })

      // Add to existing terms set to prevent duplicates within the same import
      if (skip_duplicates) {
        existingTerms.add(row.term.toLowerCase())
      }
    }

    result.errors.push(...additionalErrors)

    // Insert entries in batches
    for (let i = 0; i < entriesToInsert.length; i += BATCH_SIZE) {
      const batch = entriesToInsert.slice(i, i + BATCH_SIZE)

      const { data: insertedEntries, error: insertError } = await supabase
        .from('entries')
        .insert(batch)
        .select('id')

      if (insertError) {
        console.error('Batch insert error:', insertError)
        // Mark all entries in this batch as failed
        for (let j = 0; j < batch.length; j++) {
          const entry = batch[j]
          result.errors.push({
            row: i + j + 2, // Approximate row number
            term: entry.term,
            message: 'Database insert failed',
          })
          result.failed++
        }
      } else if (insertedEntries) {
        // Initialize SRS data for inserted entries
        const srsData = insertedEntries.map((entry) => ({
          entry_id: entry.id,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          due_date: new Date().toISOString(),
          last_reviewed_at: null,
        }))

        const { error: srsError } = await supabase
          .from('srs_data')
          .upsert(srsData)

        if (srsError) {
          console.error('SRS data insert error:', srsError)
          // Non-fatal error, entries are still created
        }

        result.imported += insertedEntries.length
      }
    }

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}
