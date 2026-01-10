'use client'

import useSWR from 'swr'
import type { Deck } from '@td2u/shared-types'

interface UseDecksResult {
  decks: Deck[]
  loading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch decks')
  }
  const json = await res.json()
  return json.data || []
}

export function useDecks(): UseDecksResult {
  const { data, error, isLoading, mutate } = useSWR<Deck[]>(
    '/api/decks',
    fetcher
  )

  return {
    decks: data ?? [],
    loading: isLoading,
    error: error ?? null,
    mutate,
  }
}
