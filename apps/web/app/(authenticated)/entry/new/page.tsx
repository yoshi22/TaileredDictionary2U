'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { EntryForm } from '@/components/entry'

export default function NewEntryPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
          <CardDescription>
            Enter a word or phrase you want to learn. Our AI will generate
            translations, examples, and related terms to help you learn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntryForm />
        </CardContent>
      </Card>
    </div>
  )
}
