import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  successResponse,
  noContentResponse,
  handleApiError,
  errors,
} from '@/lib/api'
import { UpdateEntrySchema } from '@td2u/shared-validations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/entries/[id]
 * Entry詳細取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = params

    const { data: entry, error } = await supabase
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !entry) {
      throw errors.notFound('Entry')
    }

    // レスポンス形式を整形
    // Note: Supabase returns joined tables as arrays
    const srsData = Array.isArray(entry.srs_data)
      ? entry.srs_data[0]
      : entry.srs_data
    const deck = Array.isArray(entry.decks) ? entry.decks[0] : entry.decks

    const formattedEntry = {
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
      due_date: srsData?.due_date ?? entry.created_at,
      last_reviewed_at: srsData?.last_reviewed_at ?? null,
      deck_name: deck?.name ?? null,
    }

    return successResponse(formattedEntry)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/entries/[id]
 * Entry更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = params

    // リクエストボディをパース
    const body = await request.json()
    const result = UpdateEntrySchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const updateData = result.data

    // 更新対象のEntryが存在し、ユーザーのものか確認
    const { data: existingEntry, error: fetchError } = await supabase
      .from('entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingEntry) {
      throw errors.notFound('Entry')
    }

    // deck_idが指定されている場合、ユーザーのデッキか確認
    if (updateData.deck_id) {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id')
        .eq('id', updateData.deck_id)
        .eq('user_id', user.id)
        .single()

      if (deckError || !deck) {
        throw errors.notFound('Deck')
      }
    }

    // Entry更新
    const { data: entry, error: updateError } = await supabase
      .from('entries')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
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
      .single()

    if (updateError || !entry) {
      console.error('Entry update error:', updateError)
      throw errors.internalError()
    }

    // レスポンス形式を整形
    // Note: Supabase returns joined tables as arrays
    const srsDataUpdated = Array.isArray(entry.srs_data)
      ? entry.srs_data[0]
      : entry.srs_data
    const deckUpdated = Array.isArray(entry.decks)
      ? entry.decks[0]
      : entry.decks

    const formattedEntry = {
      id: entry.id,
      user_id: entry.user_id,
      deck_id: entry.deck_id,
      term: entry.term,
      context: entry.context,
      enrichment: entry.enrichment,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      ease_factor: srsDataUpdated?.ease_factor ?? 2.5,
      interval_days: srsDataUpdated?.interval_days ?? 0,
      repetitions: srsDataUpdated?.repetitions ?? 0,
      due_date: srsDataUpdated?.due_date ?? entry.created_at,
      last_reviewed_at: srsDataUpdated?.last_reviewed_at ?? null,
      deck_name: deckUpdated?.name ?? null,
    }

    return successResponse(formattedEntry)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/entries/[id]
 * Entry削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { id } = params

    // 削除対象のEntryが存在し、ユーザーのものか確認
    const { data: existingEntry, error: fetchError } = await supabase
      .from('entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingEntry) {
      throw errors.notFound('Entry')
    }

    // 関連するSRSデータも削除（カスケード削除が設定されていない場合）
    await supabase.from('srs_data').delete().eq('entry_id', id)

    // Entry削除
    const { error: deleteError } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Entry delete error:', deleteError)
      throw errors.internalError()
    }

    return noContentResponse()
  } catch (error) {
    return handleApiError(error)
  }
}
