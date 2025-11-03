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
 * POST /api/admin/tickets/[id]/quote
 * Send quote email to customer and update ticket status
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

    const { quoted_price, quoted_timeline, admin_notes } = body

    if (!quoted_price || !quoted_timeline) {
      return NextResponse.json(
        { error: 'quoted_price and quoted_timeline are required' },
        { status: 400 }
      )
    }

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

    // Update ticket with quote
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({
        quoted_price: parseFloat(quoted_price),
        quoted_timeline: quoted_timeline,
        admin_notes: admin_notes || ticket.admin_notes,
        status: 'quoted'
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (updateError || !updatedTicket) {
      console.error('Ticket update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      )
    }

    // TODO: Send quote email to customer
    // await sendQuoteEmail(ticket.customer_email, {
    //   ticket_id: ticketId,
    //   price: quoted_price,
    //   timeline: quoted_timeline
    // })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: 'Quote sent successfully'
    })
  } catch (error) {
    console.error('Send quote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

