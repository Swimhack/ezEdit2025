/**
 * Base error types and constants for Authentication Error Resolution and Application Logging
 * Feature: 005-failed-to-fetch
 */

// Standard API Error Interface
export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode: number
  correlationId?: string
}

// Error Severity Levels
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Error Sources
export enum ErrorSource {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  EXTERNAL = 'external'
}

// Authentication Methods
export enum AuthMethod {
  PASSWORD = 'password',
  OAUTH_GOOGLE = 'oauth_google',
  MAGIC_LINK = 'magic_link'
}

// Authentication Operations
export enum AuthOperation {
  LOGIN = 'login',
  SIGNUP = 'signup',
  PASSWORD_RESET = 'password_reset'
}

// Authentication Events
export enum AuthEvent {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKOUT = 'account_lockout'
}

// User Roles for Log Access
export enum UserRole {
  USER = 'user',
  DEVELOPER = 'developer',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

// Log Access Types
export enum LogAccessType {
  SESSION = 'session',
  API_KEY = 'api_key',
  TOKEN = 'token'
}

// Log Types
export enum LogType {
  ERROR = 'error',
  AUTHENTICATION = 'authentication',
  ACCESS = 'access',
  PERFORMANCE = 'performance'
}

// Standard Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Network/System Errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',

  // Authorization Errors
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation Errors
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_LIMIT: 'INVALID_LIMIT',
  INVALID_UUID: 'INVALID_UUID',

  // Generic Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Custom Error Classes
export class StandardApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: any
  public readonly correlationId?: string

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    correlationId?: string
  ) {
    super(message)
    this.name = 'StandardApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.correlationId = correlationId
  }
}

export class AuthenticationError extends StandardApiError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 401,
    details?: any,
    correlationId?: string
  ) {
    super(code, message, statusCode, details, correlationId)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends StandardApiError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: any,
    correlationId?: string
  ) {
    super(code, message, statusCode, details, correlationId)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends StandardApiError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 503,
    details?: any,
    correlationId?: string
  ) {
    super(code, message, statusCode, details, correlationId)
    this.name = 'NetworkError'
  }
}

// Pre-defined Common Errors
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: new AuthenticationError(
    ERROR_CODES.INVALID_CREDENTIALS,
    'Invalid email or password',
    401
  ),
  MISSING_FIELDS: new ValidationError(
    ERROR_CODES.MISSING_FIELDS,
    'Email and password are required',
    400
  ),
  USER_NOT_FOUND: new AuthenticationError(
    ERROR_CODES.USER_NOT_FOUND,
    'User not found',
    404
  ),
  SESSION_EXPIRED: new AuthenticationError(
    ERROR_CODES.SESSION_EXPIRED,
    'Session has expired',
    401
  ),
  RATE_LIMITED: new StandardApiError(
    ERROR_CODES.RATE_LIMITED,
    'Too many attempts, please try again later',
    429
  ),
  WEAK_PASSWORD: new ValidationError(
    ERROR_CODES.WEAK_PASSWORD,
    'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    400
  ),
  USER_EXISTS: new ValidationError(
    ERROR_CODES.USER_EXISTS,
    'An account with this email already exists',
    409
  )
} as const

export const NETWORK_ERRORS = {
  CONNECTION_FAILED: new NetworkError(
    ERROR_CODES.CONNECTION_FAILED,
    'Failed to connect to authentication service',
    503
  ),
  TIMEOUT: new NetworkError(
    ERROR_CODES.TIMEOUT,
    'Request timed out',
    408
  ),
  SERVICE_UNAVAILABLE: new NetworkError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    'Authentication service is temporarily unavailable',
    503
  )
} as const

export const LOG_ERRORS = {
  AUTHENTICATION_REQUIRED: new AuthenticationError(
    ERROR_CODES.AUTHENTICATION_REQUIRED,
    'Authentication required to access logs',
    401
  ),
  INSUFFICIENT_PERMISSIONS: new AuthenticationError(
    ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    'Insufficient permissions to access logs',
    403
  ),
  INVALID_DATE_RANGE: new ValidationError(
    ERROR_CODES.INVALID_DATE_RANGE,
    'Invalid date range: \'from\' must be before \'to\'',
    400
  ),
  INVALID_LIMIT: new ValidationError(
    ERROR_CODES.INVALID_LIMIT,
    'Limit must be between 1 and 1000',
    400
  )
} as const

// Type Guards
export function isStandardApiError(error: any): error is StandardApiError {
  return error instanceof StandardApiError
}

export function isAuthenticationError(error: any): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError
}

// Error Severity Calculator
export function calculateErrorSeverity(error: Error): number {
  if (isNetworkError(error)) return 8 // High severity for network issues
  if (isAuthenticationError(error)) return 6 // Medium-high for auth issues
  if (isValidationError(error)) return 3 // Low-medium for validation
  if (error.name === 'TypeError') return 5 // Medium for type errors
  return 4 // Default medium severity
}

// Sensitive Data Patterns for Log Sanitization
export const SENSITIVE_PATTERNS = [
  /password/gi,
  /token/gi,
  /apikey/gi,
  /secret/gi,
  /authorization/gi,
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email pattern
  /\b\d{4}-\d{4}-\d{4}-\d{4}\b/gi, // Credit card pattern
  /\b\d{3}-\d{2}-\d{4}\b/gi // SSN pattern
] as const

// Rate Limiting Configuration
export const RATE_LIMITS = {
  AUTH_SIGNIN: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  AUTH_SIGNUP: { requests: 3, window: 15 * 60 * 1000 }, // 3 requests per 15 minutes
  LOG_ACCESS: { requests: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  LOG_EXPORT: { requests: 10, window: 60 * 60 * 1000 } // 10 exports per hour
} as const

// HTTP Status Code Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]