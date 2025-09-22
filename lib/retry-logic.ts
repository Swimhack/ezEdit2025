/**
 * Enhanced Retry Logic for Network Resilience
 * Implements exponential backoff for "Failed to fetch" error resolution
 */

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffFactor: number
  retryCondition?: (error: any) => boolean
  onRetry?: (attempt: number, delay: number, error: any) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTime: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true // Network failure like "Failed to fetch"
    }
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true // Timeout errors
    }
    if (error.status >= 500 && error.status < 600) {
      return true // Server errors
    }
    if (error.status === 429) {
      return true // Rate limiting
    }
    return false
  }
}

/**
 * Execute a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await operation()
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if this is the last attempt or retry condition fails
      if (attempt === finalConfig.maxAttempts || !finalConfig.retryCondition?.(lastError)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitter = delay * 0.1 * Math.random()
      const finalDelay = delay + jitter

      console.warn(`Network operation failed, retrying in ${Math.round(finalDelay)}ms (attempt ${attempt}/${finalConfig.maxAttempts})`, {
        error: lastError.message,
        attempt,
        delay: finalDelay
      })

      // Call onRetry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, finalDelay, lastError)
      }

      await new Promise(resolve => setTimeout(resolve, finalDelay))
    }
  }

  return {
    success: false,
    error: lastError || new Error('Operation failed after retries'),
    attempts: finalConfig.maxAttempts,
    totalTime: Date.now() - startTime
  }
}

/**
 * Enhanced fetch with retry logic and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  const timeout = 30000 // 30 second timeout

  const operation = async (): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      clearTimeout(timeoutId)

      // Check for HTTP error status
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        ;(error as any).status = response.status
        ;(error as any).response = response
        throw error
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout')
        timeoutError.name = 'TimeoutError'
        throw timeoutError
      }

      throw error
    }
  }

  const result = await withRetry(operation, config)

  if (!result.success) {
    throw result.error
  }

  return result.data!
}

/**
 * User-friendly error messages for authentication failures
 */
export function getAuthErrorMessage(error: any): string {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network connection failed. Please check your internet connection and try again.'
  }

  if (error.name === 'TimeoutError') {
    return 'Request timed out. Please try again in a moment.'
  }

  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  if (error.status >= 500) {
    return 'Server temporarily unavailable. Please try again in a few moments.'
  }

  if (error.status === 401) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }

  if (error.status === 403) {
    return 'Account access restricted. Please contact support if this continues.'
  }

  if (error.message) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Network connectivity check
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small resource to test connectivity
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache'
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Authentication-specific retry configuration
 */
export const AUTH_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds max
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors and server errors, but not on auth failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }
    if (error.name === 'TimeoutError') {
      return true
    }
    if (error.status >= 500) {
      return true
    }
    if (error.status === 429) {
      return true
    }
    // Don't retry on 401 (invalid credentials) or 403 (forbidden)
    return false
  }
}