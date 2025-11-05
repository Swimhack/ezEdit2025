import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminDashboardAccess } from '@/lib/middleware/admin-dashboard-auth'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdminDashboardAccess(request)
  if (!adminAuth) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const supabase = createSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

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
      console.error('Failed to fetch quote requests:', error)
      return NextResponse.json({ error: 'Failed to fetch quote requests' }, { status: 500 })
    }

    const { count } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      items: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin quote requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
