'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'
import { supabase } from '@/lib/supabase'
import { fetchWithRetry, getAuthErrorMessage, AUTH_RETRY_CONFIG, checkNetworkConnectivity } from '@/lib/retry-logic'

export const dynamic = 'force-dynamic'

// Simple pricing plans without Stripe dependency
const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '1 website connection',
      'Basic AI assistance',
      '7-day history',
      'Community support'
    ]
  },
  SINGLE_SITE: {
    name: 'Single Site',
    price: 20,
    priceId: 'single_site',
    features: [
      '1 website connection',
      'Advanced AI assistance',
      'Unlimited history',
      'Priority support'
    ]
  },
  UNLIMITED: {
    name: 'Unlimited',
    price: 100,
    priceId: 'unlimited',
    features: [
      'Unlimited websites',
      'Advanced AI assistance',
      'Unlimited history',
      'Team collaboration',
      'Dedicated support'
    ]
  }
}

function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [passwordStrength, setPasswordStrength] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'SINGLE_SITE' | 'UNLIMITED'>('FREE')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const router = useRouter()

  // Handle plan selection from URL parameters on client side
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const planParam = urlParams.get('plan') as 'FREE' | 'SINGLE_SITE' | 'UNLIMITED'
    if (planParam && PRICING_PLANS[planParam]) {
      setSelectedPlan(planParam)
    }
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
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

    if (!password) {
      validationErrors.password = ['Password is required']
    } else if (password.length < 8) {
      validationErrors.password = ['Password must be at least 8 characters']
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

      const response = await fetchWithRetry('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          company: company?.trim() || '',
          plan: selectedPlan
        })
      }, retryConfigWithFeedback)

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to create account'
        setError(errorMessage)
        return
      }

      setError('')
      setRetryAttempt(0)

      // Account created successfully
      if (selectedPlan === 'FREE') {
        alert('Account created successfully! Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        alert(`${selectedPlan} plan selected! Payment integration coming soon. For now, you'll get free access.`)
        router.push('/dashboard')
      }
    } catch (err: any) {
      // Use the enhanced error message handler
      const userFriendlyMessage = getAuthErrorMessage(err)
      setError(userFriendlyMessage)

      // Log the actual error for debugging
      console.error('Signup error:', err)
    } finally {
      setIsRetrying(false)
      setLoading(false)
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value) {
      // Basic password strength check
      let score = 0
      if (value.length >= 8) score++
      if (/[A-Z]/.test(value)) score++
      if (/[a-z]/.test(value)) score++
      if (/[0-9]/.test(value)) score++
      if (/[^A-Za-z0-9]/.test(value)) score++

      const strength = {
        score,
        feedback: score < 3 ? ['Password should be at least 8 characters with mixed case, numbers, and symbols'] : []
      }
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(null)
    }
  }

  const handleEmailChange = (value: string) => {
    // Basic input sanitization
    const sanitized = value.trim()
    setEmail(sanitized)
  }

  const handleCompanyChange = (value: string) => {
    // Basic input sanitization
    const sanitized = value.trim()
    setCompany(sanitized)
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
      }
      // If successful, the user will be redirected to Google
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign up')
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Start editing websites with AI-powered simplicity
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {/* Plan Selection */}
          <div className="mb-6">
            <label className="text-base font-medium text-gray-900">Choose your plan</label>
            <div className="mt-4 space-y-4">
              {Object.entries(PRICING_PLANS).map(([key, plan]) => (
                <div key={key} className="flex items-center">
                  <input
                    id={key}
                    name="plan"
                    type="radio"
                    checked={selectedPlan === key}
                    onChange={() => setSelectedPlan(key as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={key} className="ml-3 block text-sm font-medium text-gray-700">
                    {plan.name} {plan.price > 0 && `- $${plan.price}/month`}
                    {key === 'SINGLE_SITE' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Most Popular
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSignUp}>
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            passwordStrength.score >= 5 ? 'bg-green-500' :
                            passwordStrength.score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score >= 5 ? 'text-green-600' :
                        passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.score >= 5 ? 'Strong' :
                         passwordStrength.score >= 3 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="mt-1 text-xs text-red-600 space-y-1">
                        {passwordStrength.feedback.map((feedback: string, index: number) => (
                          <li key={index}>• {feedback}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {validationErrors.password && (
                  <div className="mt-1 text-sm text-red-600">
                    {validationErrors.password.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company (optional)
              </label>
              <div className="mt-1">
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={company}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    validationErrors.company ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.company && (
                  <div className="mt-1 text-sm text-red-600">
                    {validationErrors.company.map((error, index) => (
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
                {loading ? 'Creating account...' : selectedPlan === 'FREE' ? 'Create free account' : 'Continue to payment'}
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
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Already have an account?{' '}
                <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </a>
              </span>
            </div>
          </form>

          {selectedPlan !== 'FREE' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <strong>Selected Plan: {PRICING_PLANS[selectedPlan].name}</strong>
                <ul className="mt-2 space-y-1">
                  {PRICING_PLANS[selectedPlan].features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">14-day free trial included</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignUp() {
  return <SignUpForm />
}

