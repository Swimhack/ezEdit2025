'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'
import { fetchWithRetry, getAuthErrorMessage, AUTH_RETRY_CONFIG, checkNetworkConnectivity } from '@/lib/retry-logic'

export const dynamic = 'force-dynamic'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const router = useRouter()

  // Check for error in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
  }, [])

  const handleEmailChange = (value: string) => {
    // Don't trim during typing - only trim on submit
    setEmail(value)
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setValidationErrors({})
    setRetryAttempt(0)
    setIsRetrying(false)

    // Basic input validation
    const validationErrors: Record<string, string[]> = {}

    if (!email.trim()) {
      validationErrors.email = ['Email is required']
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = ['Invalid email format']
    }

    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      // Check network connectivity first
      const isOnline = await checkNetworkConnectivity()
      if (!isOnline) {
        setError('No internet connection. Please check your network and try again.')
        return
      }

      // Create custom retry config with user feedback
      const retryConfigWithFeedback = {
        ...AUTH_RETRY_CONFIG,
        onRetry: (attempt: number, delay: number) => {
          setRetryAttempt(attempt)
          setIsRetrying(true)
          setError(`Connection issue detected. Retrying in ${Math.round(delay / 1000)} seconds... (attempt ${attempt}/3)`)
        }
      }

      const response = await fetchWithRetry('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: `${window.location.origin}/auth/callback`
        })
      }, retryConfigWithFeedback)

      setIsRetrying(false)

      const data = await response.json()

      if (!response.ok) {
        // Use the detailed error from the API response if available
        const errorMessage = data.error || data.message || data.details || 'Failed to sign in'
        setError(errorMessage)
        
        // Log full error details for debugging
        console.error('Signin API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          type: data.type
        })
        return
      }

      // If auth is bypassed, redirect directly to dashboard
      // Or if ScaleKit returns a redirect URL, redirect to ScaleKit hosted login page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      // Fallback: redirect to dashboard if no redirect URL
      router.push('/dashboard')
    } catch (err: any) {
      setIsRetrying(false)
      
      // Try to get detailed error from response if available
      if (err.response) {
        try {
          const errorData = await err.response.json()
          const errorMessage = errorData.error || errorData.message || errorData.details || getAuthErrorMessage(err)
          setError(errorMessage)
          console.error('Signin error details:', errorData)
          return
        } catch {
          // If we can't parse the error response, fall back to generic message
        }
      }
      
      // Use the enhanced error message handler
      const userFriendlyMessage = getAuthErrorMessage(err)
      setError(userFriendlyMessage)

      // Log the actual error for debugging
      console.error('Signin error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      // Redirect to ScaleKit hosted login page for social login
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          socialLogin: true,
          redirectTo: `${window.location.origin}/auth/callback`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to initiate Google sign in'
        setError(errorMessage)
        return
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        setError('Failed to initiate Google sign in')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo variant="nav" showText={true} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to EzEdit
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.email && (
                  <div className="mt-1 text-sm text-red-600">
                    {validationErrors.email.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.password && (
                  <div className="mt-1 text-sm text-red-600">
                    {validationErrors.password.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className={`rounded-md p-4 ${isRetrying ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <div className={`text-sm flex items-center ${isRetrying ? 'text-yellow-700' : 'text-red-700'}`}>
                  {isRetrying && (
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {error}
                  {retryAttempt > 0 && !isRetrying && (
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      Attempt {retryAttempt}/3
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </a>
              </span>
            </div>

            <div className="text-center">
              <a href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return <SignInForm />
}
