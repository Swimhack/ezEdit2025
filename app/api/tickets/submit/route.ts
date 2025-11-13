import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { platformDetection } from '@/lib/platform-detection'
import { credentialEncryption } from '@/lib/db/encryption'
import { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(url, key)
}

interface TicketSubmissionBody {
  customer_email: string
  customer_name?: string
  domain: string
  has_existing_website: boolean
  request_description: string
  credentials?: {
    credential_type: 'ftp' | 'sftp' | 'wordpress_api' | 'shopify_api' | 'wix_api'
    host?: string
    port?: number
    username?: string
    password?: string
    api_key?: string
    api_secret?: string
    path?: string
  }
  submitted_by?: string // Optional user ID if logged in
}

/**
 * POST /api/tickets/submit
 * Submit a new ticket with platform detection and credential encryption
 */
export async function POST(request: NextRequest) {
  try {
    const body: TicketSubmissionBody = await request.json()

    // Validation
    if (!body.customer_email || !body.domain || !body.request_description) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_email, domain, request_description' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate domain format (basic)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    const normalizedDomain = body.domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]

    if (!domainRegex.test(normalizedDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient()

    // Detect platform if website exists
    let detectedPlatform: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown' = 'unknown'
    let platformConfidence = 0
    let detectionMethod: 'api' | 'custom' | 'manual' = 'manual'

    if (body.has_existing_website) {
      try {
        const detectionResult = await platformDetection.detect(normalizedDomain)
        detectedPlatform = detectionResult.platform
        platformConfidence = detectionResult.confidence
        detectionMethod = detectionResult.method
      } catch (error) {
        console.error('Platform detection failed:', error)
        // Continue with unknown platform
      }
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        customer_email: body.customer_email.trim().toLowerCase(),
        customer_name: body.customer_name?.trim() || null,
        domain: normalizedDomain,
        has_existing_website: body.has_existing_website ?? true,
        detected_platform: detectedPlatform === 'unknown' ? null : detectedPlatform,
        platform_confidence: platformConfidence > 0 ? platformConfidence : null,
        detection_method: detectionMethod,
        request_description: body.request_description.trim(),
        status: 'submitted',
        submitted_by: body.submitted_by || null
      })
      .select()
      .single()

    if (ticketError || !ticket) {
      console.error('Ticket creation error:', ticketError)
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }

    // Encrypt and store credentials if provided
    if (body.credentials && Object.keys(body.credentials).length > 0) {
      const { credential_type, host, username, password, api_key, api_secret, path, port } = body.credentials

      // Encrypt sensitive fields
      const credentialFields: Record<string, string> = {}
      if (host) credentialFields.host = host
      if (username) credentialFields.username = username
      if (password) credentialFields.password = password
      if (api_key) credentialFields.api_key = api_key
      if (api_secret) credentialFields.api_secret = api_secret

      const { encrypted_data } = credentialEncryption.encryptCredentials(credentialFields)

      const { error: credError } = await supabase
        .from('ticket_credentials')
        .insert({
          ticket_id: ticket.id,
          credential_type,
          port: port || null,
          path: path || null,
          encrypted_data
        })

      if (credError) {
        console.error('Credential storage error:', credError)
        // Don't fail the ticket creation if credential storage fails
        // Admin can add credentials later
      }
    }

    // TODO: Send confirmation email to customer
    // TODO: Send notification email to admin

    return NextResponse.json({
      success: true,
      ticket_id: ticket.id,
      message: 'Ticket submitted successfully'
    })
  } catch (error) {
    console.error('Ticket submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









