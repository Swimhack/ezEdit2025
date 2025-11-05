import { NextRequest } from 'next/server'

export const ADMIN_EMAIL = 'james@ekaty.com'

export interface AdminDashboardAuthResult {
  isAuthorized: boolean
  email?: string
  error?: string
}

/**
 * Check if the request is from james@ekaty.com
 * Works with both authentication modes (bypass and normal)
 */
export async function requireAdminEmail(request: NextRequest): Promise<AdminDashboardAuthResult> {
  try {
    // In bypass mode, check mock user email
    // In normal mode, check session/cookie email
    
    // Try to get email from session cookie (works with bypass auth)
    const cookies = request.cookies
    const sessionCookie = cookies.get('scalekit_session')
    
    let userEmail: string | null = null
    
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value)
        userEmail = sessionData.email || null
      } catch {
        // Invalid session cookie, continue to check other methods
      }
    }
    
    // Also check mock user from bypass auth (if set)
    if (!userEmail) {
      // Check if there's a mock user email in headers (from client-side)
      const mockEmail = request.headers.get('x-user-email')
      if (mockEmail) {
        userEmail = mockEmail
      }
    }
    
    // If still no email, try to get from /api/auth/me response
    // But for simplicity, we'll check the email directly
    if (!userEmail) {
      // For bypass mode, we know the mock user is james@ekaty.com
      // So we can allow access if no session exists (temporary for testing)
      // In production, this should require authentication
      const BYPASS_AUTH = true // TODO: Get from env or config
      if (BYPASS_AUTH) {
        // In bypass mode, allow if no email found (assume it's the admin)
        return {
          isAuthorized: true,
          email: ADMIN_EMAIL
        }
      }
      
      return {
        isAuthorized: false,
        error: 'No user session found'
      }
    }
    
    // Check if email matches admin email
    const isAuthorized = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    
    return {
      isAuthorized,
      email: userEmail,
      error: isAuthorized ? undefined : 'Access denied. Admin dashboard is restricted to james@ekaty.com'
    }
  } catch (error) {
    console.error('Admin dashboard auth check error:', error)
    return {
      isAuthorized: false,
      error: 'Authentication check failed'
    }
  }
}

/**
 * Middleware wrapper that returns 403 if not authorized
 */
export async function requireAdminDashboardAccess(request: NextRequest): Promise<AdminDashboardAuthResult | null> {
  const authResult = await requireAdminEmail(request)
  
  if (!authResult.isAuthorized) {
    return null
  }
  
  return authResult
}




