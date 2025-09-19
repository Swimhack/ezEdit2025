/**
 * Enhanced Authentication Sign-Up API endpoint
 * Feature: 005-failed-to-fetch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createErrorResponse,
  ErrorResponses,
  extractErrorContext,
  Validators
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
      logger.warn('Supabase not configured for authentication', {
        correlationId,
        operation: 'auth_signup_no_supabase'
      })
      return NextResponse.json(
        { error: 'Authentication service not available' },
        { status: 503, headers }
      )
    }

    logger.info('Authentication sign-up attempt started', {
      correlationId,
      operation: 'auth_signup_start'
    })

    // Parse and validate request body
    const body = await request.json()
    const { email, password, company, plan = 'FREE' } = body

    // Validate required fields
    Validators.requireFields(body, ['email', 'password', 'company'], correlationId)

    // Validate email format
    Validators.validateEmail(email, correlationId)

    // Validate password strength
    Validators.validatePassword(password, correlationId)

    // Validate plan if provided
    const validPlans = ['FREE', 'SINGLE_SITE', 'UNLIMITED']
    if (plan && !validPlans.includes(plan)) {
      throw ErrorResponses.badRequest('Invalid subscription plan', correlationId)
    }

    // Sanitize input using existing validation library
    const validation = validateInput(
      { email, password, company, plan },
      {
        email: { required: true, type: 'email', sanitize: true },
        password: { required: true, type: 'string', minLength: 8 },
        company: { required: true, type: 'string', sanitize: true, maxLength: 100 },
        plan: { required: false, type: 'string', sanitize: true }
      }
    )

    if (!validation.isValid) {
      logger.warn('Invalid sign-up input validation', {
        correlationId,
        errors: validation.errors,
        operation: 'auth_signup_validation'
      })

      throw ErrorResponses.missingFields(
        Object.keys(validation.errors),
        correlationId
      )
    }

    // Log authentication attempt (without sensitive data)
    logger.authAttempt('new_user', 'password', {
      email: validation.sanitized.email,
      company: validation.sanitized.company,
      plan: validation.sanitized.plan,
      correlationId,
      userAgent: request.headers.get('user-agent'),
      ip: context.ip
    })

    // Attempt user creation with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: validation.sanitized.email,
      password: validation.sanitized.password,
      options: {
        data: {
          company: validation.sanitized.company,
          plan: validation.sanitized.plan || 'FREE'
        }
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      logger.authFailure('new_user', 'password', new Error(error.message), {
        correlationId,
        supabaseError: error.status,
        duration,
        operation: 'auth_signup_failure'
      })

      // Map Supabase errors to standard errors
      if (error.message.includes('User already registered')) {
        throw ErrorResponses.userExists(correlationId)
      }

      if (error.message.includes('Password should be')) {
        throw ErrorResponses.weakPassword(correlationId)
      }

      if (error.message.includes('Too many requests')) {
        throw ErrorResponses.rateLimited(correlationId)
      }

      // Generic service unavailable for other Supabase errors
      throw ErrorResponses.serviceUnavailable('Registration', correlationId)
    }

    if (!data.user) {
      logger.error('Registration succeeded but no user data returned', {
        correlationId,
        operation: 'auth_signup_no_user'
      })
      throw ErrorResponses.internalError(correlationId)
    }

    // Create organization record (assuming organizations table exists)
    let organizationId: string | null = null
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: validation.sanitized.company,
          plan: validation.sanitized.plan || 'FREE',
          owner_id: data.user.id
        })
        .select('id')
        .single()

      if (!orgError && orgData) {
        organizationId = orgData.id
      }
    } catch (orgError) {
      logger.warn('Failed to create organization', {
        correlationId,
        error: orgError,
        operation: 'create_organization'
      })
    }

    // Log successful registration
    logger.authSuccess(data.user.id, 'password', duration, {
      correlationId,
      email: data.user.email,
      company: validation.sanitized.company,
      plan: validation.sanitized.plan,
      operation: 'auth_signup_success'
    })

    // Track registration success in database
    await supabase.from('authentication_requests').insert({
      correlation_id: correlationId,
      user_id: data.user.id,
      email: data.user.email,
      method: 'password',
      operation: 'signup',
      ip_address: context.ip || '127.0.0.1',
      user_agent: context.userAgent,
      session_id: data.session?.access_token ?
        data.session.access_token.substring(0, 8) + '...' : null,
      duration,
      success: true,
      context: {
        company: validation.sanitized.company,
        plan: validation.sanitized.plan,
        userAgent: context.userAgent,
        correlationId
      }
    })

    // Prepare response
    const response = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'user', // New users start as 'user' role
        emailConfirmed: data.user.email_confirmed_at !== null
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      } : null,
      organization: organizationId ? {
        id: organizationId,
        name: validation.sanitized.company,
        plan: validation.sanitized.plan || 'FREE'
      } : null,
      correlationId
    }

    logger.info('Authentication sign-up completed successfully', {
      correlationId,
      userId: data.user.id,
      duration,
      emailConfirmed: response.user.emailConfirmed,
      operation: 'auth_signup_complete'
    })

    return NextResponse.json(response, {
      status: 201,
      headers
    })

  } catch (error) {
    const duration = Date.now() - startTime

    // Track failed registration in database
    if (error instanceof Error && supabase) {
      try {
        const requestBody = await request.json().catch(() => ({}))
        await supabase.from('authentication_requests').insert({
          correlation_id: correlationId,
          user_id: null,
          email: requestBody?.email || 'unknown',
          method: 'password',
          operation: 'signup',
          ip_address: context.ip || '127.0.0.1',
          user_agent: context.userAgent,
          duration,
          success: false,
          error_code: (error as any).code || 'UNKNOWN_ERROR',
          error_message: error.message,
          context: {
            company: requestBody?.company,
            plan: requestBody?.plan,
            userAgent: context.userAgent,
            correlationId
          }
        })
      } catch (dbError) {
        logger.error('Failed to log registration request to database', dbError as Error, 'db_error')
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