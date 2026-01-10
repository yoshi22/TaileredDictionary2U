'use client'

import { useState } from 'react'
import type { Entry } from '@td2u/shared-types'
import type { CreateEntryInput } from '@td2u/shared-validations'

interface UseCreateEntryResult {
  createEntry: (data: CreateEntryInput) => Promise<Entry>
  loading: boolean
  error: string | null
}

export function useCreateEntry(): UseCreateEntryResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEntry = async (data: CreateEntryInput): Promise<Entry> => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || 'Failed to create entry')
      }

      return json.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create entry'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createEntry,
    loading,
    error,
  }
}
