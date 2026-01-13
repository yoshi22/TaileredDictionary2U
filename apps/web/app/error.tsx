'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console for debugging
    console.error('Application error:', error)

    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'client_error',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Oops!</h1>
        <h2 className="text-xl font-medium text-gray-700 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          We apologize for the inconvenience. Please try again or contact
          support if the problem persists.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
        </div>
        {error.message && (
          <pre className="mt-8 p-4 bg-gray-100 rounded text-left text-sm text-red-600 overflow-auto max-w-lg mx-auto">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        )}
      </div>
    </div>
  )
}
