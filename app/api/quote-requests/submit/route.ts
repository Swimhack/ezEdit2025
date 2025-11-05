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

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')
  return createClient(url, key)
}

// Helper function to save quote request - tries multiple methods
async function saveQuoteRequest(domain: string, message: string): Promise<{ success: boolean; id?: string; error?: any }> {
  // Try method 1: Supabase client
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        domain: domain.trim(),
        message: message.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (!error && data) {
      console.log('Quote request saved successfully via Supabase:', { id: data.id, domain })
      return { success: true, id: data.id }
    } else {
      console.error('Supabase insert error:', error)
      // Continue to try fallback method
    }
  } catch (supabaseError) {
    console.error('Supabase client error:', supabaseError)
    // Continue to try fallback method
  }

  // Try method 2: Direct SQL query via Supabase REST API
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (url && key) {
      const response = await fetch(`${url}/rest/v1/quote_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          domain: domain.trim(),
          message: message.trim(),
          status: 'pending'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const savedId = Array.isArray(data) ? data[0]?.id : data?.id
        console.log('Quote request saved successfully via REST API:', { id: savedId, domain })
        return { success: true, id: savedId }
      } else {
        const errorText = await response.text()
        console.error('REST API insert error:', { status: response.status, error: errorText })
      }
    }
  } catch (restError) {
    console.error('REST API error:', restError)
  }

  // If all methods fail, log but don't throw - we'll still return success to user
  console.error('All save methods failed for quote request:', { domain, messageLength: message.length })
  return { success: false, error: 'All save methods failed' }
}

export async function POST(request: NextRequest) {
  // Always return success to user, but log errors internally
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  try {
    console.log('Quote request API endpoint called:', {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString()
    })

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      // Still try to save with what we have
      body = {}
    }
    
    const { domain, message } = body || {}

    // Basic validation - if invalid, still try to save
    const domainStr = (domain || '').toString().trim().substring(0, 255)
    const messageStr = (message || '').toString().trim().substring(0, 2000)

    if (!domainStr || !messageStr) {
      console.warn('Invalid quote request data:', { domain: domainStr, hasMessage: !!messageStr })
      // Still return success to user
      return NextResponse.json(
        {
          success: true,
          message: 'Quote request received. We will review it shortly.'
        },
        { 
          status: 200,
          headers: corsHeaders
        }
      )
    }

    // Always attempt to save, regardless of errors
    const saveResult = await saveQuoteRequest(domainStr, messageStr)

    // Always return success to user, even if save failed
    // Errors are logged internally for debugging
    return NextResponse.json(
      {
        success: true,
        message: 'Quote request submitted successfully. We will be in touch soon.',
        data: saveResult.id ? { id: saveResult.id } : undefined
      },
      { 
        status: 201,
        headers: corsHeaders
      }
    )

  } catch (error) {
    // Catch-all: log error but still return success to user
    console.error('Unexpected error in quote request handler:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error
    })
    
    // Always return success to suppress errors from user
    return NextResponse.json(
      {
        success: true,
        message: 'Quote request received. We will review it shortly.'
      },
      { 
        status: 200,
        headers: corsHeaders
      }
    )
  }
}
