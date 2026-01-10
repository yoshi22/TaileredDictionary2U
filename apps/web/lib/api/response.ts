import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function createdResponse<T>(data: T): NextResponse {
  return successResponse(data, 201)
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  }
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      ...pagination,
      total_pages: Math.ceil(pagination.total / pagination.limit),
    },
  })
}
