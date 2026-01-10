'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { DeckList, CreateDeckModal } from '@/components/deck'
import { useDecks } from '@/hooks/useDecks'

export default function DecksPage() {
  const { decks, loading, mutate } = useDecks()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Decks</h1>
          <p className="text-gray-600 mt-1">
            Organize your vocabulary into decks
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Deck</Button>
      </div>

      <DeckList
        decks={decks}
        loading={loading}
        emptyMessage="No decks yet. Create your first deck to organize your vocabulary."
      />

      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => mutate()}
      />
    </div>
  )
}
