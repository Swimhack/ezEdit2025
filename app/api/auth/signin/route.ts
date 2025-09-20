/**
 * Enhanced Authentication Sign-In API endpoint
 * Feature: 005-failed-to-fetch
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  createErrorResponse,
  ErrorResponses,
  extractErrorContext,
  Validators
} from '@/lib/api-error-handler'
import { createRequestLogger } from '@/lib/logger'
import { validateInput } from '@/lib/security/input-validation'
import { AuthenticationError, ERROR_CODES } from '@/lib/errors/types'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
const supabaseAdmin = isSupabaseConfigured && supabaseServiceKey
  ? createClient<Database>(supabaseUrl!, supabaseServiceKey)
  : null

const ACCOUNT_LOCK_THRESHOLD = 5
const ACCOUNT_LOCK_WINDOW_MINUTES = 15

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  const startTime = Date.now()
  let requestBody: Record<string, any> = {}
  let sanitizedEmail = ''

  try {
    try {
      requestBody = await request.json()
    } catch {
      throw ErrorResponses.badRequest('Invalid JSON payload', correlationId)
    }

    if (!requestBody || typeof requestBody !== 'object') {
      throw ErrorResponses.badRequest('Invalid JSON payload', correlationId)
    }

    if (!isSupabaseConfigured) {
      logger.error('Supabase authentication is not configured', {
        correlationId,
        operation: 'auth_signin_missing_config'
      })
      throw ErrorResponses.serviceUnavailable('Authentication service', correlationId)
    }

    const { email, password } = requestBody as {
      email?: string
      password?: string
    }

    Validators.requireFields(requestBody, ['email', 'password'], correlationId)
    Validators.validateEmail(email as string, correlationId)

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

    sanitizedEmail = String(validation.sanitized.email)

    let existingProfile: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'account_locked_at' | 'failed_login_attempts' | 'role'> | null = null

    if (supabaseAdmin) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, account_locked_at, failed_login_attempts, role')
        .eq('email', sanitizedEmail)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        logger.warn('Failed to load profile before authentication', {
          correlationId,
          error: profileError.message,
          operation: 'auth_signin_profile_lookup'
        })
      }

      if (profile) {
        existingProfile = profile

        if (profile.account_locked_at) {
          const lockedAt = new Date(profile.account_locked_at).getTime()
          const diffMinutes = (Date.now() - lockedAt) / (1000 * 60)
          if (diffMinutes < ACCOUNT_LOCK_WINDOW_MINUTES) {
            logger.authFailure(profile.id, 'password', new Error('Account locked'), {
              correlationId,
              operation: 'auth_signin_account_locked'
            })
            throw ErrorResponses.accountLocked(correlationId)
          }

          const unlockUpdate: Database['public']['Tables']['profiles']['Update'] = {
            account_locked_at: null,
            failed_login_attempts: 0
          }

          await supabaseAdmin
            .from('profiles')
            .update(unlockUpdate)
            .eq('id', profile.id)
        }
      }
    }

    logger.authAttempt(existingProfile?.id || 'unknown', 'password', {
      email: sanitizedEmail,
      correlationId,
      userAgent: request.headers.get('user-agent'),
      ip: context.ip
    })

    const supabaseAuth = createRouteHandlerClient<Database>({ cookies })
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: sanitizedEmail,
      password: String(validation.sanitized.password)
    })

    const duration = Date.now() - startTime

    if (error) {
      logger.authFailure(existingProfile?.id || 'unknown', 'password', new Error(error.message), {
        correlationId,
        supabaseError: error.status,
        duration,
        operation: 'auth_signin_failure'
      })

      if (supabaseAdmin && existingProfile) {
        const attempts = (existingProfile.failed_login_attempts ?? 0) + 1
        const updates: Database['public']['Tables']['profiles']['Update'] = {
          failed_login_attempts: attempts
        }

        if (attempts >= ACCOUNT_LOCK_THRESHOLD) {
          updates.account_locked_at = new Date().toISOString()
        }

        await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', existingProfile.id)
      }

      const message = error.message || 'Authentication failed'

      if (message.includes('Invalid login credentials')) {
        throw ErrorResponses.invalidCredentials(correlationId)
      }

      if (message.includes('Too many requests')) {
        throw ErrorResponses.rateLimited(correlationId)
      }

      if (message.includes('Email not confirmed')) {
        throw new AuthenticationError(
          ERROR_CODES.EMAIL_NOT_CONFIRMED,
          'Email not confirmed',
          401,
          undefined,
          correlationId
        )
      }

      throw new AuthenticationError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        message,
        503,
        undefined,
        correlationId
      )
    }

    if (!data) {
      throw ErrorResponses.serviceUnavailable('Authentication', correlationId)
    }

    if (!data.user) {
      logger.warn('Authentication succeeded but no user data returned', {
        correlationId,
        operation: 'auth_signin_no_user'
      })
      throw ErrorResponses.userNotFound(correlationId)
    }

    let userRole = existingProfile?.role || 'user'
    if (supabaseAdmin && (!existingProfile || !userRole)) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()
      userRole = profile?.role || 'user'
    }

    logger.authSuccess(data.user.id, 'password', duration, {
      correlationId,
      email: data.user.email,
      role: userRole,
      operation: 'auth_signin_success'
    })

    if (supabaseAdmin) {
      await supabaseAdmin.from('authentication_requests').insert({
        correlation_id: correlationId,
        user_id: data.user.id,
        email: data.user.email ?? sanitizedEmail,
        method: 'password',
        operation: 'login',
        ip_address: context.ip || '127.0.0.1',
        user_agent: context.userAgent,
        session_id: null,
        timestamp: new Date().toISOString(),
        duration,
        success: true,
        context: {
          userAgent: context.userAgent,
          correlationId
        }
      })

      await supabaseAdmin
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
          failed_login_attempts: 0,
          account_locked_at: null
        })
        .eq('id', data.user.id)
    }

    const responsePayload = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }
        : null,
      correlationId
    }

    const response = NextResponse.json(responsePayload, { status: 200 })
    response.headers.set('X-Correlation-ID', correlationId)
    response.headers.set('X-Rate-Limit-Remaining', '4')

    return response
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof Error && supabaseAdmin) {
      try {
        await supabaseAdmin.from('authentication_requests').insert({
          correlation_id: correlationId,
          user_id: null,
          email: sanitizedEmail || (typeof requestBody.email === 'string' ? requestBody.email : 'unknown'),
          method: 'password',
          operation: 'login',
          ip_address: context.ip || '127.0.0.1',
          user_agent: context.userAgent,
          timestamp: new Date().toISOString(),
          duration,
          success: false,
          error_code: (error as any).code || ERROR_CODES.SERVICE_UNAVAILABLE,
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

    const errorResponse = createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      context
    )
    errorResponse.headers.set('X-Correlation-ID', correlationId)
    return errorResponse
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
