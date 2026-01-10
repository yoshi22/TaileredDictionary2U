'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Deck } from '@td2u/shared-types'

interface DeckCardProps {
  deck: Deck
  className?: string
}

export function DeckCard({ deck, className }: DeckCardProps) {
  return (
    <Link
      href={`/deck/${deck.id}`}
      className={cn(
        'block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900">{deck.name}</h3>
          {deck.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {deck.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-primary-600">
            {deck.entry_count}
          </span>
          <p className="text-xs text-gray-500">entries</p>
        </div>
      </div>
    </Link>
  )
}
