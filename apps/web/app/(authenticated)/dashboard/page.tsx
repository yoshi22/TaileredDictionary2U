'use client'

import { useEffect, useState } from 'react'
import { StatsCards, QuickActions, RecentEntries, UsageCard } from '@/components/dashboard'
import { useStats } from '@/hooks/useStats'
import type { EntryWithSrs } from '@td2u/shared-types'

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useStats()
  const [recentEntries, setRecentEntries] = useState<EntryWithSrs[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)

  useEffect(() => {
    const fetchRecentEntries = async () => {
      try {
        const res = await fetch('/api/entries?limit=5&sort=created_at&order=desc')
        if (res.ok) {
          const json = await res.json()
          setRecentEntries(json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch recent entries:', error)
      } finally {
        setEntriesLoading(false)
      }
    }

    fetchRecentEntries()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your learning overview.</p>
      </div>

      <StatsCards
        totalEntries={stats?.total_entries ?? 0}
        dueEntries={stats?.due_entries ?? 0}
        totalDecks={stats?.total_decks ?? 0}
        reviewsToday={stats?.reviews_today ?? 0}
        loading={statsLoading}
      />

      <QuickActions dueCount={stats?.due_entries ?? 0} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentEntries entries={recentEntries} loading={entriesLoading} />
        </div>
        <div>
          <UsageCard
            planType={stats?.plan.type ?? 'free'}
            generationUsed={stats?.plan.generation_used ?? 0}
            generationLimit={stats?.plan.generation_limit ?? 20}
            creditBalance={stats?.plan.credit_balance ?? 0}
          />
        </div>
      </div>
    </div>
  )
}
