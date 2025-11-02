import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithCode, isScalekitConfigured } from '@/lib/scalekit'
import { isSuperAdmin, shouldBypassPaywall, SUPER_ADMIN_EMAIL } from '@/lib/utils/user-permissions'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle ScaleKit errors
  if (error) {
    console.error('ScaleKit OAuth error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error_description || error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('No authorization code received')}`)
  }

  if (!isScalekitConfigured()) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Authentication service not configured')}`)
  }

  try {
    // Get redirect URI from cookie (stored during authorization) or construct from request
    // This ensures exact match with the authorization request
    const cookieStore = await cookies()
    const storedRedirectUri = cookieStore.get('scalekit_redirect_uri')?.value
    
    // Get the full callback URL as it was called (including protocol, host, path)
    // This is critical - ScaleKit validates the exact redirect URI
    const fullCallbackUrl = `${requestUrl.protocol}//${requestUrl.host}${requestUrl.pathname}`
    
    // Normalize redirect URI - remove trailing slash to ensure exact match
    // Use stored URI from cookie first, then fall back to constructed URL
    let redirectUri = storedRedirectUri 
      ? storedRedirectUri.replace(/\/$/, '')
      : fullCallbackUrl.replace(/\/$/, '')
    
    // Ensure redirect URI matches exactly what was used in authorization request
    // Compare with what's in the callback URL
    const normalizedCallbackUrl = fullCallbackUrl.replace(/\/$/, '')
    
    console.log('ScaleKit callback - attempting code exchange:', {
      code: code.substring(0, 10) + '...',
      codeLength: code.length,
      redirectUri,
      storedRedirectUri: storedRedirectUri?.substring(0, 50),
      fullCallbackUrl,
      normalizedCallbackUrl,
      redirectUriMatch: redirectUri === normalizedCallbackUrl,
      timestamp: new Date().toISOString(),
      url: requestUrl.toString()
    })
    
    // Log full URL parameters for debugging
    console.log('Callback URL parameters:', {
      code: code ? 'present' : 'missing',
      error: error || 'none',
      error_description: error_description || 'none',
      state: requestUrl.searchParams.get('state') || 'none',
      allParams: Array.from(requestUrl.searchParams.entries()).map(([k, v]) => ({
        key: k,
        value: k === 'code' ? v.substring(0, 10) + '...' : v
      }))
    })
    
    const authResult = await authenticateWithCode(code, redirectUri)
    const user = authResult.user

    if (!user) {
      throw new Error('No user data received from ScaleKit')
    }

    console.log('User authenticated successfully:', user.email)

    // Check if this is the super admin
    const isAdmin = isSuperAdmin(user.email)
    const role = isAdmin ? 'superadmin' : 'user'
    const paywallBypass = shouldBypassPaywall({
      email: user.email,
      role,
      metadata: { isSuperAdmin: isAdmin, paywallBypass: isAdmin }
    })

    // Create response and set session cookie
    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    
    // Store user session in cookie with admin privileges
    const sessionData = {
      userId: user.id,
      email: user.email,
      accessToken: authResult.accessToken,
      expiresAt: authResult.expiresAt,
      role: role,
      isSuperAdmin: isAdmin,
      paywallBypass: paywallBypass,
      subscriptionTier: isAdmin ? 'enterprise' : 'free',
      metadata: {
        isSuperAdmin: isAdmin,
        paywallBypass: paywallBypass
      }
    }

    response.cookies.set('scalekit_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Clear temporary cookies
    response.cookies.delete('scalekit_email')
    response.cookies.delete('scalekit_redirect_uri')

    return response
  } catch (err: any) {
    console.error('ScaleKit callback error:', err)
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      status: err.status,
      statusCode: err.statusCode,
      response: err.response?.data || err.response?.statusText,
      stack: err.stack?.substring(0, 500)
    })
    
    // Check for specific error types
    let errorMessage = 'Authentication failed'
    
    if (err.status === 401 || err.statusCode === 401) {
      errorMessage = 'Authentication failed: Invalid or expired authorization code. Please try signing in again.'
    } else if (err.message?.includes('invalid_client')) {
      errorMessage = 'ScaleKit configuration error: Invalid client credentials. Please check your environment variables.'
    } else if (err.message?.includes('invalid_grant')) {
      errorMessage = 'Authorization code expired or already used. Please try signing in again.'
    } else if (err.message) {
      errorMessage = `Authentication error: ${err.message}`
    }
    
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(errorMessage)}`)
  }
}