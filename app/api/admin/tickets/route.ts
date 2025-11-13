import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { requireAdmin } from '@/lib/middleware/admin-auth'

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
 * GET /api/admin/tickets
 * List all tickets with filters and pagination
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const adminAuth = await requireAdmin(request)
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
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
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search') // Search domain or email
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build query
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (platform) {
      query = query.eq('detected_platform', platform)
    }

    if (search) {
      query = query.or(`domain.ilike.%${search}%,customer_email.ilike.%${search}%`)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    if (status) countQuery = countQuery.eq('status', status)
    if (platform) countQuery = countQuery.eq('detected_platform', platform)
    if (search) countQuery = countQuery.or(`domain.ilike.%${search}%,customer_email.ilike.%${search}%`)
    if (dateFrom) countQuery = countQuery.gte('created_at', dateFrom)
    if (dateTo) countQuery = countQuery.lte('created_at', dateTo)

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin tickets list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









