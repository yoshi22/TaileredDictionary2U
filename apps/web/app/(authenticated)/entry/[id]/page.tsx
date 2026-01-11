'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Spinner,
} from '@/components/ui'
import {
  EnrichmentPreview,
  SrsStatus,
  EntryActions,
} from '@/components/entry'
import { useEntry } from '@/hooks/useEntry'

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : null
  const router = useRouter()
  const { entry, loading, error, mutate } = useEntry(id)
  const [generating, setGenerating] = useState(false)

  const handleGenerateEnrichment = async () => {
    if (!entry) return

    setGenerating(true)
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entry.id }),
      })

      if (res.ok) {
        mutate()
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to generate enrichment')
      }
    } catch {
      alert('Failed to generate enrichment')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Entry not found</h2>
        <p className="text-gray-600 mb-4">
          The entry you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 -ml-2 text-gray-600"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{entry.term}</h1>
          {entry.context && (
            <p className="text-gray-600 mt-1">{entry.context}</p>
          )}
          {entry.deck_name && (
            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
              {entry.deck_name}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {entry.enrichment ? (
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <EnrichmentPreview enrichment={entry.enrichment} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">
                  No AI content generated yet. Generate content to get
                  translations, examples, and related terms.
                </p>
                <Button
                  onClick={handleGenerateEnrichment}
                  loading={generating}
                  disabled={generating}
                >
                  Generate AI Content
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <SrsStatus
                easeFactor={entry.ease_factor}
                intervalDays={entry.interval_days}
                repetitions={entry.repetitions}
                dueDate={entry.due_date}
                lastReviewedAt={entry.last_reviewed_at}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <EntryActions
                entryId={entry.id}
                hasEnrichment={!!entry.enrichment}
                onGenerateEnrichment={handleGenerateEnrichment}
                generatingEnrichment={generating}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
