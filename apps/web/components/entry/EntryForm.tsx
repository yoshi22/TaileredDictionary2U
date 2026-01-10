'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui'
import { DeckSelect } from './DeckSelect'
import { useDecks } from '@/hooks/useDecks'
import { useCreateEntry } from '@/hooks/useCreateEntry'

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

export function EntryForm() {
  const router = useRouter()
  const { decks, loading: decksLoading } = useDecks()
  const { createEntry, loading: createLoading } = useCreateEntry()

  const [formData, setFormData] = useState<FormData>({
    term: '',
    context: '',
    deck_id: null,
  })
  const [errors, setErrors] = useState<FormErrors>({})

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

    try {
      await createEntry({
        term: formData.term.trim(),
        context: formData.context.trim() || null,
        deck_id: formData.deck_id,
      })

      router.push('/dashboard')
    } catch {
      setErrors({
        general: 'Failed to create entry. Please try again.',
      })
    }
  }

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, term: e.target.value }))
    if (errors.term) {
      setErrors((prev) => ({ ...prev, term: undefined }))
    }
  }

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, context: e.target.value }))
    if (errors.context) {
      setErrors((prev) => ({ ...prev, context: undefined }))
    }
  }

  const handleDeckChange = (deckId: string | null) => {
    setFormData((prev) => ({ ...prev, deck_id: deckId }))
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
        onChange={handleTermChange}
        error={errors.term}
        helperText="The word or phrase you want to learn (required)"
        required
      />

      <Textarea
        label="Context"
        placeholder="Add context where you found this term (optional)"
        value={formData.context}
        onChange={handleContextChange}
        error={errors.context}
        helperText="Adding context helps generate better explanations"
        rows={4}
      />

      <DeckSelect
        decks={decks}
        value={formData.deck_id}
        onChange={handleDeckChange}
        loading={decksLoading}
      />

      <div className="flex gap-4">
        <Button
          type="submit"
          loading={createLoading}
          disabled={createLoading}
          className="flex-1"
        >
          Create Entry
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={createLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
