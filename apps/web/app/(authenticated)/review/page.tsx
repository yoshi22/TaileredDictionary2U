'use client'

import { useRouter } from 'next/navigation'
import { Button, Spinner } from '@/components/ui'
import {
  DifficultyButtons,
  ReviewCard,
  SessionProgress,
  SessionSummary,
} from '@/components/review'
import { useDueEntries } from '@/hooks/useDueEntries'
import { useReviewSession } from '@/hooks/useReviewSession'

export default function ReviewPage() {
  const router = useRouter()
  const { entries, loading, error, mutate } = useDueEntries(null, 50)
  const {
    currentEntry,
    currentIndex,
    totalEntries,
    isComplete,
    submitReview,
    submitting,
    error: sessionError,
    summary,
  } = useReviewSession(entries, mutate)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load entries
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          All caught up!
        </h2>
        <p className="text-gray-600 mb-4">
          You have no entries due for review right now.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/entry/new')}>
            Add New Entry
          </Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (isComplete && summary) {
    return <SessionSummary summary={summary} />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="text-gray-600"
        >
          ← Exit
        </Button>
        <SessionProgress current={currentIndex} total={totalEntries} />
      </div>

      {/* Error message */}
      {sessionError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">
          {sessionError}
        </div>
      )}

      {/* Review Card */}
      {currentEntry && (
        <>
          <ReviewCard entry={currentEntry} />

          {/* Difficulty Buttons */}
          <div className="mt-6">
            <p className="text-center text-gray-600 mb-4">
              How well did you remember?
            </p>
            <DifficultyButtons onSelect={submitReview} disabled={submitting} />
          </div>
        </>
      )}
    </div>
  )
}
