import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  handleApiError,
  errors,
  withRateLimit,
  getClientIdentifier,
} from '@/lib/api'
import { CsvExportQuerySchema } from '@td2u/shared-validations'
import {
  formatEntriesToCSV,
  generateExportFilename,
  addBOM,
} from '@/lib/csv'
import type { EntryWithSrs, Enrichment } from '@td2u/shared-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/entries/export
 * Export entries as CSV file
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()

    // Rate limit check
    const identifier = await getClientIdentifier(user.id)
    await withRateLimit('csvExport', identifier)

    const supabase = await createClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = CsvExportQuerySchema.safeParse({
      deck_id: searchParams.get('deck_id') ?? undefined,
    })

    if (!queryResult.success) {
      throw errors.validationError(queryResult.error.flatten())
    }

    const { deck_id } = queryResult.data

    // Verify deck ownership if specified
    let deckName: string | null = null
    if (deck_id) {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id, name')
        .eq('id', deck_id)
        .eq('user_id', user.id)
        .single()

      if (deckError || !deck) {
        throw errors.notFound('Deck')
      }

      deckName = deck.name
    }

    // Fetch all entries (with SRS data) for export
    let query = supabase
      .from('entries')
      .select(
        `
        id,
        user_id,
        deck_id,
        term,
        context,
        enrichment,
        created_at,
        updated_at,
        srs_data (
          ease_factor,
          interval_days,
          repetitions,
          due_date,
          last_reviewed_at
        ),
        decks (
          name
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by deck if specified
    if (deck_id) {
      query = query.eq('deck_id', deck_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw errors.internalError()
    }

    // Transform to EntryWithSrs format
    const entries: EntryWithSrs[] = (data ?? []).map((entry) => {
      const srsData = Array.isArray(entry.srs_data)
        ? entry.srs_data[0]
        : entry.srs_data
      const deck = Array.isArray(entry.decks) ? entry.decks[0] : entry.decks

      return {
        id: entry.id,
        user_id: entry.user_id,
        deck_id: entry.deck_id,
        term: entry.term,
        context: entry.context,
        enrichment: entry.enrichment as Enrichment | null,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        ease_factor: srsData?.ease_factor ?? 2.5,
        interval_days: srsData?.interval_days ?? 0,
        repetitions: srsData?.repetitions ?? 0,
        due_date: srsData?.due_date ?? entry.created_at,
        last_reviewed_at: srsData?.last_reviewed_at ?? null,
        deck_name: deck?.name ?? null,
      }
    })

    // Format to CSV
    const csvContent = formatEntriesToCSV(entries)
    const csvWithBOM = addBOM(csvContent)

    // Generate filename
    const filename = generateExportFilename(deckName)

    // Return CSV response
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
