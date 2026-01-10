'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui'
import { DeckSelect } from './DeckSelect'
import { useDecks } from '@/hooks/useDecks'
import type { EntryWithSrs } from '@td2u/shared-types'

interface FormData {
  term: string
  context: string
  deck_id: string | null
}

interface FormErrors {
  term?: string
  context?: string
  general?: string
}

interface EditEntryFormProps {
  entry: EntryWithSrs
  onSuccess?: () => void
}

export function EditEntryForm({ entry, onSuccess }: EditEntryFormProps) {
  const router = useRouter()
  const { decks, loading: decksLoading } = useDecks()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    term: entry.term,
    context: entry.context || '',
    deck_id: entry.deck_id,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setFormData({
      term: entry.term,
      context: entry.context || '',
      deck_id: entry.deck_id,
    })
  }, [entry])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.term.trim()) {
      newErrors.term = 'Term is required'
    } else if (formData.term.length > 200) {
      newErrors.term = 'Term must be 200 characters or less'
    }

    if (formData.context && formData.context.length > 500) {
      newErrors.context = 'Context must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: formData.term.trim(),
          context: formData.context.trim() || null,
          deck_id: formData.deck_id,
        }),
      })

      if (res.ok) {
        onSuccess?.()
        router.push(`/entry/${entry.id}`)
      } else {
        const data = await res.json()
        setErrors({ general: data.message || 'Failed to update entry' })
      }
    } catch {
      setErrors({ general: 'Failed to update entry. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{errors.general}</p>
        </div>
      )}

      <Input
        label="Term"
        placeholder="Enter a word or phrase to learn"
        value={formData.term}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, term: e.target.value }))
          if (errors.term) setErrors((prev) => ({ ...prev, term: undefined }))
        }}
        error={errors.term}
        required
      />

      <Textarea
        label="Context"
        placeholder="Add context where you found this term (optional)"
        value={formData.context}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, context: e.target.value }))
          if (errors.context) setErrors((prev) => ({ ...prev, context: undefined }))
        }}
        error={errors.context}
        rows={4}
      />

      <DeckSelect
        decks={decks}
        value={formData.deck_id}
        onChange={(deckId) => setFormData((prev) => ({ ...prev, deck_id: deckId }))}
        loading={decksLoading}
      />

      <div className="flex gap-4">
        <Button
          type="submit"
          loading={saving}
          disabled={saving}
          className="flex-1"
        >
          Save Changes
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
