'use client'

import { useState, useCallback, useMemo } from 'react'
import type { EntryWithSrs, SrsRating, ReviewSessionSummary } from '@td2u/shared-types'

interface UseReviewSessionResult {
  currentEntry: EntryWithSrs | null
  currentIndex: number
  totalEntries: number
  isComplete: boolean
  submitReview: (rating: SrsRating) => Promise<void>
  submitting: boolean
  error: string | null
  summary: ReviewSessionSummary | null
  startTime: Date
}

export function useReviewSession(
  entries: EntryWithSrs[],
  onComplete?: () => void
): UseReviewSessionResult {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ratings, setRatings] = useState<SrsRating[]>([])
  const [startTime] = useState(() => new Date())

  const currentEntry = entries[currentIndex] ?? null
  const isComplete = currentIndex >= entries.length

  const summary: ReviewSessionSummary | null = useMemo(() => {
    if (!isComplete || ratings.length === 0) return null

    return {
      total_reviewed: ratings.length,
      again_count: ratings.filter((r) => r === 0).length,
      hard_count: ratings.filter((r) => r === 1).length,
      good_count: ratings.filter((r) => r === 2).length,
      easy_count: ratings.filter((r) => r === 3).length,
      session_duration_seconds: Math.round(
        (new Date().getTime() - startTime.getTime()) / 1000
      ),
    }
  }, [isComplete, ratings, startTime])

  const submitReview = useCallback(
    async (rating: SrsRating) => {
      if (!currentEntry || submitting) return

      setSubmitting(true)
      setError(null)

      try {
        const res = await fetch(`/api/review/${currentEntry.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Failed to submit review')
        }

        setRatings((prev) => [...prev, rating])
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)

        if (nextIndex >= entries.length) {
          onComplete?.()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit review')
      } finally {
        setSubmitting(false)
      }
    },
    [currentEntry, currentIndex, entries.length, submitting, onComplete]
  )

  return {
    currentEntry,
    currentIndex,
    totalEntries: entries.length,
    isComplete,
    submitReview,
    submitting,
    error,
    summary,
    startTime,
  }
}
