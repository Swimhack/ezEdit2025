import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminDashboardAccess } from '@/lib/middleware/admin-dashboard-auth'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase credentials in admin API')
    throw new Error('Missing Supabase credentials')
  }
  // Service role key bypasses RLS, so we should be able to read/write
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })
  return client
}

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdminDashboardAccess(request)
  if (!adminAuth) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    console.log('Admin fetching quote requests...')
    const supabase = createSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

    console.log('Query params:', { page, limit, offset, status })

    // First, try to get count to verify table access
    const { count: totalCount, error: countError } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Failed to get count:', {
        code: countError.code,
        message: countError.message,
        details: countError.details,
        hint: countError.hint
      })
    } else {
      console.log('Total quote requests count:', totalCount)
    }

    let query = supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: requests, error } = await query

    if (error) {
      console.error('Failed to fetch quote requests:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: 'Failed to fetch quote requests',
        details: error.message 
      }, { status: 500 })
    }

    console.log('Fetched quote requests:', {
      count: requests?.length || 0,
      firstRequest: requests?.[0] ? { id: requests[0].id, domain: requests[0].domain } : null
    })

    // Transform snake_case to camelCase for frontend
    const transformedRequests = (requests || []).map(req => ({
      id: req.id,
      domain: req.domain,
      message: req.message,
      customerEmail: req.customer_email,
      submittedBy: req.submitted_by,
      status: req.status,
      adminNotes: req.admin_notes,
      quotedPrice: req.quoted_price,
      quotedTimeline: req.quoted_timeline,
      createdAt: req.created_at,
      updatedAt: req.updated_at
    }))

    return NextResponse.json({
      items: transformedRequests,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin quote requests error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}
