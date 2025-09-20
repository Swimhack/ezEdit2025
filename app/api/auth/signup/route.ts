/**
 * Enhanced Authentication Sign-Up API endpoint
 * Feature: 005-failed-to-fetch
 */

import { NextRequest, NextResponse } from 'next/server'
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

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

const VALID_PLANS = ['FREE', 'SINGLE_SITE', 'UNLIMITED'] as const
const PLAN_TO_SUBSCRIPTION: Record<typeof VALID_PLANS[number], Database['public']['Tables']['organizations']['Row']['subscription_tier']> = {
  FREE: 'free',
  SINGLE_SITE: 'starter',
  UNLIMITED: 'pro'
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  const startTime = Date.now()
  const headers = {
    'X-Correlation-ID': correlationId,
    'Content-Type': 'application/json'
  }

  let requestBody: Record<string, any> = {}

  try {
    if (!supabaseAdmin) {
      logger.error('Supabase not configured for authentication', {
        correlationId,
        operation: 'auth_signup_no_supabase'
      })
      throw ErrorResponses.serviceUnavailable('Authentication service', correlationId)
    }

    logger.info('Authentication sign-up attempt started', {
      correlationId,
      operation: 'auth_signup_start'
    })

    try {
      requestBody = await request.json()
    } catch {
      throw ErrorResponses.badRequest('Invalid JSON payload', correlationId)
    }

    if (!requestBody || typeof requestBody !== 'object') {
      throw ErrorResponses.badRequest('Invalid JSON payload', correlationId)
    }

    const { email, password, company, plan = 'FREE' } = requestBody as {
      email?: string
      password?: string
      company?: string
      plan?: string
    }

    Validators.requireFields(requestBody, ['email', 'password'], correlationId)
    Validators.validateEmail(email as string, correlationId)
    Validators.validatePassword(password as string, correlationId)

    const validation = validateInput(
      { email, password, company, plan },
      {
        email: { required: true, type: 'email', sanitize: true },
        password: { required: true, type: 'string', minLength: 8 },
        company: { required: false, type: 'string', sanitize: true, maxLength: 100 },
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

    const sanitizedPlan = (validation.sanitized.plan || 'FREE').toUpperCase() as typeof VALID_PLANS[number]
    if (!VALID_PLANS.includes(sanitizedPlan)) {
      throw ErrorResponses.badRequest('Invalid subscription plan', correlationId)
    }

    const sanitizedEmail = String(validation.sanitized.email)
    const sanitizedCompany = validation.sanitized.company?.trim() || null

    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle()

    if (profileLookupError && profileLookupError.code !== 'PGRST116') {
      logger.warn('Failed to check for existing profile', {
        correlationId,
        error: profileLookupError.message,
        operation: 'auth_signup_profile_lookup'
      })
    }

    if (existingProfile) {
      logger.warn('Attempted signup with existing email', {
        correlationId,
        email: sanitizedEmail,
        operation: 'auth_signup_duplicate_email'
      })
      throw ErrorResponses.userExists(correlationId)
    }

    logger.authAttempt('new_user', 'password', {
      email: sanitizedEmail,
      company: sanitizedCompany,
      plan: sanitizedPlan,
      correlationId,
      userAgent: request.headers.get('user-agent'),
      ip: context.ip
    })

    const { data, error } = await supabaseAdmin.auth.signUp({
      email: sanitizedEmail,
      password: String(validation.sanitized.password),
      options: {
        data: {
          company: sanitizedCompany,
          plan: sanitizedPlan
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

      const message = error.message || 'Failed to create account'

      if (message.toLowerCase().includes('user already registered')) {
        throw ErrorResponses.userExists(correlationId)
      }

      if (message.toLowerCase().includes('password')) {
        throw ErrorResponses.weakPassword(correlationId)
      }

      throw new AuthenticationError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        message,
        503,
        undefined,
        correlationId
      )
    }

    if (!data?.user) {
      throw ErrorResponses.serviceUnavailable('Authentication', correlationId)
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        email: sanitizedEmail,
        full_name: sanitizedCompany,
        role: 'user',
        failed_login_attempts: 0,
        account_locked_at: null,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', data.user.id)

    let organizationId: string | null = null

    if (sanitizedCompany) {
      try {
        const { data: orgData, error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert({
            name: sanitizedCompany,
            owner_id: data.user.id,
            subscription_tier: PLAN_TO_SUBSCRIPTION[sanitizedPlan]
          })
          .select('id')
          .single()

        if (orgError) {
          throw orgError
        }

        organizationId = orgData?.id ?? null
      } catch (orgError) {
        logger.warn('Failed to create organization during signup', {
          correlationId,
          error: orgError instanceof Error ? orgError.message : String(orgError),
          operation: 'auth_signup_create_org'
        })
      }
    }

    logger.authSuccess(data.user.id, 'password', duration, {
      correlationId,
      email: data.user.email,
      company: sanitizedCompany,
      plan: sanitizedPlan,
      operation: 'auth_signup_success'
    })

    await supabaseAdmin.from('authentication_requests').insert({
      correlation_id: correlationId,
      user_id: data.user.id,
      email: data.user.email ?? sanitizedEmail,
      method: 'password',
      operation: 'signup',
      ip_address: context.ip || '127.0.0.1',
      user_agent: context.userAgent,
      session_id: null,
      timestamp: new Date().toISOString(),
      duration,
      success: true,
      context: {
        company: sanitizedCompany,
        plan: sanitizedPlan,
        userAgent: context.userAgent,
        correlationId
      }
    })

    const response = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'user',
        emailConfirmed: data.user.email_confirmed_at !== null
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }
        : null,
      organization: organizationId
        ? {
            id: organizationId,
            name: sanitizedCompany,
            plan: sanitizedPlan
          }
        : null,
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

    if (error instanceof Error && supabaseAdmin) {
      try {
        await supabaseAdmin.from('authentication_requests').insert({
          correlation_id: correlationId,
          user_id: null,
          email: typeof requestBody.email === 'string' ? requestBody.email : 'unknown',
          method: 'password',
          operation: 'signup',
          ip_address: context.ip || '127.0.0.1',
          user_agent: context.userAgent,
          timestamp: new Date().toISOString(),
          duration,
          success: false,
          error_code: (error as any).code || ERROR_CODES.SERVICE_UNAVAILABLE,
          error_message: error.message,
          context: {
            company: requestBody.company,
            plan: requestBody.plan,
            userAgent: context.userAgent,
            correlationId
          }
        })
      } catch (dbError) {
        logger.error('Failed to log registration request to database', dbError as Error, 'db_error')
      }
    }

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
