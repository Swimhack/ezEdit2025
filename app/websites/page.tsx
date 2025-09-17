'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

export default function Websites() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [websites, setWebsites] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
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
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/auth/signin')
          return
        }
        const data = await response.json()
        setUser(data.user)

        // Load user's websites
        const websitesResponse = await fetch('/api/websites')
        if (websitesResponse.ok) {
          const websitesData = await websitesResponse.json()
          setWebsites(websitesData.websites || [])
        }

        setLoading(false)
      } catch (error) {
        router.push('/auth/signin')
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

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
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
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
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
                  <input
                    type="password"
                    required
                    value={newWebsite.password}
                    onChange={(e) => setNewWebsite({...newWebsite, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    onClick={() => setShowAddForm(false)}
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
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {website.type}
                  </span>
                  <button
                    onClick={() => router.push(`/editor/${website.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit Files
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