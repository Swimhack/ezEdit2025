import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createRequestLogger } from '@/lib/logger'
import {
  createErrorResponse,
  ErrorResponses,
  extractErrorContext
} from '@/lib/api-error-handler'

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    const cookieStore = await cookies()
    
    // Get session cookie to extract user info for logging
    const sessionCookie = cookieStore.get('scalekit_session')
    let userId = null
    let userEmail = null

    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value)
        userId = sessionData.userId
        userEmail = sessionData.email
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Clear ScaleKit session cookies
    const response = NextResponse.json({ success: true, correlationId }, { status: 200 })
    response.cookies.delete('scalekit_session')
    response.cookies.delete('scalekit_email')
    response.cookies.delete('scalekit_signup')
    response.headers.set('X-Correlation-ID', correlationId)

    logger.info('User signed out successfully', {
      correlationId,
      userId,
      operation: 'auth_signout_success'
    })

    return response
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error : ErrorResponses.internalError(correlationId),
      context
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  )
}
