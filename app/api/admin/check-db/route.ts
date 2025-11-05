import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminDashboardAccess } from '@/lib/middleware/admin-dashboard-auth'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

/**
 * GET /api/admin/check-db
 * Check if contact_submissions table exists (admin only)
 */
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdminDashboardAccess(request)
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Access denied. Admin dashboard is restricted to james@ekaty.com' },
      { status: 403 }
    )
  }

  try {
    const supabase = createSupabaseClient()
    
    // Try to query the table
    const { data, error, count } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          exists: false,
          error: 'Table does not exist',
          message: 'The contact_submissions table has not been created yet.',
          migration: 'Run migration: supabase/migrations/004_contact_submissions.sql',
          instructions: [
            '1. Go to Supabase Dashboard → SQL Editor',
            '2. Copy the contents of supabase/migrations/004_contact_submissions.sql',
            '3. Paste and run the SQL in the editor',
            '4. Verify the table was created in Table Editor'
          ]
        })
      }
      
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      exists: true,
      count: count || 0,
      message: 'Contact form is ready!',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    })

  } catch (error: any) {
    return NextResponse.json({
      exists: false,
      error: error.message || 'Unknown error',
      details: 'Check Supabase configuration'
    }, { status: 500 })
  }
}




