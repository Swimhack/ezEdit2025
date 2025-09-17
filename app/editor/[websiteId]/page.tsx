'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Logo from '@/app/components/Logo'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: string
}

interface Website {
  id: string
  name: string
  url: string
  type: string
  host: string
  username: string
  port: string
  path: string
}

export default function Editor() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [website, setWebsite] = useState<Website | null>(null)
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const websiteId = params.websiteId as string
  const initialFile = searchParams.get('file')

  const fileInputRef = useRef<HTMLTextAreaElement>(null)

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

        // Load website details
        await loadWebsite()
        setLoading(false)
      } catch (error) {
        router.push('/auth/signin')
      }
    }
    getUser()
  }, [router, websiteId])

  const loadWebsite = async () => {
    try {
      const response = await fetch(`/api/websites/${websiteId}`)
      if (response.ok) {
        const data = await response.json()
        setWebsite(data.website)
        // Load initial directory
        await loadDirectory('/')

        // Load initial file if specified
        if (initialFile) {
          await loadFile(initialFile)
          setSelectedFile(initialFile)
        }
      } else {
        setError('Website not found')
      }
    } catch (error) {
      setError('Failed to load website')
    }
  }

  const loadDirectory = async (path: string) => {
    setConnecting(true)
    setError('')

    try {
      const response = await fetch('/api/ftp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          path
        })
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
        setCurrentPath(path)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to connect to server')
      }
    } catch (error) {
      setError('Failed to connect to server')
    } finally {
      setConnecting(false)
    }
  }

  const loadFile = async (filePath: string) => {
    setError('')

    try {
      const response = await fetch('/api/ftp/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          filePath
        })
      })

      if (response.ok) {
        const data = await response.json()
        setFileContent(data.content)
        setOriginalContent(data.content)
        setSelectedFile(filePath)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load file')
      }
    } catch (error) {
      setError('Failed to load file')
    }
  }

  const saveFile = async () => {
    if (!selectedFile) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/ftp/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          filePath: selectedFile,
          content: fileContent
        })
      })

      if (response.ok) {
        setOriginalContent(fileContent)
        alert('File saved successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save file')
      }
    } catch (error) {
      setError('Failed to save file')
    } finally {
      setSaving(false)
    }
  }

  const navigateToPath = (path: string) => {
    loadDirectory(path)
  }

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
      navigateToPath(newPath)
    } else {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
      loadFile(filePath)
    }
  }

  const goUpDirectory = () => {
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
      navigateToPath(parentPath)
    }
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  const isFileModified = fileContent !== originalContent

  const getFileIcon = (fileName: string, type: 'file' | 'directory') => {
    if (type === 'directory') return '📁'

    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'html': case 'htm': return '🌐'
      case 'css': return '🎨'
      case 'js': case 'jsx': return '⚡'
      case 'ts': case 'tsx': return '📘'
      case 'json': return '📋'
      case 'php': return '🐘'
      case 'py': return '🐍'
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️'
      case 'pdf': return '📄'
      case 'zip': case 'rar': return '📦'
      default: return '📄'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Logo variant="nav" showText={true} />
              <div className="text-gray-400">→</div>
              <span className="text-gray-700">{website?.name}</span>
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

      <div className="flex-1 flex">
        {/* File Browser Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Files</h2>
              <button
                onClick={() => loadDirectory(currentPath)}
                disabled={connecting}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh"
              >
                🔄
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <button
                onClick={() => navigateToPath('/')}
                className="hover:text-blue-600"
              >
                Home
              </button>
              {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((segment, index, segments) => (
                <div key={index} className="flex items-center space-x-1">
                  <span>/</span>
                  <button
                    onClick={() => navigateToPath('/' + segments.slice(0, index + 1).join('/'))}
                    className="hover:text-blue-600"
                  >
                    {segment}
                  </button>
                </div>
              ))}
            </div>

            {/* Go Up Button */}
            {currentPath !== '/' && (
              <button
                onClick={goUpDirectory}
                className="mt-2 w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                ← Go Up
              </button>
            )}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {connecting ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Connecting...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {error ? (
                  <div className="text-red-600">
                    <p>Connection Error</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                      onClick={() => loadDirectory(currentPath)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <p>No files found</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => handleFileClick(file)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 ${
                      selectedFile === (currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)
                        ? 'bg-blue-50 border-r-2 border-blue-500'
                        : ''
                    }`}
                  >
                    <span className="text-lg">{getFileIcon(file.name, file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      {file.size && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File Editor */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* Editor Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedFile.split('/').pop()}</h3>
                  <p className="text-sm text-gray-500">{selectedFile}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {isFileModified && (
                    <span className="text-orange-600 text-sm">• Unsaved changes</span>
                  )}
                  <button
                    onClick={saveFile}
                    disabled={saving || !isFileModified}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 p-4">
                <textarea
                  ref={fileInputRef}
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full font-mono text-sm border border-gray-300 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="File content will appear here..."
                  style={{ minHeight: '500px' }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a file to edit
                </h3>
                <p className="text-gray-500">
                  Choose a file from the sidebar to start editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-md shadow-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}