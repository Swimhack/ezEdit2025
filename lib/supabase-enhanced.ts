/**
 * Enhanced Supabase Client with Retry Logic and Comprehensive Error Handling
 * Fixes "Failed to fetch" errors and provides enterprise-grade reliability
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthError, NetworkRetryOptions, AUTH_CONSTANTS } from './types/auth'

/**
 * Enhanced fetch function with retry logic and network error handling
 */
async function enhancedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOptions: NetworkRetryOptions = {
    maxRetries: AUTH_CONSTANTS.NETWORK_RETRY_MAX_ATTEMPTS,
    retryDelay: AUTH_CONSTANTS.NETWORK_RETRY_DELAY_MS,
    backoffMultiplier: AUTH_CONSTANTS.NETWORK_BACKOFF_MULTIPLIER,
    retryCondition: (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        error.name === 'TypeError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        (error.status >= 500 && error.status < 600)
      )
    }
  }
): Promise<Response> {
  let lastError: any

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        }
      })

      clearTimeout(timeoutId)

      // If successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // For server errors, treat as retryable
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    } catch (error: any) {
      lastError = error
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message)

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === retryOptions.maxRetries || !retryOptions.retryCondition(error)) {
        break
      }

      // Calculate exponential backoff delay
      const delay = retryOptions.retryDelay * Math.pow(retryOptions.backoffMultiplier, attempt)
      console.info(`Retrying in ${delay}ms... (attempt ${attempt + 2}/${retryOptions.maxRetries + 1})`)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // All attempts failed, throw the last error
  throw new Error(`Network request failed after ${retryOptions.maxRetries + 1} attempts: ${lastError.message}`)
}

/**
 * Create enhanced Supabase client for server-side operations
 */
export function createEnhancedSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: enhancedFetch
    }
  })
}

/**
 * Create enhanced Supabase client for client-side operations
 */
export function createEnhancedClientComponent(): SupabaseClient {
  const client = createClientComponentClient()

  // Override the fetch method to use our enhanced version
  ;(client as any).fetch = enhancedFetch

  return client
}

/**
 * Network connectivity checker
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to reach a reliable endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch('https://dns.google/resolve?name=google.com&type=A', {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Enhanced error handling for authentication operations
 */
export function handleAuthError(error: any): AuthError {
  console.error('Authentication error:', error)

  // Network connectivity errors
  if (
    error.message?.includes('fetch failed') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('ENOTFOUND') ||
    error.name === 'TypeError'
  ) {
    return {
      error: 'NETWORK_ERROR',
      message: 'Unable to connect to the authentication service. Please check your internet connection and try again.',
      details: {
        originalError: error.message,
        isNetworkError: true
      }
    }
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.name === 'AbortError') {
    return {
      error: 'NETWORK_ERROR',
      message: 'The request timed out. Please try again.',
      details: {
        originalError: error.message,
        isTimeout: true
      }
    }
  }

  // Supabase specific errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return {
          error: 'INVALID_REQUEST',
          message: error.message || 'Invalid request. Please check your input.',
          details: { status: 400 }
        }
      case 401:
        return {
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          details: { status: 401 }
        }
      case 422:
        return {
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.',
          details: { status: 422 }
        }
      case 429:
        return {
          error: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment before trying again.',
          details: { status: 429 }
        }
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          error: 'SERVER_ERROR',
          message: 'Service temporarily unavailable. Please try again in a moment.',
          details: { status: error.status }
        }
    }
  }

  // Parse Supabase error messages
  if (error.message) {
    if (error.message.includes('Invalid login credentials')) {
      return {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        details: { supabaseError: error.message }
      }
    }

    if (error.message.includes('Email not confirmed')) {
      return {
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before signing in.',
        details: { supabaseError: error.message }
      }
    }

    if (error.message.includes('User already registered')) {
      return {
        error: 'EMAIL_EXISTS',
        message: 'An account with this email already exists.',
        details: { supabaseError: error.message }
      }
    }

    if (error.message.includes('Password should be at least')) {
      return {
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long.',
        details: { supabaseError: error.message }
      }
    }
  }

  // Generic error fallback
  return {
    error: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    details: {
      originalError: error.message || 'Unknown error',
      type: error.constructor.name
    }
  }
}

/**
 * Retry wrapper for authentication operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = AUTH_CONSTANTS.NETWORK_RETRY_MAX_ATTEMPTS
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()

      if (attempt > 0) {
        console.info(`${operationName} succeeded on attempt ${attempt + 1}`)
      }

      return result
    } catch (error: any) {
      lastError = error
      console.warn(`${operationName} attempt ${attempt + 1} failed:`, error.message)

      // Don't retry if this is the last attempt or if it's a client error
      if (
        attempt === maxRetries ||
        error.status < 500 ||
        !error.message?.includes('fetch')
      ) {
        break
      }

      // Exponential backoff
      const delay = AUTH_CONSTANTS.NETWORK_RETRY_DELAY_MS * Math.pow(2, attempt)
      console.info(`Retrying ${operationName} in ${delay}ms...`)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw handleAuthError(lastError)
}

/**
 * Enhanced environment validation
 */
export function validateSupabaseEnvironment(): void {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all variables are set correctly.'
    )
  }

  // Validate URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must start with https://')
  }
}

// Validate environment on module load
try {
  validateSupabaseEnvironment()
} catch (error) {
  console.error('Supabase environment validation failed:', error)
}