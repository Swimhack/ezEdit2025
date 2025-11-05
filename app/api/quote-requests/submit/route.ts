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
  if (!url || !key) {
    console.error('Missing Supabase credentials:', {
      hasUrl: !!url,
      hasKey: !!key,
      url: url ? 'present' : 'missing',
      keyLength: key ? key.length : 0
    })
    throw new Error('Missing Supabase credentials')
  }
  // Service role key bypasses RLS, so we should be able to read/write
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })
  return client
}

// Helper function to save quote request - simplified with proper error handling
async function saveQuoteRequest(domain: string, message: string): Promise<{ success: boolean; id?: string; error?: any }> {
  const domainTrimmed = domain.trim()
  const messageTrimmed = message.trim()

  console.log('=== SAVE QUOTE REQUEST START ===')
  console.log('Domain:', domainTrimmed)
  console.log('Message length:', messageTrimmed.length)
  console.log('Timestamp:', new Date().toISOString())

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createSupabaseClient()

    const insertData = {
      domain: domainTrimmed,
      message: messageTrimmed,
      status: 'pending' as const
    }

    console.log('Attempting insert with data:', JSON.stringify(insertData, null, 2))

    // Attempt insert and return the inserted row
    const { data, error } = await supabase
      .from('quote_requests')
      .insert(insertData)
      .select('id, domain, message, status, created_at')
      .single()

    // Log the full response
    console.log('Insert response:', {
      hasData: !!data,
      hasError: !!error,
      data: data ? JSON.stringify(data, null, 2) : null,
      error: error ? JSON.stringify(error, null, 2) : null
    })

    if (error) {
      console.error('❌ INSERT FAILED with error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return { success: false, error: error.message }
    }

    if (data && data.id) {
      console.log('✅ Quote request saved successfully!')
      console.log('Saved data:', JSON.stringify(data, null, 2))
      console.log('=== SAVE QUOTE REQUEST SUCCESS ===')
      return { success: true, id: data.id }
    }

    // Unexpected: no error but no data
    console.error('❌ INSERT returned no error but no data - unexpected state')
    return { success: false, error: 'Insert returned no data' }

  } catch (error: any) {
    console.error('❌ EXCEPTION during save:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })
    return { success: false, error: error?.message || 'Unknown error' }
  }
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  console.log('=== QUOTE REQUEST API CALLED ===')
  console.log('Method:', request.method)
  console.log('URL:', request.url)
  console.log('Timestamp:', new Date().toISOString())

  try {
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('Request body parsed successfully')
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    const { domain, message } = body || {}

    // Validate required fields
    const domainStr = (domain || '').toString().trim().substring(0, 255)
    const messageStr = (message || '').toString().trim().substring(0, 2000)

    if (!domainStr || !messageStr) {
      console.warn('Missing required fields:', { hasDomain: !!domainStr, hasMessage: !!messageStr })
      return NextResponse.json(
        {
          success: false,
          error: 'Domain and message are required'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log('Validation passed - calling saveQuoteRequest')

    // Attempt to save
    const saveResult = await saveQuoteRequest(domainStr, messageStr)

    console.log('Save result:', saveResult)

    // Return appropriate response based on save result
    if (!saveResult.success) {
      console.error('❌ FINAL RESULT: Save failed')
      return NextResponse.json(
        {
          success: false,
          error: saveResult.error || 'Failed to save quote request. Please try again.',
          details: process.env.NODE_ENV === 'development' ? saveResult.error : undefined
        },
        {
          status: 500,
          headers: corsHeaders
        }
      )
    }

    // Success!
    console.log('✅ FINAL RESULT: Save succeeded with ID:', saveResult.id)
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
    console.error('❌ UNEXPECTED ERROR in quote request handler:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error
    })

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
}
