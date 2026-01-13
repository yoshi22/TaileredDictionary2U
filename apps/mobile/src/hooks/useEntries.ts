import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { EntryWithSrs, CreateEntry, Enrichment } from '@td2u/shared-types'

interface UseEntriesOptions {
  deckId?: string | null
  search?: string
  limit?: number
  offset?: number
  sort?: 'created_at' | 'term' | 'due_date'
  order?: 'asc' | 'desc'
}

interface UseEntriesReturn {
  entries: EntryWithSrs[]
  isLoading: boolean
  error: Error | null
  total: number
  refresh: () => Promise<void>
  createEntry: (data: CreateEntry) => Promise<EntryWithSrs | null>
  deleteEntry: (id: string) => Promise<boolean>
  hasMore: boolean
  loadMore: () => Promise<void>
}

export function useEntries(options: UseEntriesOptions = {}): UseEntriesReturn {
  const {
    deckId,
    search,
    limit = 20,
    offset = 0,
    sort = 'created_at',
    order = 'desc',
  } = options

  const [entries, setEntries] = useState<EntryWithSrs[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(offset)

  const fetchEntries = useCallback(
    async (loadMore = false) => {
      try {
        if (!loadMore) {
          setIsLoading(true)
          setCurrentOffset(offset)
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Build query
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

        // Apply filters
        if (deckId) {
          query = query.eq('deck_id', deckId)
        }

        if (search) {
          const searchPattern = `%${search}%`
          query = query.or(
            `term.ilike.${searchPattern},context.ilike.${searchPattern}`
          )
        }

        // Apply sorting
        if (sort === 'due_date') {
          query = query.order('due_date', {
            ascending: order === 'asc',
            referencedTable: 'srs_data',
          })
        } else {
          query = query.order(sort, { ascending: order === 'asc' })
        }

        // Apply pagination
        const fetchOffset = loadMore ? currentOffset + limit : offset
        query = query.range(fetchOffset, fetchOffset + limit - 1)

        const { data, error: queryError, count } = await query

        if (queryError) throw queryError

        // Format response
        type EntryRow = {
          id: string
          user_id: string
          deck_id: string | null
          term: string
          context: string | null
          enrichment: Enrichment | null
          created_at: string
          updated_at: string
          srs_data:
            | {
                ease_factor: number
                interval_days: number
                repetitions: number
                due_date: string
                last_reviewed_at: string | null
              }[]
            | {
                ease_factor: number
                interval_days: number
                repetitions: number
                due_date: string
                last_reviewed_at: string | null
              }
            | null
          decks: { name: string }[] | { name: string } | null
        }

        const formattedEntries: EntryWithSrs[] = ((data as EntryRow[]) ?? []).map(
          (entry) => {
            const srsData = Array.isArray(entry.srs_data)
              ? entry.srs_data[0]
              : entry.srs_data
            const deck = Array.isArray(entry.decks)
              ? entry.decks[0]
              : entry.decks

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
          }
        )

        if (loadMore) {
          setEntries((prev) => [...prev, ...formattedEntries])
          setCurrentOffset(fetchOffset)
        } else {
          setEntries(formattedEntries)
        }

        setTotal(count ?? 0)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch entries'))
        console.error('Failed to fetch entries:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [deckId, search, limit, offset, sort, order, currentOffset]
  )

  // Initial fetch and refetch on options change
  useEffect(() => {
    fetchEntries()
  }, [deckId, search, sort, order])

  const refresh = useCallback(async () => {
    await fetchEntries()
  }, [fetchEntries])

  const loadMore = useCallback(async () => {
    await fetchEntries(true)
  }, [fetchEntries])

  const createEntry = useCallback(
    async (data: CreateEntry): Promise<EntryWithSrs | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Create entry
        const { data: entry, error: createError } = await supabase
          .from('entries')
          .insert({
            user_id: user.id,
            term: data.term,
            context: data.context ?? null,
            deck_id: data.deck_id ?? null,
          })
          .select()
          .single()

        if (createError) throw createError

        // Initialize SRS data
        const { error: srsError } = await supabase.from('srs_data').upsert({
          entry_id: entry.id,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          due_date: new Date().toISOString(),
          last_reviewed_at: null,
        })

        if (srsError) {
          console.warn('SRS data creation error:', srsError)
        }

        const newEntry: EntryWithSrs = {
          ...entry,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          due_date: new Date().toISOString(),
          last_reviewed_at: null,
          deck_name: null,
        }

        // Add to local state
        setEntries((prev) => [newEntry, ...prev])
        setTotal((prev) => prev + 1)

        return newEntry
      } catch (err) {
        console.error('Failed to create entry:', err)
        return null
      }
    },
    []
  )

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      setEntries((prev) => prev.filter((e) => e.id !== id))
      setTotal((prev) => prev - 1)

      return true
    } catch (err) {
      console.error('Failed to delete entry:', err)
      return false
    }
  }, [])

  return {
    entries,
    isLoading,
    error,
    total,
    refresh,
    createEntry,
    deleteEntry,
    hasMore: entries.length < total,
    loadMore,
  }
}
