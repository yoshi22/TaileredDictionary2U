import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  successResponse,
  createdResponse,
  handleApiError,
  errors,
} from '@/lib/api'
import { CreateDeckSchema } from '@td2u/shared-validations'
import { NextRequest } from 'next/server'

/**
 * GET /api/decks
 * Deckリストを取得
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw errors.internalError()
    }

    return successResponse(data ?? [])
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/decks
 * 新規Deck作成
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    const body = await request.json()
    const result = CreateDeckSchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const { name, description } = result.data

    const { data: deck, error } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name,
        description: description ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Deck creation error:', error)
      throw errors.internalError()
    }

    return createdResponse(deck)
  } catch (error) {
    return handleApiError(error)
  }
}
