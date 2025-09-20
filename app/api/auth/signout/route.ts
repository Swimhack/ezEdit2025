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
import { AuthenticationError, ERROR_CODES } from '@/lib/errors/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      logger.error('Failed to sign out user', signOutError, 'auth_signout_failure')
      throw new AuthenticationError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        signOutError.message || 'Failed to sign out',
        503,
        undefined,
        correlationId
      )
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('authentication_requests').insert({
          correlation_id: correlationId,
          user_id: user?.id ?? null,
          email: user?.email ?? 'unknown',
          method: 'password',
          operation: 'logout',
          ip_address: context.ip || '127.0.0.1',
          user_agent: context.userAgent,
          timestamp: new Date().toISOString(),
          duration: 0,
          success: true,
          context: {
            userAgent: context.userAgent,
            correlationId
          }
        })
      } catch (dbError) {
        logger.error('Failed to log sign out event', dbError as Error, 'auth_signout_log_failure')
      }
    }

    logger.info('User signed out successfully', {
      correlationId,
      userId: user?.id,
      operation: 'auth_signout_success'
    })

    const response = NextResponse.json({ success: true, correlationId }, { status: 200 })
    response.headers.set('X-Correlation-ID', correlationId)
    return response
  } catch (error) {
    if (error instanceof AuthenticationError && !supabaseAdmin) {
      return createErrorResponse(error, context)
    }

    if (error instanceof Error && supabaseAdmin) {
      try {
        await supabaseAdmin.from('authentication_requests').insert({
          correlation_id: correlationId,
          user_id: null,
          email: 'unknown',
          method: 'password',
          operation: 'logout',
          ip_address: context.ip || '127.0.0.1',
          user_agent: context.userAgent,
          timestamp: new Date().toISOString(),
          duration: 0,
          success: false,
          error_code: (error as any).code || ERROR_CODES.SERVICE_UNAVAILABLE,
          error_message: error.message,
          context: {
            userAgent: context.userAgent,
            correlationId
          }
        })
      } catch (dbError) {
        logger.error('Failed to log sign out failure', dbError as Error, 'auth_signout_log_failure')
      }
    }

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
