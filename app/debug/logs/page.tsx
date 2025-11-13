'use client'

import { useState, useEffect } from 'react'

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/debug/log?limit=200')
      const data = await response.json()
      setLogs(data.logs || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (confirm('Clear all logs?')) {
      await fetch('/api/debug/log', { method: 'DELETE' })
      fetchLogs()
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      case 'debug': return 'text-gray-400'
      default: return 'text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug Logs</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Debug Logs</h1>
          <div className="space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchLogs}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={clearLogs}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-4">
            Total logs: {logs.length}
          </div>

          <div className="space-y-2 font-mono text-sm">
            {logs.map((log, index) => (
              <div
                key={index}
                className="border-b border-gray-700 pb-2 mb-2"
              >
                <div className="flex items-start space-x-4">
                  <span className="text-gray-500 text-xs">
                    {new Date(log.timestamp || log.clientTime).toLocaleTimeString()}
                  </span>
                  <span className={`font-semibold ${getLevelColor(log.level)}`}>
                    [{log.level?.toUpperCase()}]
                  </span>
                  {log.context && (
                    <span className="text-purple-400">[{log.context}]</span>
                  )}
                  <span className="flex-1">{log.message}</span>
                </div>
                {log.data && (
                  <pre className="mt-2 ml-24 text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No logs yet. Interact with the editor to generate logs.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
