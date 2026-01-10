'use client'

import useSWR from 'swr'
import type { Profile, Entitlement } from '@td2u/shared-types'

interface ProfileWithEntitlement extends Profile {
  entitlement?: Entitlement | null
}

interface UseProfileResult {
  profile: ProfileWithEntitlement | null
  loading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch profile')
  }
  const json = await res.json()
  return json.data
}

export function useProfile(): UseProfileResult {
  const { data, error, isLoading, mutate } = useSWR<ProfileWithEntitlement>(
    '/api/profile',
    fetcher
  )

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error ?? null,
    mutate,
  }
}
