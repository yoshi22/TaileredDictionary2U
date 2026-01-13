import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UserStats {
  total_entries: number
  due_entries: number
  total_decks: number
  reviews_today: number
  plan: {
    type: 'free' | 'plus'
    generation_used: number
    generation_limit: number
    credit_balance: number
  }
}

interface UseStatsReturn {
  stats: UserStats | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

const DEFAULT_STATS: UserStats = {
  total_entries: 0,
  due_entries: 0,
  total_decks: 0,
  reviews_today: 0,
  plan: {
    type: 'free',
    generation_used: 0,
    generation_limit: 20,
    credit_balance: 0,
  },
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStats(DEFAULT_STATS)
        return
      }

      // Fetch user stats from view
      const { data: statsData, error: statsError } = await supabase
        .from('v_user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        throw new Error(statsError.message)
      }

      // Fetch entitlements
      const { data: entitlement, error: entitlementError } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (entitlementError && entitlementError.code !== 'PGRST116') {
        throw new Error(entitlementError.message)
      }

      // Fetch today's review count
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: reviewCount } = await supabase
        .from('srs_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('last_reviewed_at', today.toISOString())

      setStats({
        total_entries: statsData?.total_entries ?? 0,
        due_entries: statsData?.due_entries ?? 0,
        total_decks: statsData?.total_decks ?? 0,
        reviews_today: reviewCount ?? 0,
        plan: {
          type: (entitlement?.plan_type as 'free' | 'plus') ?? 'free',
          generation_used: entitlement?.monthly_generation_used ?? 0,
          generation_limit: entitlement?.monthly_generation_limit ?? 20,
          credit_balance: entitlement?.credit_balance ?? 0,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'))
      setStats(DEFAULT_STATS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}
