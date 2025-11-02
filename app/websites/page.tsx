'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

// TEMPORARY: Disable authentication for testing
const BYPASS_AUTH = true

export default function Websites() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [websites, setWebsites] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [editShowPassword, setEditShowPassword] = useState(false)
  const [newWebsite, setNewWebsite] = useState({
    name: '',
    url: '',
    type: 'FTP',
    host: '',
    username: '',
    password: '',
    port: '21',
    path: '/'
  })

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        // TEMPORARY: Bypass authentication for testing
        if (BYPASS_AUTH) {
          const mockUser = {
            id: 'test-user-123',
            email: 'james@ekaty.com',
            role: 'superadmin',
            isSuperAdmin: true,
            paywallBypass: true,
            subscriptionTier: 'enterprise',
            plan: 'ENTERPRISE'
          }
          setUser(mockUser)

          // Load user's websites
          const websitesResponse = await fetch('/api/websites')
          if (websitesResponse.ok) {
            const websitesData = await websitesResponse.json()
            setWebsites(websitesData.websites || [])
          }

          setLoading(false)
          return
        }

        // Normal authentication flow - DISABLED FOR NOW
        // const response = await fetch('/api/auth/me')
        // if (!response.ok) {
        //   router.push('/auth/signin')
        //   return
        // }
        // const data = await response.json()
        // setUser(data.user)

        // Load user's websites
        const websitesResponse = await fetch('/api/websites')
        if (websitesResponse.ok) {
          const websitesData = await websitesResponse.json()
          setWebsites(websitesData.websites || [])
        }

        setLoading(false)
      } catch (error) {
        // Never redirect - just use mock user
        console.log('Error loading user, using mock user:', error)
        const mockUser = {
          id: 'test-user-123',
          email: 'james@ekaty.com',
          role: 'superadmin',
          isSuperAdmin: true,
          paywallBypass: true,
          subscriptionTier: 'enterprise',
          plan: 'ENTERPRISE'
        }
        setUser(mockUser)
        setWebsites([])
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebsite)
      })

      if (response.ok) {
        const data = await response.json()
        setWebsites([...websites, data.website])
        setShowAddForm(false)
        setShowPassword(false)
        setNewWebsite({
          name: '',
          url: '',
          type: 'FTP',
          host: '',
          username: '',
          password: '',
          port: '21',
          path: '/'
        })
        alert('Website added successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      alert('Failed to add website')
    }
  }

  const handleEditWebsite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingWebsite) return

    try {
      const response = await fetch(`/api/websites/${editingWebsite.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingWebsite.name,
          url: editingWebsite.url,
          type: editingWebsite.type,
          host: editingWebsite.host,
          username: editingWebsite.username,
          password: editingWebsite.password,
          port: editingWebsite.port,
          path: editingWebsite.path
        })
      })

      if (response.ok) {
        const data = await response.json()
        setWebsites(websites.map(w => w.id === editingWebsite.id ? data.website : w))
        setEditingWebsite(null)
        setEditShowPassword(false)
        alert('Website updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      alert('Failed to update website')
    }
  }

  const startEdit = (website: any) => {
    setEditingWebsite({
      ...website,
      password: '' // Don't show existing password for security
    })
    setEditShowPassword(false)
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to sign out')
      }
    } catch (err) {
      console.error('Sign out error', err)
    } finally {
      // Don't redirect if auth is bypassed
      if (!BYPASS_AUTH) {
        router.push('/auth/signin')
      }
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
              {BYPASS_AUTH && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  TEST MODE - Auth Disabled
                </span>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <span className="text-gray-700">Welcome, {user?.email || 'Guest'}</span>
              {!BYPASS_AUTH && (
                <button
                  onClick={handleSignOut}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Websites</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Website
          </button>
        </div>

        {/* Add Website Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Add New Website</h2>
              <form onSubmit={handleAddWebsite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newWebsite.name}
                    onChange={(e) => setNewWebsite({...newWebsite, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Website"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    required
                    value={newWebsite.url}
                    onChange={(e) => setNewWebsite({...newWebsite, url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Type
                  </label>
                  <select
                    value={newWebsite.type}
                    onChange={(e) => setNewWebsite({...newWebsite, type: e.target.value, port: e.target.value === 'SFTP' ? '22' : '21'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FTP">FTP</option>
                    <option value="SFTP">SFTP</option>
                    <option value="FTPS">FTPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    required
                    value={newWebsite.host}
                    onChange={(e) => setNewWebsite({...newWebsite, host: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ftp.example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newWebsite.username}
                      onChange={(e) => setNewWebsite({...newWebsite, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      required
                      value={newWebsite.port}
                      onChange={(e) => setNewWebsite({...newWebsite, port: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newWebsite.password}
                      onChange={(e) => setNewWebsite({...newWebsite, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remote Path
                  </label>
                  <input
                    type="text"
                    value={newWebsite.path}
                    onChange={(e) => setNewWebsite({...newWebsite, path: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/public_html"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Add Website
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setShowPassword(false)
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Website Form */}
        {editingWebsite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Edit Website</h2>
              <form onSubmit={handleEditWebsite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingWebsite.name}
                    onChange={(e) => setEditingWebsite({...editingWebsite, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editingWebsite.url}
                    onChange={(e) => setEditingWebsite({...editingWebsite, url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Type
                  </label>
                  <select
                    value={editingWebsite.type}
                    onChange={(e) => setEditingWebsite({...editingWebsite, type: e.target.value, port: e.target.value === 'SFTP' ? '22' : '21'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FTP">FTP</option>
                    <option value="SFTP">SFTP</option>
                    <option value="FTPS">FTPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    required
                    value={editingWebsite.host}
                    onChange={(e) => setEditingWebsite({...editingWebsite, host: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={editingWebsite.username}
                      onChange={(e) => setEditingWebsite({...editingWebsite, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      required
                      value={editingWebsite.port}
                      onChange={(e) => setEditingWebsite({...editingWebsite, port: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={editShowPassword ? "text" : "password"}
                      value={editingWebsite.password}
                      onChange={(e) => setEditingWebsite({...editingWebsite, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password or leave blank"
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowPassword(!editShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                      title={editShowPassword ? "Hide password" : "Show password"}
                    >
                      {editShowPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remote Path
                  </label>
                  <input
                    type="text"
                    value={editingWebsite.path}
                    onChange={(e) => setEditingWebsite({...editingWebsite, path: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/public_html"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Update Website
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWebsite(null)
                      setEditShowPassword(false)
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Websites List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 text-lg">No websites connected yet</div>
              <p className="text-gray-400 mt-2">Click "Add Website" to get started</p>
            </div>
          ) : (
            websites.map((website: any) => (
              <div key={website.id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{website.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{website.url}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {website.type}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/editor/${website.id}`)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Edit Files
                  </button>
                  <button
                    onClick={() => startEdit(website)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Settings
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
