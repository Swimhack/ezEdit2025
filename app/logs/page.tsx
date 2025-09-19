'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LogsContent() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const searchParams = useSearchParams()

  useEffect(() => {
    const passParam = searchParams?.get('pass')
    if (passParam === '1234') {
      setAuthenticated(true)
      fetchLogs()
    } else {
      setLoading(false)
    }
  }, [searchParams])

  // Auto-refresh logs every 5 seconds when enabled
  useEffect(() => {
    if (autoRefresh && authenticated) {
      const interval = setInterval(() => {
        fetchLogs()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, authenticated])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs', {
        headers: {
          'Authorization': 'Bearer logs-1234'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setLastUpdate(new Date())
        setError('') // Clear any previous errors
      } else {
        setError('Failed to fetch logs')
      }
    } catch (err) {
      setError('Error fetching logs: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '1234') {
      setAuthenticated(true)
      setError('')
      fetchLogs()
    } else {
      setError('Invalid password')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Application Logs</h1>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Access Logs
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-600 text-center">
            Access with ?pass=1234
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Application Logs</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time application logs and events
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 h-96 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No logs available</div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={fetchLogs}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Logs
                </button>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    autoRefresh
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {autoRefresh ? 'Stop Auto-Refresh' : 'Start Auto-Refresh (5s)'}
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear Display
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {logs.length} log entries {autoRefresh && '(auto-refreshing)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LogsContent />
    </Suspense>
  )
}