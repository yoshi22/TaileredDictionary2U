'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface EntryActionsProps {
  entryId: string
  hasEnrichment: boolean
  onGenerateEnrichment: () => Promise<void>
  generatingEnrichment: boolean
}

export function EntryActions({
  entryId,
  hasEnrichment,
  onGenerateEnrichment,
  generatingEnrichment,
}: EntryActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to delete entry')
      }
    } catch {
      alert('Failed to delete entry')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-4">
      {!hasEnrichment && (
        <Button
          onClick={onGenerateEnrichment}
          loading={generatingEnrichment}
          disabled={generatingEnrichment}
          className="w-full"
        >
          Generate AI Content
        </Button>
      )}

      <Button
        variant="secondary"
        onClick={() => router.push(`/entry/${entryId}/edit`)}
        className="w-full"
      >
        Edit Entry
      </Button>

      {showDeleteConfirm ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Are you sure you want to delete this entry?
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete Entry
        </Button>
      )}
    </div>
  )
}
