'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfirmDialog } from '@/components/ui'

interface EntryActionsProps {
  entryId: string
  hasEnrichment: boolean
  onGenerateEnrichment: (forceRegenerate?: boolean) => Promise<void>
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
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const handleRegenerate = async () => {
    await onGenerateEnrichment(true)
    setShowRegenerateConfirm(false)
  }

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
    <>
      <div className="space-y-4">
        {!hasEnrichment ? (
          <Button
            onClick={() => onGenerateEnrichment(false)}
            loading={generatingEnrichment}
            disabled={generatingEnrichment}
            className="w-full"
          >
            Generate AI Content
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={generatingEnrichment}
            className="w-full"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Regenerate AI Content
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

      {/* Regenerate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title="Regenerate AI Content"
        description="This will replace the existing AI-generated content with new content. This action will consume one generation credit. Are you sure?"
        confirmLabel="Regenerate"
        cancelLabel="Cancel"
        loading={generatingEnrichment}
      />
    </>
  )
}
