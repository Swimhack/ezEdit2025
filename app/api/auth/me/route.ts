import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createRequestLogger } from '@/lib/logger'
import {
  createErrorResponse,
  ErrorResponses,
  extractErrorContext
} from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Supabase auth not configured for /auth/me', {
        correlationId,
        operation: 'auth_me_missing_config'
      })
      throw ErrorResponses.serviceUnavailable('Authentication service', correlationId)
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      logger.warn('Failed to fetch authenticated user', {
        correlationId,
        error: error.message,
        operation: 'auth_me_get_user'
      })
      throw ErrorResponses.authenticationRequired(correlationId)
    }

    if (!user) {
      throw ErrorResponses.authenticationRequired(correlationId)
    }

    let role = 'user'

    if (supabaseAdmin) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        logger.warn('Failed to load user profile role', {
          correlationId,
          error: profileError.message,
          operation: 'auth_me_profile_lookup'
        })
      }

      if (profile?.role) {
        role = profile.role
      }
    }

    logger.info('Authenticated user fetched successfully', {
      correlationId,
      userId: user.id,
      role,
      operation: 'auth_me_success'
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role
      }
    })
    response.headers.set('X-Correlation-ID', correlationId)
    return response
  } catch (error) {
    const response = createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      context
    )
    response.headers.set('X-Correlation-ID', correlationId)
    return response
  }
}
