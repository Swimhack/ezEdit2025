import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { credentialEncryption } from '@/lib/db/encryption'

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
 * GET /api/admin/tickets/[id]
 * Get ticket details with decrypted credentials (masked)
 */
export async function GET(
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

    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get credentials
    const { data: credentials } = await supabase
      .from('ticket_credentials')
      .select('*')
      .eq('ticket_id', ticketId)
      .single()

    // Decrypt credentials (for admin view)
    let decryptedCredentials = null
    if (credentials?.encrypted_data) {
      const decrypted = credentialEncryption.decryptCredentials(
        credentials.encrypted_data as Record<string, any>
      )
      
      // Mask sensitive fields
      decryptedCredentials = {
        ...credentials,
        host: decrypted.host,
        username: decrypted.username,
        password: credentialEncryption.maskCredential(decrypted.password),
        api_key: credentialEncryption.maskCredential(decrypted.api_key),
        api_secret: credentialEncryption.maskCredential(decrypted.api_secret),
        // Keep non-sensitive fields
        port: credentials.port,
        path: credentials.path,
        credential_type: credentials.credential_type
      }
    }

    // Get comments
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      ticket,
      credentials: decryptedCredentials,
      comments: comments || []
    })
  } catch (error) {
    console.error('Admin ticket detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/tickets/[id]
 * Update ticket (status, notes, etc.)
 */
export async function PATCH(
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

    // Allowed fields to update
    const allowedFields = [
      'status',
      'quoted_price',
      'quoted_timeline',
      'admin_notes',
      'detected_platform',
      'platform_confidence'
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single()

    if (error || !ticket) {
      console.error('Ticket update error:', error)
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ticket
    })
  } catch (error) {
    console.error('Admin ticket update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

