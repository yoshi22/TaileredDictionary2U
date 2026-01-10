'use client'

import { useState } from 'react'
import { Card, CardContent, Button } from '@/components/ui'
import type { EntryWithSrs } from '@td2u/shared-types'

interface ReviewCardProps {
  entry: EntryWithSrs
}

export function ReviewCard({ entry }: ReviewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="py-8">
        {/* Question Side */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{entry.term}</h2>
          {entry.context && (
            <p className="text-gray-600 italic">Context: {entry.context}</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t my-6" />

        {/* Answer Side */}
        {showAnswer ? (
          <div className="space-y-6 animate-fadeIn">
            {entry.enrichment ? (
              <>
                {/* Translations */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-blue-600 mb-1">Japanese</p>
                    <p className="text-lg font-medium text-blue-900">
                      {entry.enrichment.translation_ja}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-green-600 mb-1">English</p>
                    <p className="text-lg font-medium text-green-900">
                      {entry.enrichment.translation_en}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {entry.enrichment.summary.split('\n').map((line, i) => (
                    <p key={i} className="text-gray-700">
                      {line}
                    </p>
                  ))}
                </div>

                {/* Examples */}
                {entry.enrichment.examples.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Examples:</p>
                    <ul className="space-y-1">
                      {entry.enrichment.examples.slice(0, 2).map((ex, i) => (
                        <li key={i} className="text-gray-600 text-sm">
                          - {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500">
                No enrichment data available. Generate AI content from the entry page.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Button onClick={() => setShowAnswer(true)} size="lg">
              Show Answer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
