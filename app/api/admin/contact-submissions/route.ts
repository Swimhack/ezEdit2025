import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { requireAdminDashboardAccess } from '@/lib/middleware/admin-dashboard-auth'
import { ContactSubmissionDisplay, AdminListResponse } from '@/types/admin'

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
 * GET /api/admin/contact-submissions
 * List all contact form submissions with filters and pagination
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
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Filters
    const search = searchParams.get('search') // Search name, email, company
    const investorType = searchParams.get('investor_type')
    const followupStatus = searchParams.get('followup_status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build query
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    if (investorType) {
      query = query.eq('investor_type', investorType)
    }

    if (followupStatus) {
      query = query.eq('followup_status', followupStatus)
    }

    if (dateFrom) {
      query = query.gte('submitted_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('submitted_at', dateTo)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching contact submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contact submissions' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })

    if (search) countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    if (investorType) countQuery = countQuery.eq('investor_type', investorType)
    if (followupStatus) countQuery = countQuery.eq('followup_status', followupStatus)
    if (dateFrom) countQuery = countQuery.gte('submitted_at', dateFrom)
    if (dateTo) countQuery = countQuery.lte('submitted_at', dateTo)

    const { count: totalCount } = await countQuery

    // Transform to display format
    const displaySubmissions: ContactSubmissionDisplay[] = (submissions || []).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      email: sub.email,
      company: sub.company,
      investorType: sub.investor_type,
      message: sub.message,
      interestedSections: sub.interested_sections,
      submittedAt: sub.submitted_at,
      followupStatus: sub.followup_status
    }))

    const response: AdminListResponse<ContactSubmissionDisplay> = {
      items: displaySubmissions,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Admin contact submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









