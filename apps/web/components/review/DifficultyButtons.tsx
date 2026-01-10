'use client'

import type { SrsRating } from '@td2u/shared-types'

interface DifficultyButtonsProps {
  onSelect: (rating: SrsRating) => void
  disabled?: boolean
}

const DIFFICULTY_OPTIONS: {
  rating: SrsRating
  label: string
  description: string
  className: string
}[] = [
  {
    rating: 0,
    label: 'Again',
    description: 'Completely forgot',
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  {
    rating: 1,
    label: 'Hard',
    description: 'Struggled to recall',
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  {
    rating: 2,
    label: 'Good',
    description: 'Recalled correctly',
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    rating: 3,
    label: 'Easy',
    description: 'Perfect recall',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
]

export function DifficultyButtons({
  onSelect,
  disabled = false,
}: DifficultyButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DIFFICULTY_OPTIONS.map((option) => (
        <button
          key={option.rating}
          onClick={() => onSelect(option.rating)}
          disabled={disabled}
          className={`
            flex flex-col items-center py-3 px-2 rounded-lg transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${option.className}
          `}
        >
          <span className="font-medium">{option.label}</span>
          <span className="text-xs opacity-80 mt-1">{option.description}</span>
        </button>
      ))}
    </div>
  )
}
