/**
 * Production-grade Pino logging configuration
 * Following 2024 Next.js logging best practices
 */
import pino from 'pino'
import type { Logger } from 'pino'

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Create environment-specific logger
export const logger: Logger = isDevelopment
  ? pino({
      // Development: Pretty-print with colors for readability
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          hideObject: false,
          customColors: 'error:red,warn:yellow,info:green,debug:blue'
        }
      },
      level: 'debug',
      base: {
        env: process.env.NODE_ENV,
        app: 'ezedit'
      }
    })
  : pino({
      // Production: JSON format for structured logging
      level: process.env.LOG_LEVEL || 'warn',
      base: {
        env: process.env.NODE_ENV,
        app: 'ezedit',
        version: process.env.npm_package_version
      },
      formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
          pid: bindings.pid,
          hostname: bindings.hostname,
          app: bindings.app,
          env: bindings.env,
          version: bindings.version
        })
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          'password',
          'token',
          'authorization',
          'cookie',
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'connectionString',
          'apiKey',
          'secret'
        ],
        censor: '[REDACTED]'
      }
    })

// Correlation ID generator for request tracking
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create child logger with correlation ID
export function createChildLogger(correlationId: string, module?: string): Logger {
  const context: any = { correlationId }
  if (module) context.module = module
  return logger.child(context)
}

// FTP-specific logger
export function createFTPLogger(connectionId: string, operation?: string): Logger {
  const context: any = {
    module: 'FTP',
    connectionId
  }
  if (operation) context.operation = operation
  return logger.child(context)
}

// File browser specific logger
export function createFileBrowserLogger(correlationId: string): Logger {
  return logger.child({
    module: 'FileBrowser',
    correlationId
  })
}

// API route logger wrapper
export function createAPILogger(req: any, path: string): Logger {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId()
  return logger.child({
    module: 'API',
    correlationId,
    path,
    method: req.method,
    userAgent: req.headers['user-agent']?.substring(0, 100) // Truncate long user agents
  })
}

// Performance logging helper
export function logPerformance(
  logger: Logger,
  operation: string,
  startTime: number,
  additionalData?: any
) {
  const duration = Date.now() - startTime
  logger.info({
    operation,
    duration,
    performanceMetric: true,
    ...additionalData
  }, `Performance: ${operation} completed in ${duration}ms`)
}

// Error logging with stack traces
export function logError(
  logger: Logger,
  error: Error | any,
  context: string,
  additionalData?: any
) {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
      code: error.code
    },
    context,
    ...additionalData
  }, `Error in ${context}: ${error.message}`)
}

// FTP operation logging
export function logFTPOperation(
  logger: Logger,
  operation: string,
  status: 'start' | 'success' | 'error',
  data?: any,
  error?: any
) {
  const logData = {
    ftpOperation: operation,
    status,
    ...data
  }

  if (status === 'error' && error) {
    logger.error({
      ...logData,
      error: {
        message: error.message,
        code: error.code,
        ftpCode: extractFTPCode(error)
      }
    }, `FTP ${operation} failed: ${error.message}`)
  } else if (status === 'success') {
    logger.info(logData, `FTP ${operation} completed successfully`)
  } else {
    logger.debug(logData, `FTP ${operation} started`)
  }
}

// Extract FTP error codes from error messages
function extractFTPCode(error: any): string | undefined {
  if (typeof error.message === 'string') {
    const match = error.message.match(/^(\d{3})\s/)
    return match ? match[1] : undefined
  }
  return undefined
}

// Health check logging
export function logHealthCheck(component: string, status: 'healthy' | 'unhealthy', details?: any) {
  logger.info({
    healthCheck: true,
    component,
    status,
    timestamp: new Date().toISOString(),
    ...details
  }, `Health check: ${component} is ${status}`)
}

// Startup logging
export function logStartup(component: string, config?: any) {
  logger.info({
    startup: true,
    component,
    config: isDevelopment ? config : undefined,
    timestamp: new Date().toISOString()
  }, `${component} starting up`)
}

// Export for use in other modules
export default logger