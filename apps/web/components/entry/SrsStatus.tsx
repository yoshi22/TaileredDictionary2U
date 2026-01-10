'use client'

import { cn } from '@/lib/utils'

interface SrsStatusProps {
  easeFactor: number
  intervalDays: number
  repetitions: number
  dueDate: string
  lastReviewedAt: string | null
  className?: string
}

export function SrsStatus({
  easeFactor,
  intervalDays,
  repetitions,
  dueDate,
  lastReviewedAt,
  className,
}: SrsStatusProps) {
  const isDue = new Date(dueDate) <= new Date()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return `${Math.abs(days)} days overdue`
    } else if (days === 0) {
      return 'Due today'
    } else if (days === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${days} days`
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-gray-900">Review Status</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-gray-500">Next Review</dt>
          <dd
            className={cn(
              'text-sm font-medium',
              isDue ? 'text-orange-600' : 'text-gray-900'
            )}
          >
            {formatRelativeDate(dueDate)}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-gray-500">Interval</dt>
          <dd className="text-sm font-medium text-gray-900">
            {intervalDays === 0 ? 'New' : `${intervalDays} days`}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-gray-500">Reviews</dt>
          <dd className="text-sm font-medium text-gray-900">{repetitions}</dd>
        </div>

        <div>
          <dt className="text-xs text-gray-500">Ease</dt>
          <dd className="text-sm font-medium text-gray-900">
            {(easeFactor * 100).toFixed(0)}%
          </dd>
        </div>
      </div>

      {lastReviewedAt && (
        <p className="text-xs text-gray-500">
          Last reviewed: {formatDate(lastReviewedAt)}
        </p>
      )}
    </div>
  )
}
