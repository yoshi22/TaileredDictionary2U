'use client'

import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  totalEntries: number
  dueEntries: number
  totalDecks: number
  reviewsToday: number
  loading?: boolean
}

export function StatsCards({
  totalEntries,
  dueEntries,
  totalDecks,
  reviewsToday,
  loading,
}: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Entries',
      value: totalEntries,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Due for Review',
      value: dueEntries,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-orange-600 bg-orange-100',
      highlight: dueEntries > 0,
    },
    {
      label: 'Decks',
      value: totalDecks,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: 'Reviews Today',
      value: reviewsToday,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={cn(stat.highlight && 'ring-2 ring-orange-500')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={cn(
                  'text-2xl font-bold mt-1',
                  loading ? 'animate-pulse bg-gray-200 rounded w-12 h-8' : 'text-gray-900'
                )}>
                  {loading ? '' : stat.value}
                </p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
