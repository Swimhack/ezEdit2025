/**
 * Enhanced Pino logger with correlation IDs and structured logging
 * Feature: 005-failed-to-fetch
 */

import pino from 'pino'
import { randomUUID } from 'crypto'
import { SENSITIVE_PATTERNS, ErrorSeverity, ErrorSource } from '@/lib/errors/types'

// Base logger configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = process.env.LOG_LEVEL || 'info'

const baseLogger = pino({
  level: logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', 'secret', 'key'],
    remove: true
  },
  transport: isDevelopment && process.env.PINO_LOG_PRETTY === 'true' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'hostname,pid'
    }
  } : undefined
})

// Enhanced logger class with correlation IDs and structured logging
export class EnhancedLogger {
  private correlationId: string
  private logger: pino.Logger
  private context: Record<string, any>

  constructor(correlationId?: string, context: Record<string, any> = {}) {
    this.correlationId = correlationId || randomUUID()
    this.context = context
    this.logger = baseLogger.child({
      correlationId: this.correlationId,
      ...this.sanitizeContext(context)
    })
  }

  // Create child logger with additional context
  child(additionalContext: Record<string, any>): EnhancedLogger {
    return new EnhancedLogger(this.correlationId, {
      ...this.context,
      ...additionalContext
    })
  }

  // Sanitize context to remove sensitive data
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context }

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        // Check for sensitive patterns
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(value)) {
            sanitized[key] = '[REDACTED]'
            break
          }
        }
        // Check for sensitive key names
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]'
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value)
      }
    }

    return sanitized
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'cookie', 'session', 'credential', 'apikey', 'api_key'
    ]
    return sensitiveKeys.some(sensitive =>
      key.toLowerCase().includes(sensitive)
    )
  }

  // Standard logging methods
  debug(message: string, data: Record<string, any> = {}, operation?: string) {
    this.logger.debug({
      message,
      operation,
      ...this.sanitizeContext(data)
    })
  }

  info(message: string, data: Record<string, any> = {}, operation?: string) {
    this.logger.info({
      message,
      operation,
      ...this.sanitizeContext(data)
    })
  }

  warn(message: string, data: Record<string, any> = {}, operation?: string) {
    this.logger.warn({
      message,
      operation,
      ...this.sanitizeContext(data)
    })
  }

  error(message: string, error?: Error | Record<string, any>, operation?: string) {
    const errorData = error instanceof Error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined
      }
    } : { ...error }

    this.logger.error({
      message,
      operation,
      ...this.sanitizeContext(errorData)
    })
  }

  fatal(message: string, error?: Error | Record<string, any>, operation?: string) {
    const errorData = error instanceof Error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : { ...error }

    this.logger.fatal({
      message,
      operation,
      ...this.sanitizeContext(errorData)
    })
  }

  // Authentication-specific logging methods
  authAttempt(userId: string, method: string, context: any = {}) {
    this.info('Authentication attempt', {
      userId,
      method,
      operation: 'auth_attempt',
      severity: 1,
      ...context
    })
  }

  authSuccess(userId: string, method: string, duration: number, context: any = {}) {
    this.info('Authentication successful', {
      userId,
      method,
      operation: 'auth_success',
      duration,
      severity: 1,
      ...context
    })
  }

  authFailure(userId: string, method: string, error: Error, context: any = {}) {
    this.error('Authentication failed', {
      userId,
      method,
      operation: 'auth_failure',
      error: {
        type: error.constructor.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined
      },
      severity: 5,
      ...context
    })
  }

  // API request logging
  apiRequest(method: string, path: string, statusCode: number, duration: number, context: any = {}) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    this.logger[level]({
      message: `${method} ${path} - ${statusCode}`,
      operation: 'api_request',
      method,
      path,
      statusCode,
      duration,
      ...this.sanitizeContext(context)
    })
  }

  // Performance logging
  performance(operation: string, duration: number, context: any = {}) {
    const level = duration > 2000 ? 'warn' : 'info'

    this.logger[level]({
      message: `Performance: ${operation} took ${duration}ms`,
      operation: 'performance',
      operationName: operation,
      duration,
      ...this.sanitizeContext(context)
    })
  }

  // Security event logging
  securityEvent(event: string, severity: number, context: any = {}) {
    const level = severity >= 8 ? 'error' : severity >= 5 ? 'warn' : 'info'

    this.logger[level]({
      message: `Security event: ${event}`,
      operation: 'security_event',
      event,
      severity,
      ...this.sanitizeContext(context)
    })
  }

  // Database operation logging
  dbOperation(operation: string, table: string, duration: number, rowsAffected?: number) {
    this.debug('Database operation', {
      operation: 'db_operation',
      dbOperation: operation,
      table,
      duration,
      rowsAffected
    })
  }

  // Get correlation ID for request tracing
  getCorrelationId(): string {
    return this.correlationId
  }

  // Get the underlying Pino logger instance
  getPinoLogger(): pino.Logger {
    return this.logger
  }
}

// Factory function to create logger instances
export function createLogger(correlationId?: string, context: Record<string, any> = {}): EnhancedLogger {
  return new EnhancedLogger(correlationId, context)
}

// Default logger instance
export const logger = createLogger()

// Request-scoped logger factory for Next.js API routes
export function createRequestLogger(req: any): EnhancedLogger {
  const correlationId = req.headers['x-correlation-id'] ||
                       req.headers['correlation-id'] ||
                       randomUUID()

  const context = {
    method: req.method,
    path: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        '127.0.0.1'
  }

  return createLogger(correlationId, context)
}

// Middleware helper for Express-style middleware
export function loggerMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now()
  const requestLogger = createRequestLogger(req)

  // Attach logger to request object
  req.logger = requestLogger

  // Log request start
  requestLogger.info('Request started', {
    operation: 'request_start'
  })

  // Override res.end to log completion
  const originalEnd = res.end
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime
    requestLogger.apiRequest(
      req.method,
      req.url,
      res.statusCode,
      duration
    )
    originalEnd.apply(res, args)
  }

  next?.()
}

// Utility functions for common logging patterns
export const LogUtils = {
  // Log function execution time
  async withTiming<T>(
    logger: EnhancedLogger,
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      logger.performance(operation, duration, context)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`${operation} failed after ${duration}ms`, error as Error, operation)
      throw error
    }
  },

  // Log with automatic error handling
  tryLog(logger: EnhancedLogger, fn: () => void) {
    try {
      fn()
    } catch (error) {
      logger.error('Logging error occurred', error as Error, 'logging_error')
    }
  },

  // Create correlation ID from request or generate new one
  getOrCreateCorrelationId(req?: any): string {
    if (req?.headers) {
      return req.headers['x-correlation-id'] ||
             req.headers['correlation-id'] ||
             randomUUID()
    }
    return randomUUID()
  }
}

export default logger