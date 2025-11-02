/**
 * ScaleKit Authentication Sign-Up API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
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
    const { email, password, plan, company, redirectTo } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // ScaleKit handles user registration through their hosted UI
    // Generate authorization URL for ScaleKit hosted signup/login page
    const redirectUri = redirectTo || `${request.nextUrl.origin}/auth/callback`
    
    try {
      const authorizationUrl = getAuthorizationUrl(redirectUri, {
        loginHint: email.trim()
      })

      // Store signup metadata in cookie
      const response = NextResponse.json({
        success: true,
        redirectUrl: authorizationUrl,
        message: 'Redirecting to registration...'
      })

      // Store signup metadata temporarily
      const signupData = {
        email: email.trim(),
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

      return response
    } catch (error: any) {
      console.error('ScaleKit authorization error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to initiate registration' },
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

