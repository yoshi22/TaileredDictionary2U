import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Deck, UpdateDeck, EntryWithSrs, Enrichment } from '@td2u/shared-types'

interface DeckWithEntries extends Deck {
  entries: EntryWithSrs[]
}

interface UseDeckReturn {
  deck: DeckWithEntries | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  updateDeck: (data: UpdateDeck) => Promise<boolean>
  deleteDeck: () => Promise<boolean>
}

export function useDeck(deckId: string | undefined): UseDeckReturn {
  const [deck, setDeck] = useState<DeckWithEntries | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDeck = useCallback(async () => {
    if (!deckId) {
      setDeck(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch deck
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single()

      if (deckError) {
        if (deckError.code === 'PGRST116') {
          throw new Error('Deck not found')
        }
        throw deckError
      }

      // Fetch entries in this deck
      const { data: entriesData, error: entriesError } = await supabase
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
          )
        `
        )
        .eq('deck_id', deckId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (entriesError) throw entriesError

      // Format entries
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
      }

      const entries: EntryWithSrs[] = ((entriesData as EntryRow[]) ?? []).map(
        (entry) => {
          const srsData = Array.isArray(entry.srs_data)
            ? entry.srs_data[0]
            : entry.srs_data

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
            deck_name: deckData.name,
          }
        }
      )

      setDeck({
        ...deckData,
        entry_count: entries.length,
        entries,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch deck'))
      setDeck(null)
      console.error('Failed to fetch deck:', err)
    } finally {
      setIsLoading(false)
    }
  }, [deckId])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  const refresh = useCallback(async () => {
    await fetchDeck()
  }, [fetchDeck])

  const updateDeck = useCallback(
    async (data: UpdateDeck): Promise<boolean> => {
      if (!deckId || !deck) return false

      try {
        const updateData: Record<string, unknown> = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description

        const { error: updateError } = await supabase
          .from('decks')
          .update(updateData)
          .eq('id', deckId)

        if (updateError) throw updateError

        // Update local state
        setDeck((prev) =>
          prev
            ? {
                ...prev,
                ...updateData,
                updated_at: new Date().toISOString(),
              }
            : null
        )

        return true
      } catch (err) {
        console.error('Failed to update deck:', err)
        return false
      }
    },
    [deckId, deck]
  )

  const deleteDeck = useCallback(async (): Promise<boolean> => {
    if (!deckId) return false

    try {
      const { error: deleteError } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)

      if (deleteError) throw deleteError

      setDeck(null)
      return true
    } catch (err) {
      console.error('Failed to delete deck:', err)
      return false
    }
  }, [deckId])

  return {
    deck,
    isLoading,
    error,
    refresh,
    updateDeck,
    deleteDeck,
  }
}
