import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { EntryWithSrs, UpdateEntry, Enrichment } from '@td2u/shared-types'

interface UseEntryReturn {
  entry: EntryWithSrs | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  updateEntry: (data: UpdateEntry) => Promise<boolean>
  deleteEntry: () => Promise<boolean>
  generateEnrichment: () => Promise<boolean>
}

export function useEntry(entryId: string | undefined): UseEntryReturn {
  const [entry, setEntry] = useState<EntryWithSrs | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEntry = useCallback(async () => {
    if (!entryId) {
      setEntry(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: queryError } = await supabase
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
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          throw new Error('Entry not found')
        }
        throw queryError
      }

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

      const row = data as EntryRow
      const srsData = Array.isArray(row.srs_data)
        ? row.srs_data[0]
        : row.srs_data
      const deck = Array.isArray(row.decks) ? row.decks[0] : row.decks

      const formattedEntry: EntryWithSrs = {
        id: row.id,
        user_id: row.user_id,
        deck_id: row.deck_id,
        term: row.term,
        context: row.context,
        enrichment: row.enrichment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ease_factor: srsData?.ease_factor ?? 2.5,
        interval_days: srsData?.interval_days ?? 0,
        repetitions: srsData?.repetitions ?? 0,
        due_date: srsData?.due_date ?? row.created_at,
        last_reviewed_at: srsData?.last_reviewed_at ?? null,
        deck_name: deck?.name ?? null,
      }

      setEntry(formattedEntry)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch entry'))
      setEntry(null)
      console.error('Failed to fetch entry:', err)
    } finally {
      setIsLoading(false)
    }
  }, [entryId])

  useEffect(() => {
    fetchEntry()
  }, [fetchEntry])

  const refresh = useCallback(async () => {
    await fetchEntry()
  }, [fetchEntry])

  const updateEntry = useCallback(
    async (data: UpdateEntry): Promise<boolean> => {
      if (!entryId || !entry) return false

      try {
        const updateData: Record<string, unknown> = {}
        if (data.term !== undefined) updateData.term = data.term
        if (data.context !== undefined) updateData.context = data.context
        if (data.deck_id !== undefined) updateData.deck_id = data.deck_id

        const { error: updateError } = await supabase
          .from('entries')
          .update(updateData)
          .eq('id', entryId)

        if (updateError) throw updateError

        // Update local state
        setEntry((prev) =>
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
        console.error('Failed to update entry:', err)
        return false
      }
    },
    [entryId, entry]
  )

  const deleteEntry = useCallback(async (): Promise<boolean> => {
    if (!entryId) return false

    try {
      const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)

      if (deleteError) throw deleteError

      setEntry(null)
      return true
    } catch (err) {
      console.error('Failed to delete entry:', err)
      return false
    }
  }, [entryId])

  const generateEnrichment = useCallback(async (): Promise<boolean> => {
    if (!entryId || !entry) return false

    try {
      // Get the API base URL from environment
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL

      if (!apiBaseUrl) {
        console.warn('API base URL not configured')
        return false
      }

      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      // Call enrichment API
      const response = await fetch(`${apiBaseUrl}/api/enrichment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          entry_id: entryId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate enrichment')
      }

      // Refresh entry to get updated enrichment
      await fetchEntry()
      return true
    } catch (err) {
      console.error('Failed to generate enrichment:', err)
      return false
    }
  }, [entryId, entry, fetchEntry])

  return {
    entry,
    isLoading,
    error,
    refresh,
    updateEntry,
    deleteEntry,
    generateEnrichment,
  }
}
