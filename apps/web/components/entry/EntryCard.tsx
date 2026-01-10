'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { EntryWithSrs } from '@td2u/shared-types'

interface EntryCardProps {
  entry: EntryWithSrs
  className?: string
}

export function EntryCard({ entry, className }: EntryCardProps) {
  const isDue = new Date(entry.due_date) <= new Date()

  return (
    <Link
      href={`/entry/${entry.id}`}
      className={cn(
        'block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow',
        isDue && 'border-l-4 border-l-orange-400',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">{entry.term}</h3>
          {entry.context && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {entry.context}
            </p>
          )}
          {entry.enrichment && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-1">
              {entry.enrichment.translation_ja} / {entry.enrichment.translation_en}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end text-right shrink-0">
          {entry.deck_name && (
            <span className="text-xs text-gray-500 mb-1">
              {entry.deck_name}
            </span>
          )}
          {isDue ? (
            <span className="text-xs font-medium text-orange-600">
              Due for review
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              {entry.interval_days === 0
                ? 'New'
                : `Next: ${entry.interval_days}d`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
