import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, successResponse, handleApiError, errors } from '@/lib/api'
import { GetDueEntriesQuerySchema } from '@td2u/shared-validations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/review/due
 * Get entries due for review
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const queryResult = GetDueEntriesQuerySchema.safeParse({
      deck_id: searchParams.get('deck_id') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    if (!queryResult.success) {
      throw errors.validationError(queryResult.error.flatten())
    }

    const { deck_id, limit } = queryResult.data
    const now = new Date().toISOString()

    // Build query for due entries
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

    // Filter by deck if specified
    if (deck_id) {
      query = query.eq('deck_id', deck_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw errors.internalError()
    }

    // Filter entries that are due (due_date <= now) and format
    const dueEntries = (data ?? [])
      .map((entry) => {
        const srsData = Array.isArray(entry.srs_data)
          ? entry.srs_data[0]
          : entry.srs_data
        const deck = Array.isArray(entry.decks) ? entry.decks[0] : entry.decks
        const dueDate = srsData?.due_date ?? entry.created_at

        return {
          id: entry.id,
          user_id: entry.user_id,
          deck_id: entry.deck_id,
          term: entry.term,
          context: entry.context,
          enrichment: entry.enrichment,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          ease_factor: srsData?.ease_factor ?? 2.5,
          interval_days: srsData?.interval_days ?? 0,
          repetitions: srsData?.repetitions ?? 0,
          due_date: dueDate,
          last_reviewed_at: srsData?.last_reviewed_at ?? null,
          deck_name: deck?.name ?? null,
        }
      })
      .filter((entry) => new Date(entry.due_date) <= new Date(now))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, limit)

    return successResponse({
      entries: dueEntries,
      total: dueEntries.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
