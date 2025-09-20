'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
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
        setProfile(data.user)

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
      router.push('/auth/signin')
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
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EzEdit Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your AI-powered website editing platform
          </p>

          {profile?.plan && (
            <div className="mb-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Plan: {profile.plan}
              </div>
            </div>
          )}

          {/* My Websites Section */}
          {websites.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Websites</h2>
                <button
                  onClick={() => router.push('/websites')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Websites →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map((website: any) => (
                  <div key={website.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                      <h3 className="text-lg font-semibold text-white truncate">{website.name}</h3>
                      <p className="text-blue-100 text-sm truncate">{website.url}</p>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-16">Host:</span>
                          <span className="truncate">{website.host}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-16">Type:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            website.type === 'SFTP' ? 'bg-green-100 text-green-800' :
                            website.type === 'FTPS' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {website.type}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-16">User:</span>
                          <span className="truncate">{website.username}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-16">Port:</span>
                          <span>{website.port}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/editor/${website.id}`)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Edit Files
                        </button>
                        <button
                          onClick={() => window.open(website.url, '_blank')}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          View Site
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {websites.length === 0 ? 'Connect Website' : 'Add More Websites'}
              </h3>
              <p className="text-gray-600 mb-4">
                {websites.length === 0
                  ? 'Connect your first website via FTP/SFTP'
                  : `You have ${websites.length} connected website${websites.length !== 1 ? 's' : ''}. Add more to expand your editing capabilities.`
                }
              </p>
              <button
                onClick={() => router.push('/websites')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                {websites.length === 0 ? 'Add Website' : 'Manage Websites'}
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Assistant
              </h3>
              <p className="text-gray-600 mb-4">
                Get help with your website editing
              </p>
              <button
                onClick={() => router.push('/chat')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Start Chat
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Recent Files
              </h3>
              <p className="text-gray-600 mb-4">
                View your recently edited files
              </p>
              <button
                onClick={() => router.push('/files')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
              >
                View Files
              </button>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <div className="max-w-2xl mx-auto text-left">
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Connect your website via FTP/SFTP credentials</li>
                <li>Browse your website files in our intuitive editor</li>
                <li>Use AI commands to modify your code with natural language</li>
                <li>Save changes directly to your server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



