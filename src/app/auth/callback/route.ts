import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/editor', request.url))
}