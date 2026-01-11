'use client'

import useSWR from 'swr'
import type { Deck } from '@td2u/shared-types'

interface DeckWithCount extends Deck {
  entry_count: number
}

interface UseDeckResult {
  deck: DeckWithCount | null
  loading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()

  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Failed to parse response: ${res.status}`)
  }

  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`)
  }

  return json.data
}

export function useDeck(id: string | null): UseDeckResult {
  const { data, error, isLoading, mutate } = useSWR<DeckWithCount>(
    id ? `/api/decks/${id}` : null,
    fetcher
  )

  return {
    deck: data ?? null,
    loading: isLoading,
    error: error ?? null,
    mutate,
  }
}
