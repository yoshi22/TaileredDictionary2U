'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import type { ReviewSessionSummary } from '@td2u/shared-types'

interface SessionSummaryProps {
  summary: ReviewSessionSummary
}

export function SessionSummary({ summary }: SessionSummaryProps) {
  const router = useRouter()

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return `${mins}m ${secs}s`
  }

  const accuracy =
    summary.total_reviewed > 0
      ? Math.round(
          ((summary.good_count + summary.easy_count) / summary.total_reviewed) *
            100
        )
      : 0

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Session Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-3xl font-bold text-gray-900">
                {summary.total_reviewed}
              </p>
              <p className="text-sm text-gray-600">Cards Reviewed</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-3xl font-bold text-gray-900">{accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Breakdown</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div className="bg-red-100 text-red-700 rounded p-2">
                <p className="font-bold">{summary.again_count}</p>
                <p className="text-xs">Again</p>
              </div>
              <div className="bg-orange-100 text-orange-700 rounded p-2">
                <p className="font-bold">{summary.hard_count}</p>
                <p className="text-xs">Hard</p>
              </div>
              <div className="bg-green-100 text-green-700 rounded p-2">
                <p className="font-bold">{summary.good_count}</p>
                <p className="text-xs">Good</p>
              </div>
              <div className="bg-blue-100 text-blue-700 rounded p-2">
                <p className="font-bold">{summary.easy_count}</p>
                <p className="text-xs">Easy</p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <p className="text-center text-gray-500 text-sm">
            Session duration: {formatDuration(summary.session_duration_seconds)}
          </p>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Review More
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
