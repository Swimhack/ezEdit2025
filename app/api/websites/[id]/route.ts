import { NextRequest, NextResponse } from 'next/server'
import { getWebsite } from '@/lib/websites-memory-store'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Fallback to demo user for development
      return 'demo-user'
    }

    return user.id
  } catch (error) {
    console.error('Failed to get user ID:', error)
    // Fallback to demo user
    return 'demo-user'
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request)
  const { id } = await params

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const website = getWebsite(userId, id)
  if (!website) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  }

  const { password, ...safe } = website as any
  return NextResponse.json({ website: safe })
}

