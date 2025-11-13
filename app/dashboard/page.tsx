'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

export const dynamic = 'force-dynamic'

// TEMPORARY: Enable dashboard without authentication for testing
const BYPASS_AUTH = true

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [websites, setWebsites] = useState<any[]>([])

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        // TEMPORARY: Bypass authentication for testing
        if (BYPASS_AUTH) {
          console.log('⚠️ Authentication bypassed for testing')
          // Create mock user for testing
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
          setProfile(mockUser)
          
          // Try to load websites (may fail without auth, that's okay)
          try {
            const websitesResponse = await fetch('/api/websites')
            if (websitesResponse.ok) {
              const websitesData = await websitesResponse.json()
              setWebsites(websitesData.websites || [])
            }
          } catch (err) {
            console.log('Could not load websites (auth required):', err)
            setWebsites([])
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
        // setProfile(data.user)

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
        setProfile(mockUser)
        setWebsites([])
        setLoading(false)
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
              {BYPASS_AUTH && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  TEST MODE - Auth Disabled
                </span>
              )}
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
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your websites and files</p>
            </div>
            {profile?.plan && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {profile.plan}
              </div>
            )}
          </div>
        </div>

        {/* My Websites Section */}
        {websites.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Websites</h2>
              <button
                onClick={() => router.push('/websites')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websites.map((website: any) => (
                <div key={website.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
                    <h3 className="text-base font-semibold text-white truncate">{website.name}</h3>
                    <p className="text-blue-100 text-xs truncate">{website.url}</p>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">Host: {website.host}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        website.type === 'SFTP' ? 'bg-green-100 text-green-800' :
                        website.type === 'FTPS' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {website.type}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/editor/${website.id}`)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Edit Files
                      </button>
                      <button
                        onClick={() => window.open(website.url, '_blank')}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        title="View Site"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {websites.length === 0 ? '🌐 Connect Website' : '➕ Add Website'}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {websites.length === 0
                ? 'Connect via SFTP/FTP'
                : `${websites.length} connected`
              }
            </p>
            <button
              onClick={() => router.push('/websites')}
              className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              {websites.length === 0 ? 'Get Started' : 'Manage'}
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              💬 AI Assistant
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get editing help
            </p>
            <button
              onClick={() => router.push('/chat')}
              className="w-full bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Start Chat
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              📁 Recent Files
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              View recent edits
            </p>
            <button
              onClick={() => router.push('/files')}
              className="w-full bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 text-sm font-medium"
            >
              View Files
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
