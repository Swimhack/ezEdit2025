/**
 * ScaleKit Authentication Sign-Up API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isScalekitConfigured, getAuthorizationUrl } from '@/lib/scalekit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Check if ScaleKit is configured
    if (!isScalekitConfigured()) {
      return NextResponse.json(
        { error: 'Authentication service not configured. Please set ScaleKit environment variables.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password, plan, company, redirectTo, socialLogin } = body

    // Email is optional for social login (Google, etc.)
    if (!socialLogin && !email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation (only if email is provided)
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // ScaleKit handles user registration through their hosted UI
    // Generate authorization URL for ScaleKit hosted signup/login page
    // Normalize redirect URI to ensure exact match (no trailing slash)
    const baseRedirectUri = redirectTo || `${request.nextUrl.origin}/auth/callback`
    const redirectUri = baseRedirectUri.replace(/\/$/, '') // Remove trailing slash
    
    console.log('ScaleKit signup authorization request:', {
      redirectUri,
      origin: request.nextUrl.origin,
      baseRedirectUri,
      redirectTo: redirectTo || 'not provided',
      email: email?.substring(0, 5) + '...',
      timestamp: new Date().toISOString()
    })
    
    try {
      const authorizationUrl = getAuthorizationUrl(redirectUri, {
        loginHint: email?.trim() || undefined
      })

      console.log('ScaleKit signup authorization URL generated:', {
        url: authorizationUrl.substring(0, 100) + '...',
        redirectUri
      })

      // Store signup metadata in cookie
      const response = NextResponse.json({
        success: true,
        redirectUrl: authorizationUrl,
        message: 'Redirecting to registration...'
      })

      // Store redirect URI in cookie to ensure exact match in callback
      // This is critical - ScaleKit validates the exact redirect URI
      response.cookies.set('scalekit_redirect_uri', redirectUri, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300 // 5 minutes - same as code expiration
      })

      // Store signup metadata temporarily (only if provided)
      if (email || plan || company) {
        const signupData = {
          email: email?.trim() || '',
          plan: plan || 'FREE',
          company: company || '',
          timestamp: Date.now()
        }

        response.cookies.set('scalekit_signup', JSON.stringify(signupData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600 // 10 minutes
        })
      }

      // Store email in cookie temporarily (only if provided)
      if (email) {
        response.cookies.set('scalekit_email', email.trim(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 300 // 5 minutes
        })
      }

      return response
    } catch (error: any) {
      console.error('ScaleKit authorization error:', error)
      
      // Check if it's a placeholder values error
      if (error.message && error.message.includes('placeholder')) {
        return NextResponse.json(
          { 
            error: 'ScaleKit configuration error: Please replace placeholder values in .env.local with your actual ScaleKit credentials. See SCALEKIT_ERROR_FIX.md for instructions.',
            details: 'Environment variables contain placeholder values'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Failed to initiate registration',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

