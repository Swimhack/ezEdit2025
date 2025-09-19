import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Fallback to cookie-based dev auth
      const cookieHeader = (await cookies()).get('ez_user')?.value
      if (cookieHeader) {
        try {
          const userFromCookie = JSON.parse(decodeURIComponent(cookieHeader))
          return NextResponse.json({ user: userFromCookie })
        } catch {}
      }

      // Fallback to demo user for development
      const demoUser = {
        id: 'demo-user',
        email: 'james@ekaty.com',
        role: 'user'
      }
      return NextResponse.json({ user: demoUser })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Failed to get user:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
