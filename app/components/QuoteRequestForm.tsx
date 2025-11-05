'use client'

import { useState } from 'react'

export default function QuoteRequestForm() {
  const [domain, setDomain] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate inputs before submitting
      if (!domain.trim() || !message.trim()) {
        setError('Please fill in all required fields.')
        setLoading(false)
        return
      }

      // Create abort controller for timeout (compatible with older browsers)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      let response
      try {
        console.log('Submitting quote request:', { domain: domain.trim(), messageLength: message.trim().length })
        
        response = await fetch('/api/quote-requests/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            domain: domain.trim(), 
            message: message.trim() 
          }),
          signal: controller.signal,
          credentials: 'same-origin'
        })
        
        console.log('Response received:', { status: response.status, statusText: response.statusText, ok: response.ok })
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        console.error('Fetch error details:', {
          name: fetchError?.name,
          message: fetchError?.message,
          stack: fetchError?.stack,
          cause: fetchError?.cause
        })
        throw fetchError
      } finally {
        clearTimeout(timeoutId)
      }

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          // If we can't parse JSON, use status text
          throw new Error(`Server error (${response.status}): ${response.statusText}`)
        }
        
        const errorMsg = errorData.error || 'Failed to submit quote request. Please try again.'
        const errorDetails = errorData.details ? ` ${errorData.details}` : ''
        throw new Error(`${errorMsg}${errorDetails}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit quote request. Please try again.')
      }

      setSuccess(true)
      setDomain('')
      setMessage('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      console.error('Quote request submission error:', err)
      
      // Handle different error types
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection and try again.')
      } else if (err.message?.includes('fetch failed') || err.message?.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and try again.')
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to submit quote request. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Get a Quote for Your Website
      </h3>
      <p className="text-gray-600 text-center mb-6">
        Tell us about your project and we'll get back to you within 24 hours
      </p>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Quote request submitted successfully. We'll be in touch soon.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
            Your Website Domain
          </label>
          <input
            type="text"
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
            disabled={loading}
            maxLength={255}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            What changes do you need?
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the changes you want to make to your website..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
            required
            disabled={loading}
            maxLength={2000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length}/2000 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              Get Your Quote
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        By submitting this form, you agree to our terms of service
      </p>
    </div>
  )
}
