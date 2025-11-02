import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createRequestLogger } from '@/lib/logger'
import {
  createErrorResponse,
  ErrorResponses,
  extractErrorContext
} from '@/lib/api-error-handler'
import { isScalekitConfigured } from '@/lib/scalekit'
import { isSuperAdmin, shouldBypassPaywall, SUPER_ADMIN_EMAIL } from '@/lib/utils/user-permissions'

// TEMPORARY: Bypass authentication for testing
const BYPASS_AUTH = true

export async function GET(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    // TEMPORARY: Return mock user if auth is bypassed
    if (BYPASS_AUTH) {
      const mockUser = {
        id: 'test-user-123',
        email: 'james@ekaty.com',
        role: 'superadmin',
        isSuperAdmin: true,
        paywallBypass: true,
        subscriptionTier: 'enterprise',
        plan: 'ENTERPRISE'
      }

      logger.info('Mock user returned (auth bypassed)', {
        correlationId,
        userId: mockUser.id,
        email: mockUser.email,
        operation: 'auth_me_bypass'
      })

      const response = NextResponse.json({
        user: mockUser
      })
      response.headers.set('X-Correlation-ID', correlationId)
      return response
    }

    // Check if ScaleKit is configured
    if (!isScalekitConfigured()) {
      logger.error('ScaleKit auth not configured for /auth/me', {
        correlationId,
        operation: 'auth_me_missing_config'
      })
      throw ErrorResponses.serviceUnavailable('Authentication service', correlationId)
    }

    // Get session from cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('scalekit_session')

    if (!sessionCookie || !sessionCookie.value) {
      logger.warn('No session cookie found', {
        correlationId,
        operation: 'auth_me_no_session'
      })
      throw ErrorResponses.authenticationRequired(correlationId)
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (parseError) {
      logger.warn('Invalid session cookie format', {
        correlationId,
        operation: 'auth_me_invalid_session'
      })
      throw ErrorResponses.authenticationRequired(correlationId)
    }

    // Validate session data
    if (!sessionData.userId || !sessionData.email) {
      logger.warn('Invalid session data', {
        correlationId,
        operation: 'auth_me_invalid_data'
      })
      throw ErrorResponses.authenticationRequired(correlationId)
    }

    // Check if session is expired
    if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
      logger.warn('Session expired', {
        correlationId,
        operation: 'auth_me_session_expired'
      })
      throw ErrorResponses.authenticationRequired(correlationId)
    }

    // Determine user role and permissions
    const email = sessionData.email
    const isAdmin = isSuperAdmin(email)
    const role = sessionData.role || (isAdmin ? 'superadmin' : 'user')
    const paywallBypass = shouldBypassPaywall({
      email,
      role,
      metadata: sessionData.metadata
    })

    // Update session data with role if it's super admin
    if (isAdmin && role !== sessionData.role) {
      sessionData.role = 'superadmin'
      sessionData.isSuperAdmin = true
      sessionData.paywallBypass = true
      sessionData.subscriptionTier = 'enterprise'
    }

    logger.info('Authenticated user fetched successfully', {
      correlationId,
      userId: sessionData.userId,
      email,
      role,
      isSuperAdmin: isAdmin,
      operation: 'auth_me_success'
    })

    const response = NextResponse.json({
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        role: role,
        isSuperAdmin: isAdmin,
        paywallBypass: paywallBypass,
        subscriptionTier: sessionData.subscriptionTier || (isAdmin ? 'enterprise' : 'free')
      }
    })
    response.headers.set('X-Correlation-ID', correlationId)
    return response
  } catch (error) {
    // TEMPORARY: Return mock user instead of error if auth is bypassed
    if (BYPASS_AUTH) {
      const mockUser = {
        id: 'test-user-123',
        email: 'james@ekaty.com',
        role: 'superadmin',
        isSuperAdmin: true,
        paywallBypass: true,
        subscriptionTier: 'enterprise',
        plan: 'ENTERPRISE'
      }

      logger.info('Mock user returned after error (auth bypassed)', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'auth_me_bypass_error'
      })

      const response = NextResponse.json({
        user: mockUser
      })
      response.headers.set('X-Correlation-ID', correlationId)
      return response
    }

    const response = createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      context
    )
    response.headers.set('X-Correlation-ID', correlationId)
    return response
  }
}
