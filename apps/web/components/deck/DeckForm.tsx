'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { Deck } from '@td2u/shared-types'

interface FormData {
  name: string
  description: string
}

interface FormErrors {
  name?: string
  description?: string
  general?: string
}

interface DeckFormProps {
  deck?: Deck
  onSubmit: (_data: FormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function DeckForm({
  deck,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: DeckFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: deck?.name ?? '',
    description: deck?.description ?? '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (deck) {
      setFormData({
        name: deck.name,
        description: deck.description ?? '',
      })
    }
  }, [deck])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    setErrors({})

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || '',
      })
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Failed to save deck',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{errors.general}</p>
        </div>
      )}

      <Input
        label="Name"
        placeholder="Enter deck name"
        value={formData.name}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, name: e.target.value }))
          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
        }}
        error={errors.name}
        required
      />

      <Textarea
        label="Description"
        placeholder="Add a description (optional)"
        value={formData.description}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, description: e.target.value }))
          if (errors.description)
            setErrors((prev) => ({ ...prev, description: undefined }))
        }}
        error={errors.description}
        rows={3}
      />

      <div className="flex gap-3">
        <Button type="submit" loading={submitting} disabled={submitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
