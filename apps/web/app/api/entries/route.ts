import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  createdResponse,
  paginatedResponse,
  handleApiError,
  errors,
} from '@/lib/api'
import {
  CreateEntrySchema,
  GetEntriesQuerySchema,
} from '@td2u/shared-validations'

/**
 * GET /api/entries
 * Entryリストを取得
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    // クエリパラメータをパース
    const searchParams = request.nextUrl.searchParams
    const queryResult = GetEntriesQuerySchema.safeParse({
      deck_id: searchParams.get('deck_id') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      order: searchParams.get('order') ?? undefined,
    })

    if (!queryResult.success) {
      throw errors.validationError(queryResult.error.flatten())
    }

    const { deck_id, search, limit, offset, sort, order } = queryResult.data

    // entries + srs_data をJOINしてEntryWithSrsとして取得
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
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)

    // フィルタリング
    if (deck_id) {
      query = query.eq('deck_id', deck_id)
    }

    if (search) {
      query = query.ilike('term', `%${search}%`)
    }

    // ソート
    if (sort === 'due_date') {
      query = query.order('due_date', {
        ascending: order === 'asc',
        referencedTable: 'srs_data',
      })
    } else {
      query = query.order(sort, { ascending: order === 'asc' })
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw errors.internalError()
    }

    // レスポンス形式を整形
    // Note: Supabase returns joined tables as arrays
    const entries = (data ?? []).map((entry) => {
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
    })

    return paginatedResponse(entries, {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: count ?? 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/entries
 * 新規Entry作成
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    // リクエストボディをパース
    const body = await request.json()
    const result = CreateEntrySchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const { term, context, deck_id } = result.data

    // deck_idが指定されている場合、ユーザーのデッキか確認
    if (deck_id) {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id')
        .eq('id', deck_id)
        .eq('user_id', user.id)
        .single()

      if (deckError || !deck) {
        throw errors.notFound('Deck')
      }
    }

    // Entry作成
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        user_id: user.id,
        term,
        context: context ?? null,
        deck_id: deck_id ?? null,
      })
      .select()
      .single()

    if (entryError) {
      console.error('Entry creation error:', entryError)
      throw errors.internalError()
    }

    // SRSデータを初期化（トリガーで自動作成される場合もあるが、明示的に作成）
    const { error: srsError } = await supabase.from('srs_data').upsert({
      entry_id: entry.id,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      due_date: new Date().toISOString(),
      last_reviewed_at: null,
    })

    if (srsError) {
      console.error('SRS data creation error:', srsError)
      // SRSデータ作成失敗はログのみ、Entryは返す
    }

    return createdResponse(entry)
  } catch (error) {
    return handleApiError(error)
  }
}
