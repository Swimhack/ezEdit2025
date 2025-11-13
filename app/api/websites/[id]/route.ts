import { NextRequest, NextResponse } from 'next/server'
import { getWebsite, updateWebsite } from '@/lib/websites-memory-store'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// TEMPORARY: Bypass authentication for testing
const BYPASS_AUTH = true

async function getUserId(request: NextRequest): Promise<string | null> {
  // TEMPORARY: Always return test-user-123 for testing (matches editor page)
  if (BYPASS_AUTH) {
    return 'test-user-123'
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Fallback to test user for development
      return 'test-user-123'
    }

    return user.id
  } catch (error) {
    console.error('Failed to get user ID:', error)
    // Fallback to test user
    return 'test-user-123'
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

  // Return full website data including password for FTP connection
  // In production, this should be secured with proper authentication
  return NextResponse.json({ website })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request)
  const { id } = await params

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const website = getWebsite(userId, id)
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Only update password if provided (not empty)
    const updates: any = {
      name: body.name,
      url: body.url,
      type: body.type,
      host: body.host?.trim(),
      username: body.username,
      port: String(body.port || website.port),
      path: body.path || '/'
    }

    // Only update password if a new one is provided
    if (body.password && body.password.trim() !== '') {
      updates.password = body.password
    } else {
      // Keep existing password if not provided
      updates.password = website.password
    }

    const updated = updateWebsite(userId, id, updates)
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update website' }, { status: 500 })
    }

    const { password: _, ...safe } = updated as any
    return NextResponse.json({ website: safe })
  } catch (error) {
    console.error('Failed to update website:', error)
    return NextResponse.json(
      { error: 'Failed to update website' },
      { status: 500 }
    )
  }
}

