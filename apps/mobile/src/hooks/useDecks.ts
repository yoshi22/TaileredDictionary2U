import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Deck, CreateDeck } from '@td2u/shared-types'

interface UseDecksReturn {
  decks: Deck[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createDeck: (data: CreateDeck) => Promise<Deck | null>
  deleteDeck: (id: string) => Promise<boolean>
}

export function useDecks(): UseDecksReturn {
  const [decks, setDecks] = useState<Deck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDecks = useCallback(async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch decks with entry count
      const { data, error: queryError } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      // Get entry counts for each deck
      const deckIds = (data ?? []).map((d) => d.id)

      let entryCounts: Record<string, number> = {}

      if (deckIds.length > 0) {
        const { data: countData } = await supabase
          .from('entries')
          .select('deck_id')
          .in('deck_id', deckIds)

        // Count entries per deck
        entryCounts = (countData ?? []).reduce(
          (acc, entry) => {
            if (entry.deck_id) {
              acc[entry.deck_id] = (acc[entry.deck_id] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>
        )
      }

      const decksWithCount: Deck[] = (data ?? []).map((deck) => ({
        ...deck,
        entry_count: entryCounts[deck.id] || 0,
      }))

      setDecks(decksWithCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch decks'))
      console.error('Failed to fetch decks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const refresh = useCallback(async () => {
    await fetchDecks()
  }, [fetchDecks])

  const createDeck = useCallback(
    async (data: CreateDeck): Promise<Deck | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: deck, error: createError } = await supabase
          .from('decks')
          .insert({
            user_id: user.id,
            name: data.name,
            description: data.description ?? null,
          })
          .select()
          .single()

        if (createError) throw createError

        const newDeck: Deck = {
          ...deck,
          entry_count: 0,
        }

        // Add to local state
        setDecks((prev) => [newDeck, ...prev])

        return newDeck
      } catch (err) {
        console.error('Failed to create deck:', err)
        return null
      }
    },
    []
  )

  const deleteDeck = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('decks')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      setDecks((prev) => prev.filter((d) => d.id !== id))

      return true
    } catch (err) {
      console.error('Failed to delete deck:', err)
      return false
    }
  }, [])

  return {
    decks,
    isLoading,
    error,
    refresh,
    createDeck,
    deleteDeck,
  }
}
