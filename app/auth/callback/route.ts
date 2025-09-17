import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.user) {
        console.log('User authenticated successfully:', data.user.email)
        // Successful authentication, redirect to dashboard
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code parameter, redirect to sign in
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('No authorization code received')}`)
}