import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(url, key)
}

/**
 * POST /api/admin/tickets/[id]/comments
 * Add a comment to a ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminAuth = await requireAdmin(request)
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    )
  }

  try {
    const supabase = createSupabaseClient()
    const ticketId = params.id
    const body = await request.json()

    const { comment, is_internal } = body

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Create comment
    const { data: newComment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        author_id: adminAuth.userId,
        author_role: 'admin',
        comment: comment.trim(),
        is_internal: is_internal === true
      })
      .select()
      .single()

    if (commentError || !newComment) {
      console.error('Comment creation error:', commentError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment: newComment
    })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

