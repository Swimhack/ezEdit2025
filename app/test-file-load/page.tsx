'use client'

import { useState } from 'react'

export default function TestFileLoad() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testLoad = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/ftp/editor/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: 'w_mfqaki011hc6q3',
          filePath: '/httpdocs/index.php'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test File Loading</h1>
        
        <button
          onClick={testLoad}
          disabled={loading}
          className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Load index.php'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded">
            <h3 className="font-bold mb-2">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-green-900 border border-green-700 rounded">
              <h3 className="font-bold mb-2">✅ Success!</h3>
              <p>File: {result.path}</p>
              <p>Size: {result.size} bytes</p>
              <p>Content Length: {result.content?.length || 0} characters</p>
            </div>

            <div className="p-4 bg-gray-800 rounded">
              <h3 className="font-bold mb-2">First 500 characters:</h3>
              <pre className="text-sm overflow-x-auto">
                {result.content?.substring(0, 500)}
              </pre>
            </div>

            <div className="p-4 bg-gray-800 rounded">
              <h3 className="font-bold mb-2">Full Response:</h3>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
