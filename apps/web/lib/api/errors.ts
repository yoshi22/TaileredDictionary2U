import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export class ApiError extends Error {
  public code: string
  public status: number
  public details?: unknown

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function errorResponse(error: ApiError): NextResponse {
  const body: { error: string; message: string; details?: unknown } = {
    error: error.code,
    message: error.message,
  }

  if (error.details) {
    body.details = error.details
  }

  return NextResponse.json(body, { status: error.status })
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Send error to Sentry
  if (error instanceof ApiError) {
    // Only send server errors (5xx) to Sentry, not client errors (4xx)
    if (error.status >= 500) {
      Sentry.captureException(error, {
        tags: {
          type: 'api_error',
          error_code: error.code,
        },
        extra: {
          details: error.details,
        },
      })
    }
    return errorResponse(error)
  }

  // Capture unexpected errors
  Sentry.captureException(error, {
    tags: {
      type: 'unexpected_api_error',
    },
  })

  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Internal server error' },
    { status: 500 }
  )
}

// Common errors
export const errors = {
  unauthorized: () => new ApiError('UNAUTHORIZED', 'Authentication required', 401),
  forbidden: (message?: string) => new ApiError('FORBIDDEN', message || 'Access denied', 403),
  notFound: (resource: string) => new ApiError('NOT_FOUND', `${resource} not found`, 404),
  validationError: (details: unknown) =>
    new ApiError('VALIDATION_ERROR', 'Invalid request', 400, details),
  rateLimitExceeded: (message?: string) =>
    new ApiError('RATE_LIMIT_EXCEEDED', message || 'Rate limit exceeded', 429),
  internalError: () => new ApiError('INTERNAL_ERROR', 'Internal server error', 500),
}
