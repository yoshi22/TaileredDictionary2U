import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
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

  if (error instanceof ApiError) {
    return errorResponse(error)
  }

  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Internal server error' },
    { status: 500 }
  )
}

// Common errors
export const errors = {
  unauthorized: () => new ApiError('UNAUTHORIZED', 'Authentication required', 401),
  forbidden: () => new ApiError('FORBIDDEN', 'Access denied', 403),
  notFound: (resource: string) => new ApiError('NOT_FOUND', `${resource} not found`, 404),
  validationError: (details: unknown) =>
    new ApiError('VALIDATION_ERROR', 'Invalid request', 400, details),
  rateLimitExceeded: (message?: string) =>
    new ApiError('RATE_LIMIT_EXCEEDED', message || 'Rate limit exceeded', 429),
  internalError: () => new ApiError('INTERNAL_ERROR', 'Internal server error', 500),
}
