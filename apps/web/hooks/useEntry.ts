'use client'

import useSWR from 'swr'
import type { EntryWithSrs } from '@td2u/shared-types'

interface UseEntryResult {
  entry: EntryWithSrs | null
  loading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch entry')
  }
  const json = await res.json()
  return json.data
}

export function useEntry(id: string | null): UseEntryResult {
  const { data, error, isLoading, mutate } = useSWR<EntryWithSrs>(
    id ? `/api/entries/${id}` : null,
    fetcher
  )

  return {
    entry: data ?? null,
    loading: isLoading,
    error: error ?? null,
    mutate,
  }
}
