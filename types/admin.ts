/**
 * Type definitions for Admin Dashboard
 */

export interface AdminDashboardStats {
  contactSubmissions: {
    total: number
    last30Days: number
    last24Hours: number
    byInvestorType: Record<string, number>
    needsFollowUp: number
  }
  tickets: {
    total: number
    pending: number
    inProgress: number
    completed: number
    byStatus: Record<string, number>
    byPlatform: Record<string, number>
  }
  recentActivity: {
    contactSubmissions: number
    tickets: number
  }
}

export interface ContactSubmissionDisplay {
  id: string
  name: string
  email: string
  company?: string | null
  investorType?: string | null
  message?: string | null
  interestedSections?: string[] | null
  submittedAt: string
  followupStatus?: string | null
  completenessScore?: number
}

export interface TicketDisplay {
  id: string
  customer_email: string
  customer_name?: string | null
  domain: string
  detected_platform?: string | null
  request_description: string
  status: string
  quoted_price?: number | null
  quoted_timeline?: string | null
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

export interface AdminListResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

