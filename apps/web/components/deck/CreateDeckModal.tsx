'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { DeckForm } from './DeckForm'

interface CreateDeckModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateDeckModal({
  isOpen,
  onClose,
  onCreated,
}: CreateDeckModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = async (data: { name: string; description: string }) => {
    const res = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.message || 'Failed to create deck')
    }

    onCreated()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div ref={dialogRef} className="w-full max-w-md mx-4">
        <Card>
          <CardHeader>
            <CardTitle>Create New Deck</CardTitle>
          </CardHeader>
          <CardContent>
            <DeckForm
              onSubmit={handleSubmit}
              onCancel={onClose}
              submitLabel="Create Deck"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
