/**
 * Enhanced Authentication Sign-In API endpoint
 * Feature: 005-failed-to-fetch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createErrorResponse,
  ErrorResponses,
  extractErrorContext,
  Validators,
  withErrorHandler
} from '@/lib/api-error-handler'
import { createRequestLogger } from '@/lib/logger'
import { validateInput } from '@/lib/security/input-validation'
import { AuthenticationError } from '@/lib/errors/types'
import { randomUUID } from 'crypto'

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  const startTime = Date.now()

  // Set correlation ID header for response
  const headers = {
    'X-Correlation-ID': correlationId,
    'Content-Type': 'application/json'
  }

  try {
    // Check if Supabase is configured
    if (!supabase) {
      // Fallback: cookie-based demo auth
      const body = await request.json()
      const { email } = body || {}
      if (!email) {
        return NextResponse.json({ error: 'email required' }, { status: 400, headers })
      }
      const user = { id: 'demo-user', email, role: 'user' }
      const res = NextResponse.json({ user, session: null, correlationId }, { status: 200, headers })
      res.headers.set('Set-Cookie', `ez_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Lax`)
      return res
    }

    logger.info('Authentication sign-in attempt started', {
      correlationId,
      operation: 'auth_signin_start'
    })

    // Parse and validate request body
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    Validators.requireFields(body, ['email', 'password'], correlationId)

    // Validate email format
    Validators.validateEmail(email, correlationId)

    // Sanitize input using existing validation library
    const validation = validateInput(
      { email, password },
      {
        email: { required: true, type: 'email', sanitize: true },
        password: { required: true, type: 'string', minLength: 1 }
      }
    )

    if (!validation.isValid) {
      logger.warn('Invalid sign-in input validation', {
        correlationId,
        errors: validation.errors,
        operation: 'auth_signin_validation'
      })

      throw ErrorResponses.missingFields(
        Object.keys(validation.errors),
        correlationId
      )
    }

    // Log authentication attempt (without sensitive data)
    logger.authAttempt('unknown', 'password', {
      email: validation.sanitized.email,
      correlationId,
      userAgent: request.headers.get('user-agent'),
      ip: context.ip
    })

    // Attempt authentication with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.sanitized.email,
      password: validation.sanitized.password,
    })

    const duration = Date.now() - startTime

    if (error) {
      logger.authFailure('unknown', 'password', new Error(error.message), {
        correlationId,
        supabaseError: error.status,
        duration,
        operation: 'auth_signin_failure'
      })

      // Map Supabase errors to standard errors
      if (error.message.includes('Invalid login credentials')) {
        throw ErrorResponses.invalidCredentials(correlationId)
      }

      if (error.message.includes('Too many requests')) {
        throw ErrorResponses.rateLimited(correlationId)
      }

      if (error.message.includes('Email not confirmed')) {
        throw new AuthenticationError(
          'EMAIL_NOT_CONFIRMED',
          'Please confirm your email address before signing in',
          401,
          undefined,
          correlationId
        )
      }

      // Generic service unavailable for other Supabase errors
      throw ErrorResponses.serviceUnavailable('Authentication', correlationId)
    }

    if (!data.user) {
      logger.warn('Authentication succeeded but no user data returned', {
        correlationId,
        operation: 'auth_signin_no_user'
      })
      throw ErrorResponses.userNotFound(correlationId)
    }

    // Get user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const userRole = profile?.role || 'user'

    // Log successful authentication
    logger.authSuccess(data.user.id, 'password', duration, {
      correlationId,
      email: data.user.email,
      role: userRole,
      operation: 'auth_signin_success'
    })

    // Track authentication success in database
    await supabase.from('authentication_requests').insert({
      correlation_id: correlationId,
      user_id: data.user.id,
      email: data.user.email,
      method: 'password',
      operation: 'login',
      ip_address: context.ip || '127.0.0.1',
      user_agent: context.userAgent,
      session_id: data.session?.access_token ?
        data.session.access_token.substring(0, 8) + '...' : null,
      duration,
      success: true,
      context: {
        userAgent: context.userAgent,
        correlationId
      }
    })

    // Update last login timestamp
    await supabase
      .from('profiles')
      .update({
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0 // Reset failed attempts on success
      })
      .eq('id', data.user.id)

    // Prepare response
    const response = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at
      },
      correlationId
    }

    logger.info('Authentication sign-in completed successfully', {
      correlationId,
      userId: data.user.id,
      duration,
      operation: 'auth_signin_complete'
    })

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...headers,
        'X-Rate-Limit-Remaining': '4' // Placeholder for rate limiting
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime

    // Track failed authentication in database
    if (error instanceof Error && supabase) {
      try {
        await supabase.from('authentication_requests').insert({
          correlation_id: correlationId,
          user_id: null,
          email: (await request.json().catch(() => ({})))?.email || 'unknown',
          method: 'password',
          operation: 'login',
          ip_address: context.ip || '127.0.0.1',
          user_agent: context.userAgent,
          duration,
          success: false,
          error_code: (error as any).code || 'UNKNOWN_ERROR',
          error_message: error.message,
          context: {
            userAgent: context.userAgent,
            correlationId
          }
        })
      } catch (dbError) {
        logger.error('Failed to log authentication request to database', dbError as Error, 'db_error')
      }
    }

    // Return standardized error response
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      context
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID',
      'Access-Control-Max-Age': '86400'
    }
  })
}