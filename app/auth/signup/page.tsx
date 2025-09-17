'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/app/components/Logo'

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
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'SINGLE_SITE' | 'UNLIMITED'>('FREE')

  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan') as 'FREE' | 'SINGLE_SITE' | 'UNLIMITED'

  // Set plan from URL parameter on load
  useState(() => {
    if (planParam && PRICING_PLANS[planParam]) {
      setSelectedPlan(planParam)
    }
  })

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          company,
          plan: selectedPlan
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      // Account created successfully
      if (selectedPlan === 'FREE') {
        alert('Account created successfully! Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        alert(`${selectedPlan} plan selected! Payment integration coming soon. For now, you'll get free access.`)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
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
                  onChange={(e) => setCompany(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}