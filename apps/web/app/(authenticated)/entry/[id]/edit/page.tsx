'use client'

import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Spinner,
} from '@/components/ui'
import { EditEntryForm } from '@/components/entry'
import { useEntry } from '@/hooks/useEntry'

export default function EditEntryPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : null
  const router = useRouter()
  const { entry, loading, error, mutate } = useEntry(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Entry not found</h2>
        <p className="text-gray-600 mb-4">
          The entry you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 -ml-2 text-gray-600"
      >
        ← Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Entry</CardTitle>
          <CardDescription>
            Update your vocabulary entry. Note that changing the term may affect
            the relevance of AI-generated content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditEntryForm entry={entry} onSuccess={() => mutate()} />
        </CardContent>
      </Card>
    </div>
  )
}
