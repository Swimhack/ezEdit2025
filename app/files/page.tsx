'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

interface FileHistory {
  id: string
  websiteId: string
  websiteName: string
  fileName: string
  filePath: string
  lastModified: string
  fileSize?: number
  action: 'created' | 'modified' | 'deleted'
}

export default function Files() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<FileHistory[]>([])
  const [websites, setWebsites] = useState<any[]>([])

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/auth/signin')
          return
        }
        const data = await response.json()
        setUser(data.user)

        // Load user's websites and files
        const [websitesResponse, filesResponse] = await Promise.all([
          fetch('/api/websites'),
          fetch('/api/files')
        ])

        if (websitesResponse.ok) {
          const websitesData = await websitesResponse.json()
          setWebsites(websitesData.websites || [])
        }

        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setFiles(filesData.files || [])
        }

        setLoading(false)
      } catch (error) {
        router.push('/auth/signin')
      }
    }
    getUser()
  }, [router])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800'
      case 'modified': return 'bg-blue-100 text-blue-800'
      case 'deleted': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo variant="nav" showText={true} />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/websites')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Websites
              </button>
              <button
                onClick={() => router.push('/chat')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                AI Chat
              </button>
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recent Files</h1>
            <p className="text-gray-600 mt-2">Track your recent file changes across all websites</p>
          </div>
          <button
            onClick={() => router.push('/websites')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Manage Websites
          </button>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-500 text-lg mb-2">No files edited yet</div>
            <p className="text-gray-400 mb-6">
              {websites.length === 0
                ? "Add a website and start editing files to see them here"
                : "Start editing files on your connected websites to see activity here"}
            </p>
            <div className="space-x-4">
              {websites.length === 0 ? (
                <button
                  onClick={() => router.push('/websites')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
                >
                  Add Your First Website
                </button>
              ) : (
                <button
                  onClick={() => router.push('/websites')}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
                >
                  Browse Website Files
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{file.fileName}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(file.action)}`}>
                            {file.action}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>Website:</strong> {file.websiteName}</p>
                          <p><strong>Path:</strong> {file.filePath}</p>
                          <p><strong>Modified:</strong> {formatDate(file.lastModified)}</p>
                          {file.fileSize && (
                            <p><strong>Size:</strong> {formatFileSize(file.fileSize)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/editor/${file.websiteId}?file=${encodeURIComponent(file.filePath)}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Implement file download/view
                            alert('File preview coming soon!')
                          }}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {files.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {files.filter(f => f.action === 'created').length}
                </div>
                <div className="text-green-800">Files Created</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {files.filter(f => f.action === 'modified').length}
                </div>
                <div className="text-blue-800">Files Modified</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{websites.length}</div>
                <div className="text-purple-800">Connected Websites</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}