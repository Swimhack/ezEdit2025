/**
 * Standardized API error handler for consistent error responses
 * Feature: 005-failed-to-fetch
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  ApiError,
  StandardApiError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  ERROR_CODES,
  HTTP_STATUS,
  isStandardApiError,
  calculateErrorSeverity
} from '@/lib/errors/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger()

// Enhanced API error response interface
export interface ApiErrorResponse {
  error: string
  code: string
  correlationId: string
  details?: any
  timestamp: string
}

// Error context for enhanced logging
export interface ErrorContext {
  correlationId?: string
  userId?: string
  sessionId?: string
  method?: string
  path?: string
  userAgent?: string
  ip?: string
  requestId?: string
}

/**
 * Create standardized error response with logging
 */
export function createErrorResponse(
  error: StandardApiError | Error,
  context: ErrorContext = {}
): NextResponse<ApiErrorResponse> {
  const correlationId = context.correlationId || randomUUID()
  const timestamp = new Date().toISOString()

  let apiError: ApiError

  // Convert error to standard format
  if (isStandardApiError(error)) {
    apiError = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      correlationId
    }
  } else {
    // Handle unexpected errors
    apiError = {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      correlationId
    }
  }

  // Enhanced error logging with context
  const logContext = {
    correlationId,
    errorCode: apiError.code,
    statusCode: apiError.statusCode,
    severity: calculateErrorSeverity(error),
    userId: context.userId,
    sessionId: context.sessionId,
    method: context.method,
    path: context.path,
    userAgent: context.userAgent,
    ip: context.ip,
    requestId: context.requestId,
    errorType: error.constructor.name,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }

  // Log with appropriate level based on error type
  if (apiError.statusCode >= 500) {
    logger.error(`API Error: ${apiError.message}`, logContext, 'api_error')
  } else if (apiError.statusCode >= 400) {
    logger.warn(`API Warning: ${apiError.message}`, logContext, 'api_warning')
  } else {
    logger.info(`API Info: ${apiError.message}`, logContext, 'api_info')
  }

  // Create response object
  const responseBody: ApiErrorResponse = {
    error: apiError.message,
    code: apiError.code,
    correlationId,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && apiError.details && {
      details: apiError.details
    })
  }

  // Set appropriate headers
  const response = NextResponse.json(responseBody, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'X-Error-Code': apiError.code,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })

  // Add rate limiting headers if applicable
  if (apiError.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS) {
    response.headers.set('Retry-After', '900') // 15 minutes
  }

  return response
}

/**
 * Pre-defined error creators for common scenarios
 */
export const ErrorResponses = {
  // Authentication errors
  invalidCredentials: (correlationId?: string) =>
    new AuthenticationError(
      ERROR_CODES.INVALID_CREDENTIALS,
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED,
      undefined,
      correlationId
    ),

  missingFields: (fields: string[], correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.MISSING_FIELDS,
      `Missing required fields: ${fields.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
      { missingFields: fields },
      correlationId
    ),

  invalidEmail: (correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.INVALID_EMAIL,
      'Invalid email format',
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      correlationId
    ),

  weakPassword: (correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.WEAK_PASSWORD,
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      correlationId
    ),

  userExists: (correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.USER_EXISTS,
      'An account with this email already exists',
      HTTP_STATUS.CONFLICT,
      undefined,
      correlationId
    ),

  userNotFound: (correlationId?: string) =>
    new AuthenticationError(
      ERROR_CODES.USER_NOT_FOUND,
      'User not found',
      HTTP_STATUS.NOT_FOUND,
      undefined,
      correlationId
    ),

  sessionExpired: (correlationId?: string) =>
    new AuthenticationError(
      ERROR_CODES.SESSION_EXPIRED,
      'Session has expired',
      HTTP_STATUS.UNAUTHORIZED,
      undefined,
      correlationId
    ),

  accountLocked: (correlationId?: string) =>
    new AuthenticationError(
      ERROR_CODES.ACCOUNT_LOCKED,
      'Account temporarily locked due to too many failed attempts',
      HTTP_STATUS.UNAUTHORIZED,
      undefined,
      correlationId
    ),

  rateLimited: (correlationId?: string) =>
    new StandardApiError(
      ERROR_CODES.RATE_LIMITED,
      'Too many requests, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      undefined,
      correlationId
    ),

  // Authorization errors
  authenticationRequired: (correlationId?: string) =>
    new AuthenticationError(
      ERROR_CODES.AUTHENTICATION_REQUIRED,
      'Authentication required',
      HTTP_STATUS.UNAUTHORIZED,
      undefined,
      correlationId
    ),

  insufficientPermissions: (correlationId?: string) =>
    new AuthenticationError(
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions',
      HTTP_STATUS.FORBIDDEN,
      undefined,
      correlationId
    ),

  // Validation errors
  invalidDateRange: (correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.INVALID_DATE_RANGE,
      'Invalid date range: \'from\' must be before \'to\'',
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      correlationId
    ),

  invalidLimit: (min: number, max: number, correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.INVALID_LIMIT,
      `Limit must be between ${min} and ${max}`,
      HTTP_STATUS.BAD_REQUEST,
      { min, max },
      correlationId
    ),

  invalidUuid: (field: string, correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.INVALID_UUID,
      `Invalid UUID format for ${field}`,
      HTTP_STATUS.BAD_REQUEST,
      { field },
      correlationId
    ),

  // Network errors
  connectionFailed: (correlationId?: string) =>
    new NetworkError(
      ERROR_CODES.CONNECTION_FAILED,
      'Failed to connect to external service',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      undefined,
      correlationId
    ),

  timeout: (correlationId?: string) =>
    new NetworkError(
      ERROR_CODES.TIMEOUT,
      'Request timed out',
      HTTP_STATUS.TIMEOUT,
      undefined,
      correlationId
    ),

  serviceUnavailable: (service?: string, correlationId?: string) =>
    new NetworkError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      service
        ? `${service} service is temporarily unavailable`
        : 'Service is temporarily unavailable',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      { service },
      correlationId
    ),

  // Generic errors
  badRequest: (message: string, correlationId?: string) =>
    new ValidationError(
      ERROR_CODES.BAD_REQUEST,
      message,
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      correlationId
    ),

  notFound: (resource: string, correlationId?: string) =>
    new StandardApiError(
      ERROR_CODES.NOT_FOUND,
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      { resource },
      correlationId
    ),

  internalError: (correlationId?: string) =>
    new StandardApiError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      undefined,
      correlationId
    )
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof Response) {
        // If it's already a Response (like NextResponse), return it
        return error as R
      }

      const correlationId = context?.correlationId || randomUUID()
      const errorContext: ErrorContext = {
        correlationId,
        ...context
      }

      return createErrorResponse(
        error instanceof Error ? error : new Error('Unknown error'),
        errorContext
      ) as R
    }
  }
}

/**
 * Middleware for extracting error context from Request
 */
export function extractErrorContext(request: Request): ErrorContext {
  const url = new URL(request.url)
  const correlationId = request.headers.get('x-correlation-id') ||
                       request.headers.get('correlation-id') ||
                       randomUUID()

  return {
    correlationId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'
  }
}

/**
 * Validation helpers with error responses
 */
export const Validators = {
  // Validate required fields
  requireFields<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[],
    correlationId?: string
  ): void {
    const missing = requiredFields.filter(field => !data[field])
    if (missing.length > 0) {
      throw ErrorResponses.missingFields(missing as string[], correlationId)
    }
  },

  // Validate email format
  validateEmail(email: string, correlationId?: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw ErrorResponses.invalidEmail(correlationId)
    }
  },

  // Validate password strength
  validatePassword(password: string, correlationId?: string): void {
    const minLength = 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      throw ErrorResponses.weakPassword(correlationId)
    }
  },

  // Validate UUID format
  validateUuid(uuid: string, fieldName: string, correlationId?: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      throw ErrorResponses.invalidUuid(fieldName, correlationId)
    }
  },

  // Validate date range
  validateDateRange(from: Date, to: Date, correlationId?: string): void {
    if (from >= to) {
      throw ErrorResponses.invalidDateRange(correlationId)
    }
  },

  // Validate pagination limits
  validateLimit(limit: number, min: number = 1, max: number = 1000, correlationId?: string): void {
    if (limit < min || limit > max) {
      throw ErrorResponses.invalidLimit(min, max, correlationId)
    }
  }
}

export default {
  createErrorResponse,
  ErrorResponses,
  withErrorHandler,
  extractErrorContext,
  Validators
}