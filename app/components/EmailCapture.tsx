'use client'

import { useState } from 'react'

export default function EmailCapture() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle email submission
    console.log('Email submitted:', email)
    setEmail('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Get Early Access</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Invite
        </button>
      </form>
    </div>
  )
}