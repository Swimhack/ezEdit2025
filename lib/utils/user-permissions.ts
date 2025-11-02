/**
 * Utility functions for checking admin access and paywall bypass
 */

import { cookies } from 'next/headers'

export const SUPER_ADMIN_EMAIL = 'james@ekaty.com'

export interface UserPermissions {
  isSuperAdmin: boolean
  role: 'user' | 'developer' | 'admin' | 'superadmin'
  paywallBypass: boolean
  subscriptionTier?: string
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  return email === SUPER_ADMIN_EMAIL
}

/**
 * Check if a user should bypass paywall
 */
export function shouldBypassPaywall(user: { email?: string | null; role?: string; metadata?: any }): boolean {
  // Super admin always bypasses
  if (isSuperAdmin(user.email)) {
    return true
  }

  // Check metadata for paywall bypass flag
  if (user.metadata?.paywallBypass === true) {
    return true
  }

  // Check role
  if (user.role === 'superadmin' || user.role === 'admin') {
    return true
  }

  return false
}

/**
 * Get user permissions from session
 */
export async function getUserPermissions(): Promise<UserPermissions | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('scalekit_session')

    if (!sessionCookie?.value) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const email = sessionData.email

    const isAdmin = isSuperAdmin(email)
    const role = sessionData.role || (isAdmin ? 'superadmin' : 'user')

    return {
      isSuperAdmin: isAdmin,
      role: role as UserPermissions['role'],
      paywallBypass: shouldBypassPaywall({ email, role, metadata: sessionData.metadata }),
      subscriptionTier: sessionData.subscriptionTier || 'enterprise'
    }
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
}

/**
 * Check if user has access to a feature (with paywall check)
 */
export function hasFeatureAccess(
  user: UserPermissions | null,
  feature: string
): boolean {
  if (!user) {
    return false
  }

  // Super admin has access to everything
  if (user.isSuperAdmin || user.paywallBypass) {
    return true
  }

  // Regular feature checks based on subscription tier
  // This can be expanded based on your subscription model
  return true // Default to true for now, can add restrictions later
}

/**
 * Get user role from session
 */
export async function getUserRole(): Promise<string> {
  const permissions = await getUserPermissions()
  return permissions?.role || 'user'
}

/**
 * Check if user is admin or super admin
 */
export async function isAdminUser(): Promise<boolean> {
  const permissions = await getUserPermissions()
  return permissions?.isSuperAdmin || permissions?.role === 'admin' || permissions?.role === 'superadmin'
}

