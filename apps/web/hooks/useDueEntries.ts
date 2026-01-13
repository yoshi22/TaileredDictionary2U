'use client'

import useSWR from 'swr'
import type { EntryWithSrs } from '@td2u/shared-types'

interface DueEntriesResponse {
  entries: EntryWithSrs[]
  total: number
}

interface UseDueEntriesResult {
  entries: EntryWithSrs[]
  total: number
  loading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch due entries')
  }
  const json = await res.json()
  return json.data as DueEntriesResponse
}

export function useDueEntries(
  deckId?: string | null,
  limit: number = 20
): UseDueEntriesResult {
  const params = new URLSearchParams()
  if (deckId) params.set('deck_id', deckId)
  params.set('limit', String(limit))

  const { data, error, isLoading, mutate } = useSWR<DueEntriesResponse>(
    `/api/review/due?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    entries: data?.entries ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error: error ?? null,
    mutate,
  }
}
