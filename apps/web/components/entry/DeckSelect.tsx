'use client'

import { cn } from '@/lib/utils'
import type { Deck } from '@td2u/shared-types'

interface DeckSelectProps {
  decks: Deck[]
  value: string | null
  onChange: (_value: string | null) => void
  loading?: boolean
  error?: string
  disabled?: boolean
}

export function DeckSelect({
  decks,
  value,
  onChange,
  loading = false,
  error,
  disabled = false,
}: DeckSelectProps) {
  return (
    <div>
      <label
        htmlFor="deck-select"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Deck (optional)
      </label>
      <select
        id="deck-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || loading}
        className={cn(
          'block w-full rounded-md border px-3 py-2 text-sm shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 text-gray-900'
        )}
      >
        <option value="">No deck</option>
        {decks.map((deck) => (
          <option key={deck.id} value={deck.id}>
            {deck.name}
          </option>
        ))}
      </select>
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Loading decks...</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
