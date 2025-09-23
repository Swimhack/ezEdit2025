/**
 * POST /api/auth/signup - User Registration API
 * Enterprise-grade signup endpoint with comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { authService } from '../../../../lib/services/auth-service'
import { emailService } from '../../../../lib/services/email-service'
import { securityService } from '../../../../lib/services/security-service'
import { SignupRequest, AuthError } from '../../../../lib/types/auth'
import { withRetry } from '../../../../lib/supabase-enhanced'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      ...getSecurityHeaders()
    },
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract request metadata
    const headersList = await headers()
    const metadata = {
      ipAddress: getClientIP(request, headersList),
      userAgent: headersList.get('user-agent') || undefined,
      origin: headersList.get('origin') || undefined,
      referer: headersList.get('referer') || undefined
    }

    // Apply rate limiting
    const rateLimitResult = checkRateLimit(metadata.ipAddress || 'unknown')
    if (!rateLimitResult.allowed) {
      await securityService.logEvent({
        eventType: 'suspicious_activity',
        severityLevel: 'medium',
        description: `Rate limit exceeded for signup attempt from ${metadata.ipAddress}`,
        sourceIp: metadata.ipAddress,
        userAgent: metadata.userAgent,
        additionalContext: {
          attempts: rateLimitResult.attempts,
          window: RATE_LIMIT_WINDOW_MS,
          endpoint: '/api/auth/signup'
        }
      })

      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many signup attempts. Please try again later.',
          details: {
            retryAfter: Math.ceil(rateLimitResult.retryAfter / 1000)
          }
        } satisfies AuthError,
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitResult.retryAfter / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetAt / 1000).toString(),
            ...getSecurityHeaders()
          }
        }
      )
    }

    // Parse and validate request body
    const body = await parseRequestBody(request)
    if (!body.success) {
      await securityService.logEvent({
        eventType: 'login_attempt',
        severityLevel: 'low',
        description: `Invalid signup request: ${body.error}`,
        sourceIp: metadata.ipAddress,
        userAgent: metadata.userAgent,
        additionalContext: {
          error_type: 'invalid_request_body',
          endpoint: '/api/auth/signup'
        }
      })

      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: body.error!,
          details: { field: 'body' }
        } satisfies AuthError,
        {
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    const signupRequest: SignupRequest = body.data!

    // Attempt signup with retry logic
    const result = await withRetry(
      () => authService.signup(signupRequest, metadata),
      'api-auth-signup',
      3
    )

    // Update rate limiting on successful attempt
    updateRateLimit(metadata.ipAddress || 'unknown')

    if (!result.success) {
      const statusCode = getErrorStatusCode(result.error!)

      return NextResponse.json(
        result.error!,
        {
          status: statusCode,
          headers: {
            'X-Response-Time': `${Date.now() - startTime}ms`,
            ...getSecurityHeaders()
          }
        }
      )
    }

    // Send verification email if registration was successful
    if (result.data?.verification_required && result.data.verification_token) {
      try {
        // Create verification model for email service
        const verificationData = {
          id: crypto.randomUUID(),
          user_id: result.data.user.id,
          email: result.data.user.email,
          verification_token: result.data.verification_token,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          attempts_remaining: 5,
          created_ip: metadata.ipAddress || null,
          verified_ip: null,
          last_attempted_at: null,
          verified_at: null,
          failed_at: null,
          failure_reason: null,
          revoked_at: null,
          revocation_reason: null,
          resent_count: 0,
          last_resent_at: null,
          rate_limited_until: null
        }

        // Import EmailVerificationFactory for proper model creation
        const { EmailVerificationFactory } = await import('../../../../lib/models/email-verification')
        const verificationModel = EmailVerificationFactory.fromDatabase(verificationData)

        await emailService.sendVerificationEmail(verificationModel)
      } catch (emailError) {
        // Log email failure but don't fail the registration
        console.warn('Failed to send verification email:', emailError)
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          user: result.data!.user,
          verification_required: result.data!.verification_required,
          next_step: result.data!.verification_required
            ? 'Please check your email and verify your account'
            : 'You can now sign in to your account'
        }
      },
      {
        status: 201,
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
          'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_REQUESTS - rateLimitResult.attempts - 1).toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetAt / 1000).toString(),
          ...getSecurityHeaders()
        }
      }
    )

  } catch (error) {
    // Log unexpected errors
    await securityService.logEvent({
      eventType: 'login_failure',
      severityLevel: 'critical',
      description: `Unexpected error in signup endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
      sourceIp: getClientIP(request, headers()),
      userAgent: headers().get('user-agent') || undefined,
      additionalContext: {
        error_type: 'unexpected_error',
        endpoint: '/api/auth/signup',
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        details: {}
      } satisfies AuthError,
      {
        status: 500,
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`,
          ...getSecurityHeaders()
        }
      }
    )
  }
}

/**
 * Helper functions
 */
function getClientIP(request: NextRequest, headersList: Headers): string | undefined {
  // Try various headers for IP address
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headersList.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = headersList.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to request IP
  return request.ip || undefined
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
}

async function parseRequestBody(request: NextRequest): Promise<{
  success: boolean
  data?: SignupRequest
  error?: string
}> {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return {
        success: false,
        error: 'Content-Type must be application/json'
      }
    }

    const body = await request.json()

    // Validate required fields
    if (!body.email) {
      return {
        success: false,
        error: 'Email is required'
      }
    }

    if (!body.password) {
      return {
        success: false,
        error: 'Password is required'
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return {
        success: false,
        error: 'Invalid email format'
      }
    }

    // Validate password strength
    if (body.password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      }
    }

    return {
      success: true,
      data: {
        email: body.email.toLowerCase().trim(),
        password: body.password
      }
    }

  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body'
    }
  }
}

function checkRateLimit(identifier: string): {
  allowed: boolean
  attempts: number
  retryAfter: number
  resetAt: number
} {
  const now = Date.now()
  const key = `signup:${identifier}`
  const existing = rateLimitStore.get(key)

  // Clean up expired entries
  if (existing && existing.resetAt <= now) {
    rateLimitStore.delete(key)
  }

  const current = rateLimitStore.get(key) || {
    count: 0,
    resetAt: now + RATE_LIMIT_WINDOW_MS
  }

  const allowed = current.count < RATE_LIMIT_REQUESTS
  const retryAfter = Math.max(0, current.resetAt - now)

  return {
    allowed,
    attempts: current.count,
    retryAfter,
    resetAt: current.resetAt
  }
}

function updateRateLimit(identifier: string): void {
  const now = Date.now()
  const key = `signup:${identifier}`
  const existing = rateLimitStore.get(key)

  if (existing && existing.resetAt > now) {
    existing.count += 1
    rateLimitStore.set(key, existing)
  } else {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    })
  }
}

function getErrorStatusCode(error: AuthError): number {
  switch (error.error) {
    case 'INVALID_REQUEST':
    case 'INVALID_EMAIL':
    case 'INVALID_PASSWORD':
      return 400
    case 'EMAIL_EXISTS':
      return 409
    case 'RATE_LIMITED':
      return 429
    case 'INTERNAL_ERROR':
    case 'DATABASE_ERROR':
    case 'AUTH_ERROR':
      return 500
    default:
      return 400
  }
}