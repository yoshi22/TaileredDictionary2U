'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useEntries } from '@/hooks/useEntries'
import { useDecks } from '@/hooks/useDecks'
import { SearchBar } from '@/components/entry/SearchBar'
import { EntryCard } from '@/components/entry/EntryCard'
import { ExportButton } from '@/components/entry/ExportButton'
import { ImportModal } from '@/components/entry/ImportModal'
import { Button, Skeleton } from '@/components/ui'

type SortOption = 'created_at' | 'term' | 'due_date'
type OrderOption = 'asc' | 'desc'

export default function EntriesPage() {
  const [search, setSearch] = useState('')
  const [deckId, setDeckId] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState<SortOption>('created_at')
  const [order, setOrder] = useState<OrderOption>('desc')
  const [page, setPage] = useState(1)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const { decks, loading: decksLoading, mutate: mutateDecks } = useDecks()
  const { entries, loading, total, totalPages, mutate: mutateEntries } = useEntries({
    deckId,
    search,
    sort,
    order,
    page,
    limit: 20,
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page on search
  }, [])

  const handleDeckChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeckId(e.target.value || undefined)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const [newSort, newOrder] = value.split('-') as [SortOption, OrderOption]
    setSort(newSort)
    setOrder(newOrder)
    setPage(1)
  }, [])

  const handleImportSuccess = useCallback(() => {
    mutateEntries()
    mutateDecks()
  }, [mutateEntries, mutateDecks])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entries</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? 'entry' : 'entries'} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </Button>
          <ExportButton deckId={deckId} variant="secondary" size="sm" />
          <Link href="/entry/new">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by term, context, or translation..."
            />
          </div>

          {/* Deck Filter */}
          <div>
            <select
              value={deckId ?? ''}
              onChange={handleDeckChange}
              disabled={decksLoading}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All decks</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={`${sort}-${order}`}
            onChange={handleSortChange}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="created_at-desc">Newest first</option>
            <option value="created_at-asc">Oldest first</option>
            <option value="term-asc">Term (A-Z)</option>
            <option value="term-desc">Term (Z-A)</option>
            <option value="due_date-asc">Due soonest</option>
            <option value="due_date-desc">Due latest</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No entries found</h3>
          <p className="mt-2 text-gray-500">
            {search || deckId
              ? 'Try adjusting your search or filter.'
              : 'Get started by creating your first entry.'}
          </p>
          {!search && !deckId && (
            <Link href="/entry/new">
              <Button className="mt-4">Create Entry</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
        decks={decks}
        defaultDeckId={deckId}
      />
    </div>
  )
}
