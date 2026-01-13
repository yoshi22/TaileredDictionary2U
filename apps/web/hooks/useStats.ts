'use client'

import useSWR from 'swr'

interface Stats {
  total_entries: number
  due_entries: number
  total_decks: number
  reviews_today: number
  streak_days: number
  plan: {
    type: 'free' | 'plus'
    generation_used: number
    generation_limit: number
    credit_balance: number
  }
}

interface StatsResponse {
  data: Stats
}

const fetcher = async (url: string): Promise<Stats> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch stats')
  }
  const json: StatsResponse = await res.json()
  return json.data
}

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<Stats>('/api/stats', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  return {
    stats: data,
    error,
    loading: isLoading,
    mutate,
  }
}
