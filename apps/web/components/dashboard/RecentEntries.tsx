'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import type { EntryWithSrs } from '@td2u/shared-types'

interface RecentEntriesProps {
  entries: EntryWithSrs[]
  loading?: boolean
}

export function RecentEntries({ entries, loading }: RecentEntriesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No entries yet</p>
            <Link
              href="/entry/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first entry
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Entries</CardTitle>
        <Link
          href="/dashboard/entries"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/entry/${entry.id}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {entry.term}
                  </p>
                  {entry.enrichment?.translation_ja && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {entry.enrichment.translation_ja}
                    </p>
                  )}
                </div>
                {entry.deck_name && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex-shrink-0">
                    {entry.deck_name}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
