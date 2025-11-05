import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(url, key)
}

export interface AdminAuthResult {
  isAdmin: boolean
  userId?: string
  role?: string
  error?: string
}

/**
 * Check if the request is from an authenticated admin user
 * Reads the authorization header or cookie to get the user session
 */
export async function checkAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const supabase = createSupabaseClient()

    // Try to get auth token from Authorization header
    const authHeader = request.headers.get('authorization')
    let accessToken: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
    } else {
      // Try to get from cookies
      const cookies = request.cookies
      accessToken = cookies.get('sb-access-token')?.value || null
    }

    if (!accessToken) {
      return {
        isAdmin: false,
        error: 'No authentication token provided'
      }
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return {
        isAdmin: false,
        error: 'Invalid authentication token'
      }
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        isAdmin: false,
        error: 'User profile not found'
      }
    }

    const role = profile.role
    const isAdmin = role === 'admin' || role === 'superadmin'

    return {
      isAdmin,
      userId: user.id,
      role
    }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return {
      isAdmin: false,
      error: 'Authentication check failed'
    }
  }
}

/**
 * Middleware wrapper for admin-only routes
 * Returns 403 if user is not an admin
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult | null> {
  const authResult = await checkAdminAuth(request)

  if (!authResult.isAdmin) {
    return null
  }

  return authResult
}




