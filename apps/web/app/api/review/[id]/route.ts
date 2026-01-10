import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, successResponse, handleApiError, errors } from '@/lib/api'
import { SubmitReviewSchema } from '@td2u/shared-validations'
import { SrsCalculator } from '@td2u/shared-srs'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/review/[id]
 * Submit review result for an entry
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = await params

    // Parse and validate request
    const body = await request.json()
    const result = SubmitReviewSchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const { rating } = result.data

    // Fetch entry with SRS data
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select(
        `
        id,
        srs_data (
          id,
          ease_factor,
          interval_days,
          repetitions,
          due_date,
          last_reviewed_at
        )
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      throw errors.notFound('Entry')
    }

    // Get current SRS state
    const srsData = Array.isArray(entry.srs_data)
      ? entry.srs_data[0]
      : entry.srs_data

    const currentState = {
      easeFactor: srsData?.ease_factor ?? 2.5,
      intervalDays: srsData?.interval_days ?? 0,
      repetitions: srsData?.repetitions ?? 0,
    }

    // Calculate new SRS state
    const calculator = new SrsCalculator()
    const newState = calculator.calculate({
      currentState,
      rating,
      reviewedAt: new Date(),
    })

    // Update SRS data
    const { error: updateError } = await supabase
      .from('srs_data')
      .upsert({
        entry_id: id,
        ease_factor: newState.ease_factor,
        interval_days: newState.interval_days,
        repetitions: newState.repetitions,
        due_date: newState.due_date.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error('SRS update error:', updateError)
      throw errors.internalError()
    }

    return successResponse({
      entry_id: id,
      rating,
      new_state: {
        ease_factor: newState.ease_factor,
        interval_days: newState.interval_days,
        repetitions: newState.repetitions,
        due_date: newState.due_date.toISOString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
