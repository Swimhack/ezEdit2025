/**
 * ScaleKit Authentication Sign-In API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getScalekitClient, isScalekitConfigured, getAuthorizationUrl } from '@/lib/scalekit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// TEMPORARY: Bypass authentication for testing
const BYPASS_AUTH = true

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Bypass ScaleKit check if auth is disabled
    if (BYPASS_AUTH) {
      // Return success response without ScaleKit redirect
      // This allows the dashboard to load without authentication
      return NextResponse.json({
        success: true,
        message: 'Authentication bypassed - redirecting to dashboard',
        redirectUrl: '/dashboard'
      })
    }

    // Check if ScaleKit is configured
    if (!isScalekitConfigured()) {
      return NextResponse.json(
        { error: 'Authentication service not configured. Please set ScaleKit environment variables.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password, redirectTo, socialLogin } = body

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

    // ScaleKit uses redirect-based authentication
    // Generate authorization URL for ScaleKit hosted login page
    // Normalize redirect URI to ensure exact match (no trailing slash)
    const baseRedirectUri = redirectTo || `${request.nextUrl.origin}/auth/callback`
    const redirectUri = baseRedirectUri.replace(/\/$/, '') // Remove trailing slash
    
    // Use password connection if available (from environment variable)
    const passwordConnectionId = process.env.SCALEKIT_PASSWORD_CONNECTION_ID
    
    console.log('ScaleKit authorization request:', {
      redirectUri,
      origin: request.nextUrl.origin,
      baseRedirectUri,
      redirectTo: redirectTo || 'not provided',
      email: email?.substring(0, 5) + '...',
      passwordConnectionId: passwordConnectionId ? 'set' : 'not set',
      timestamp: new Date().toISOString()
    })
    
    try {
      const authorizationUrl = getAuthorizationUrl(redirectUri, {
        loginHint: email?.trim() || undefined,
        connectionId: passwordConnectionId || undefined
      })

      console.log('ScaleKit authorization URL generated:', {
        url: authorizationUrl.substring(0, 100) + '...',
        redirectUri,
        hasConnectionId: !!passwordConnectionId
      })

      // Set email in cookie for callback handling (only if provided)
      const response = NextResponse.json({
        success: true,
        redirectUrl: authorizationUrl,
        message: 'Redirecting to authentication...'
      })

      // Store redirect URI in cookie to ensure exact match in callback
      response.cookies.set('scalekit_redirect_uri', redirectUri, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300 // 5 minutes - same as code expiration
      })

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
      console.error('Error stack:', error.stack)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        redirectUri,
        email: email?.substring(0, 5) + '...' // Log partial email for debugging
      })
      
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
      
      // Check if it's a client configuration error
      if (error.message && error.message.includes('not configured')) {
        return NextResponse.json(
          { 
            error: 'ScaleKit client not configured. Please check your environment variables.',
            details: error.message
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Failed to initiate authentication',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          type: error.name || 'UnknownError'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Signin API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}