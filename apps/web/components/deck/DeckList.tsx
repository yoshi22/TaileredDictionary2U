'use client'

import { Spinner } from '@/components/ui'
import { DeckCard } from './DeckCard'
import type { Deck } from '@td2u/shared-types'

interface DeckListProps {
  decks: Deck[]
  loading?: boolean
  emptyMessage?: string
}

export function DeckList({
  decks,
  loading = false,
  emptyMessage = 'No decks yet',
}: DeckListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  )
}
