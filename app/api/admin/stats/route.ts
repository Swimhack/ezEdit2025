import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { requireAdminDashboardAccess } from '@/lib/middleware/admin-dashboard-auth'
import { AdminDashboardStats } from '@/types/admin'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(url, key)
}

/**
 * GET /api/admin/stats
 * Get dashboard statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  // Check admin email authorization
  const adminAuth = await requireAdminDashboardAccess(request)
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Access denied. Admin dashboard is restricted to james@ekaty.com' },
      { status: 403 }
    )
  }

  try {
    const supabase = createSupabaseClient()
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Contact submissions stats
    const { count: totalContacts } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })

    const { count: contactsLast30Days } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', last30Days.toISOString())

    const { count: contactsLast24Hours } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', last24Hours.toISOString())

    const { data: contactsNeedingFollowUp } = await supabase
      .from('contact_submissions')
      .select('investor_type, followup_status')
      .or('followup_status.eq.pending,followup_status.is.null')

    // Group by investor type
    const byInvestorType: Record<string, number> = {}
    if (contactsNeedingFollowUp) {
      contactsNeedingFollowUp.forEach((contact: any) => {
        const type = contact.investor_type || 'unspecified'
        byInvestorType[type] = (byInvestorType[type] || 0) + 1
      })
    }

    // Tickets stats
    const { count: totalTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    const { count: pendingTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'admin_review', 'quoted'])

    const { count: inProgressTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')

    const { count: completedTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get tickets by status
    const { data: ticketsByStatus } = await supabase
      .from('tickets')
      .select('status')

    const statusCounts: Record<string, number> = {}
    if (ticketsByStatus) {
      ticketsByStatus.forEach((ticket: any) => {
        const status = ticket.status || 'unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
    }

    // Get tickets by platform
    const { data: ticketsByPlatform } = await supabase
      .from('tickets')
      .select('detected_platform')

    const platformCounts: Record<string, number> = {}
    if (ticketsByPlatform) {
      ticketsByPlatform.forEach((ticket: any) => {
        const platform = ticket.detected_platform || 'unknown'
        platformCounts[platform] = (platformCounts[platform] || 0) + 1
      })
    }

    // Recent activity (last 24 hours)
    const { count: recentContacts } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', last24Hours.toISOString())

    const { count: recentTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString())

    const stats: AdminDashboardStats = {
      contactSubmissions: {
        total: totalContacts || 0,
        last30Days: contactsLast30Days || 0,
        last24Hours: contactsLast24Hours || 0,
        byInvestorType,
        needsFollowUp: contactsNeedingFollowUp?.length || 0
      },
      tickets: {
        total: totalTickets || 0,
        pending: pendingTickets || 0,
        inProgress: inProgressTickets || 0,
        completed: completedTickets || 0,
        byStatus: statusCounts,
        byPlatform: platformCounts
      },
      recentActivity: {
        contactSubmissions: recentContacts || 0,
        tickets: recentTickets || 0
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

