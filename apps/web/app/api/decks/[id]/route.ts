import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  successResponse,
  noContentResponse,
  handleApiError,
  errors,
} from '@/lib/api'
import { UpdateDeckSchema } from '@td2u/shared-validations'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/decks/[id]
 * Get deck details with entry count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = params

    const { data: deck, error } = await supabase
      .from('decks')
      .select('*, entries(count)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !deck) {
      throw errors.notFound('Deck')
    }

    // Format response
    const formattedDeck = {
      ...deck,
      entry_count: deck.entries?.[0]?.count ?? 0,
    }
    delete formattedDeck.entries

    return successResponse(formattedDeck)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/decks/[id]
 * Update deck
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = params

    const body = await request.json()
    const result = UpdateDeckSchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    // Check if deck exists and belongs to user
    const { data: existingDeck, error: fetchError } = await supabase
      .from('decks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDeck) {
      throw errors.notFound('Deck')
    }

    const { data: deck, error: updateError } = await supabase
      .from('decks')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Deck update error:', updateError)
      throw errors.internalError()
    }

    return successResponse(deck)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/decks/[id]
 * Delete deck (entries will have deck_id set to null)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = params

    // Check if deck exists and belongs to user
    const { data: existingDeck, error: fetchError } = await supabase
      .from('decks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDeck) {
      throw errors.notFound('Deck')
    }

    // Set deck_id to null for all entries in this deck
    await supabase
      .from('entries')
      .update({ deck_id: null })
      .eq('deck_id', id)

    // Delete deck
    const { error: deleteError } = await supabase
      .from('decks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Deck delete error:', deleteError)
      throw errors.internalError()
    }

    return noContentResponse()
  } catch (error) {
    return handleApiError(error)
  }
}
