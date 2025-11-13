import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// GET - Fetch single quote request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdmin()
    const { id } = params

    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching quote request:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quote request' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Quote request not found' },
        { status: 404 }
      )
    }

    // Transform snake_case to camelCase
    const transformed = {
      id: data.id,
      domain: data.domain,
      message: data.message,
      customerEmail: data.customer_email,
      submittedBy: data.submitted_by,
      status: data.status,
      adminNotes: data.admin_notes,
      quotedPrice: data.quoted_price,
      quotedTimeline: data.quoted_timeline,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error in GET quote request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update quote request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdmin()
    const { id } = params
    const body = await request.json()

    // Allowed fields to update
    const allowedFields = [
      'status',
      'admin_notes',
      'quoted_price',
      'quoted_timeline',
      'customer_email'
    ]

    // Filter only allowed fields
    const updates: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    console.log('Updating quote request:', id, updates)

    const { data, error } = await supabase
      .from('quote_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating quote request:', error)
      return NextResponse.json(
        { error: 'Failed to update quote request' },
        { status: 500 }
      )
    }

    console.log('Quote request updated successfully:', data)

    // Transform snake_case to camelCase
    const transformed = {
      id: data.id,
      domain: data.domain,
      message: data.message,
      customerEmail: data.customer_email,
      submittedBy: data.submitted_by,
      status: data.status,
      adminNotes: data.admin_notes,
      quotedPrice: data.quoted_price,
      quotedTimeline: data.quoted_timeline,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error in PATCH quote request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete quote request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdmin()
    const { id } = params

    console.log('Deleting quote request:', id)

    const { error } = await supabase
      .from('quote_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting quote request:', error)
      return NextResponse.json(
        { error: 'Failed to delete quote request' },
        { status: 500 }
      )
    }

    console.log('Quote request deleted successfully:', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE quote request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
