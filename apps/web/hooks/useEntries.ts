'use client'

import useSWR from 'swr'
import type { EntryWithSrs } from '@td2u/shared-types'

interface UseEntriesParams {
  deckId?: string
  search?: string
  sort?: 'created_at' | 'term' | 'due_date'
  order?: 'asc' | 'desc'
  limit?: number
  page?: number
}

interface UseEntriesResult {
  entries: EntryWithSrs[]
  loading: boolean
  error: Error | null
  total: number
  page: number
  totalPages: number
  mutate: () => void
}

interface PaginatedResponse {
  data: EntryWithSrs[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = async (url: string): Promise<PaginatedResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch entries')
  }
  return res.json()
}

export function useEntries({
  deckId,
  search,
  sort = 'created_at',
  order = 'desc',
  limit = 20,
  page = 1,
}: UseEntriesParams = {}): UseEntriesResult {
  const offset = (page - 1) * limit

  const params = new URLSearchParams()
  if (deckId) params.set('deck_id', deckId)
  if (search) params.set('search', search)
  params.set('sort', sort)
  params.set('order', order)
  params.set('limit', limit.toString())
  params.set('offset', offset.toString())

  const url = `/api/entries?${params.toString()}`

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    entries: data?.data ?? [],
    loading: isLoading,
    error: error ?? null,
    total: data?.pagination?.total ?? 0,
    page: data?.pagination?.page ?? 1,
    totalPages: data?.pagination?.totalPages ?? 1,
    mutate,
  }
}
