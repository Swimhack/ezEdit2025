'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import DashboardStats from '@/components/admin/DashboardStats'
import ContactSubmissionsList from '@/components/admin/ContactSubmissionsList'
import TicketsList from '@/components/admin/TicketsList'
import SubmissionDetail from '@/components/admin/SubmissionDetail'
import { AdminDashboardStats, ContactSubmissionDisplay, TicketDisplay } from '@/types/admin'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'contacts' | 'tickets'>('contacts')
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmissionDisplay[]>([])
  const [tickets, setTickets] = useState<TicketDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmissionDisplay | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadData()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // Check if user is admin by calling /api/auth/me
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/')
        return
      }

      const data = await response.json()
      const email = data.user?.email || ''

      // Only james@ekaty.com can access
      if (email.toLowerCase() !== 'james@ekaty.com') {
        alert('Access denied. Admin dashboard is restricted to james@ekaty.com')
        router.push('/')
        return
      }

      setUserEmail(email)
    } catch (error) {
      console.error('Admin access check error:', error)
      // In bypass mode, allow access
      setUserEmail('james@ekaty.com')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load contact submissions
      const contactsResponse = await fetch('/api/admin/contact-submissions?limit=100')
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        setContactSubmissions(contactsData.items || [])
      }

      // Load tickets
      const ticketsResponse = await fetch('/api/admin/tickets?limit=100')
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setTickets(ticketsData.tickets || [])
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSubmission = (submission: ContactSubmissionDisplay) => {
    setSelectedSubmission(submission)
    setIsDetailOpen(true)
  }

  return (
    <AdminLayout userEmail={userEmail}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage contact form submissions and ticket requests
          </p>
        </div>

        {/* Statistics */}
        <DashboardStats stats={stats} loading={loading} />

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`${
                  activeTab === 'contacts'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Contact Submissions
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'contacts' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contactSubmissions.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`${
                  activeTab === 'tickets'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Tickets
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'tickets' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tickets.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'contacts' && (
          <ContactSubmissionsList
            submissions={contactSubmissions}
            loading={loading}
            onViewDetails={handleViewSubmission}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsList
            tickets={tickets}
            loading={loading}
          />
        )}

        {/* Submission Detail Modal */}
        <SubmissionDetail
          submission={selectedSubmission}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedSubmission(null)
          }}
        />
      </div>
    </AdminLayout>
  )
}

