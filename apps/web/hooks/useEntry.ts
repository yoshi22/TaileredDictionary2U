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
