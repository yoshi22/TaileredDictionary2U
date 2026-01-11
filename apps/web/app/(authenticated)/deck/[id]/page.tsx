'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import useSWR from 'swr'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Spinner,
} from '@/components/ui'
import { DeckForm } from '@/components/deck'
import { EntryCard } from '@/components/entry'
import { useDeck } from '@/hooks/useDeck'
import type { EntryWithSrs } from '@td2u/shared-types'

const entriesFetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch entries')
  const json = await res.json()
  return json.data || []
}

export default function DeckDetailPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : null
  const router = useRouter()
  const { deck, loading, error, mutate: mutateDeck } = useDeck(id)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: entries = [], isLoading: entriesLoading } = useSWR<
    EntryWithSrs[]
  >(`/api/entries?deck_id=${id}&limit=50`, entriesFetcher)

  const handleUpdate = async (data: { name: string; description: string }) => {
    const res = await fetch(`/api/decks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.message || 'Failed to update deck')
    }

    mutateDeck()
    setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/decks')
      } else {
        const json = await res.json()
        alert(json.message || 'Failed to delete deck')
      }
    } catch {
      alert('Failed to delete deck')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Deck not found
        </h2>
        <Button onClick={() => router.push('/decks')}>Back to Decks</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/decks')}
            className="mb-2 -ml-2 text-gray-600"
          >
            ← Back to Decks
          </Button>
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Deck</CardTitle>
              </CardHeader>
              <CardContent>
                <DeckForm
                  deck={deck}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditing(false)}
                  submitLabel="Save Changes"
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{deck.name}</h1>
              {deck.description && (
                <p className="text-gray-600 mt-1">{deck.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {deck.entry_count} entries
              </p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  disabled={deleting}
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => router.push(`/entry/new?deck_id=${id}`)}>
          Add Entry to Deck
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/review?deck_id=${id}`)}
          disabled={deck.entry_count === 0}
        >
          Review Deck
        </Button>
      </div>

      {/* Entries */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Entries</h2>
        {entriesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No entries in this deck yet
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
