'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'
import { fetchWithRetry, getAuthErrorMessage, AUTH_RETRY_CONFIG, checkNetworkConnectivity } from '@/lib/retry-logic'

export const dynamic = 'force-dynamic'

// Enhanced pricing plans for all website update types
const PRICING_PLANS = {
  FREE: {
    name: 'Starter',
    price: 0,
    priceId: null,
    features: [
      '1 website connection',
      '50 AI requests/month',
      'Basic AI assistance',
      '7-day edit history',
      '10MB max file size',
      'Community support'
    ],
    limits: {
      websites: 1,
      aiRequests: 50,
      fileSizeMB: 10,
      historyDays: 7
    }
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 29,
    priceId: 'professional',
    yearlyPrice: 290,
    features: [
      '3 website connections',
      '500 AI requests/month',
      'Advanced AI assistance',
      'Unlimited edit history',
      '100MB max file size',
      'Priority email support (24hr)',
      'Batch file operations',
      'Code templates library'
    ],
    limits: {
      websites: 3,
      aiRequests: 500,
      fileSizeMB: 100,
      historyDays: -1 // unlimited
    }
  },
  AGENCY: {
    name: 'Agency',
    price: 99,
    priceId: 'agency',
    yearlyPrice: 990,
    features: [
      '15 website connections',
      '2,000 AI requests/month',
      'Advanced AI assistance',
      'Unlimited edit history',
      '500MB max file size',
      'Priority support (12hr response)',
      'Team collaboration (up to 5 members)',
      'Client site management',
      'Custom branding',
      'API access'
    ],
    limits: {
      websites: 15,
      aiRequests: 2000,
      fileSizeMB: 500,
      historyDays: -1
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    priceId: 'enterprise',
    yearlyPrice: null, // Custom pricing
    features: [
      'Unlimited website connections',
      'Unlimited AI requests',
      'Premium AI assistance',
      'Unlimited edit history',
      'No file size limits',
      'Dedicated account manager',
      '24/7 phone support',
      'Unlimited team members',
      'SSO/SAML integration',
      'Custom integrations',
      'SLA guarantees'
    ],
    limits: {
      websites: -1, // unlimited
      aiRequests: -1,
      fileSizeMB: -1,
      historyDays: -1
    }
  }
}

function SignUpForm() {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'>('FREE')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const router = useRouter()

  // Handle plan selection from URL parameters on client side
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const planParam = urlParams.get('plan') as 'FREE' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'
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
          company: company?.trim() || '',
          plan: selectedPlan,
          redirectTo: `${window.location.origin}/auth/callback`
        })
      }, retryConfigWithFeedback)

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Failed to create account'
        setError(errorMessage)
        return
      }

      setError('')
      setRetryAttempt(0)

      // ScaleKit returns a redirect URL - redirect to ScaleKit hosted signup page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      // Fallback: redirect to dashboard
      router.push('/dashboard')
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

  const handleEmailChange = (value: string) => {
    // Don't trim while typing - only trim on submit
    setEmail(value)
  }

  const handleCompanyChange = (value: string) => {
    // Don't trim while typing - only trim on submit
    setCompany(value)
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')

    try {
      // Redirect to ScaleKit hosted login page for social login
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          socialLogin: true,
          plan: selectedPlan,
          company: company?.trim() || '',
          redirectTo: `${window.location.origin}/auth/callback`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to initiate Google sign up'
        setError(errorMessage)
        return
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        setError('Failed to initiate Google sign up')
      }
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
                    {key === 'PROFESSIONAL' && (
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


