import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')
  return createClient(url, key)
}

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const limit = 5
  const window = 60000 // 1 minute

  const data = rateLimitMap.get(ip)
  if (!data || now > data.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window })
    return { allowed: true }
  }

  if (data.count >= limit) {
    return { allowed: false, resetTime: data.resetTime }
  }

  data.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Quote request API endpoint called:', {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString()
    })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      console.log('Rate limit exceeded for IP:', ip)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format. Please check your input and try again.' },
        { status: 400 }
      )
    }
    
    const { domain, message } = body

    // Validation
    if (!domain || !message) {
      return NextResponse.json(
        { error: 'Domain and message are required' },
        { status: 400 }
      )
    }

    if (typeof domain !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    if (domain.length > 255) {
      return NextResponse.json(
        { error: 'Domain name is too long (max 255 characters)' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Create Supabase client with error handling
    let supabase
    try {
      supabase = createSupabaseClient()
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { 
          error: 'Database connection error. Please contact support.',
          details: clientError instanceof Error ? clientError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Insert into database
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        domain: domain.trim(),
        message: message.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error inserting quote request:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      })
      
      // Check if table doesn't exist (common error codes)
      if (
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.message?.toLowerCase().includes('does not exist') || 
        error.message?.toLowerCase().includes('relation') ||
        error.message?.toLowerCase().includes('table') ||
        error.hint?.toLowerCase().includes('table')
      ) {
        return NextResponse.json(
          { 
            error: 'Database configuration error. The quote requests table is not available. Please contact support.',
            details: `Error: ${error.message}`
          },
          { status: 500 }
        )
      }
      
      // Check for constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A quote request with this information already exists.' },
          { status: 409 }
        )
      }
      
      // Check for permission errors
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission')) {
        return NextResponse.json(
          { 
            error: 'Database permission error. Please contact support.',
            details: error.message
          },
          { status: 500 }
        )
      }
      
      // Generic database error
      return NextResponse.json(
        { 
          error: 'Failed to submit quote request. Please try again.',
          details: error.message || 'Unknown database error'
        },
        { status: 500 }
      )
    }

    console.log('Quote request submitted successfully:', {
      id: data?.id,
      domain: domain.trim()
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Quote request submitted successfully',
        data: { id: data.id }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Quote request submission error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
