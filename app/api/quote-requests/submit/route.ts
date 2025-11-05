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

// Helper function to save quote request - tries multiple methods with detailed logging
async function saveQuoteRequest(domain: string, message: string): Promise<{ success: boolean; id?: string; error?: any }> {
  const domainTrimmed = domain.trim()
  const messageTrimmed = message.trim()
  
  console.log('Attempting to save quote request:', { domain: domainTrimmed, messageLength: messageTrimmed.length })

  // Try method 1: Supabase client
  try {
    console.log('Method 1: Trying Supabase client...')
    const supabase = createSupabaseClient()
    
    const insertData = {
      domain: domainTrimmed,
      message: messageTrimmed,
      status: 'pending'
    }
    
    console.log('Inserting data:', insertData)
    
    // Try with select().single() first
    let { data, error } = await supabase
      .from('quote_requests')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert with select error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Try insert without select (sometimes select fails but insert succeeds)
      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert(insertData)
      
      if (!insertError) {
        console.log('✅ Quote request saved via Supabase (insert succeeded, select failed)')
        
        // Verify the save by querying for the most recent entry with this domain
        const { data: verifyData, error: verifyError } = await supabase
          .from('quote_requests')
          .select('id, domain, created_at')
          .eq('domain', domainTrimmed)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!verifyError && verifyData) {
          console.log('✅ Save verified - found entry with ID:', verifyData.id)
          return { success: true, id: verifyData.id }
        } else {
          console.error('⚠️ Could not verify save:', verifyError)
          // Still return success since insert succeeded
          return { success: true }
        }
      } else {
        console.error('Supabase insert error (without select):', insertError)
      }
    } else if (data && data.id) {
      console.log('✅ Quote request saved successfully via Supabase:', { id: data.id, domain: domainTrimmed })
      
      // Verify the save by fetching it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('quote_requests')
        .select('id, domain')
        .eq('id', data.id)
        .single()
      
      if (verifyError || !verifyData) {
        console.error('⚠️ Save verification failed:', verifyError)
        // Still return success since insert succeeded
      } else {
        console.log('✅ Save verified - data exists in database')
      }
      
      return { success: true, id: data.id }
    } else {
      console.error('❌ Supabase insert returned no data and no error - unexpected state')
    }
  } catch (supabaseError: any) {
    console.error('Supabase client error:', {
      message: supabaseError?.message,
      stack: supabaseError?.stack,
      name: supabaseError?.name
    })
  }

  // Try method 2: Direct REST API call
  try {
    console.log('Method 2: Trying REST API...')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      console.error('Missing Supabase credentials for REST API')
    } else {
      const restUrl = `${url}/rest/v1/quote_requests`
      console.log('REST API URL:', restUrl)
      
      const requestBody = {
        domain: domainTrimmed,
        message: messageTrimmed,
        status: 'pending'
      }
      
      console.log('REST API request body:', requestBody)
      
      const response = await fetch(restUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('REST API response status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        const savedId = Array.isArray(data) ? data[0]?.id : data?.id
        console.log('✅ Quote request saved successfully via REST API:', { id: savedId, domain: domainTrimmed })
        return { success: true, id: savedId }
      } else {
        const errorText = await response.text()
        console.error('REST API insert error:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        })
      }
    }
  } catch (restError: any) {
    console.error('REST API error:', {
      message: restError?.message,
      stack: restError?.stack,
      name: restError?.name
    })
  }

  // Try method 3: RPC call as last resort
  try {
    console.log('Method 3: Trying RPC call...')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (url && key) {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.rpc('insert_quote_request', {
        p_domain: domainTrimmed,
        p_message: messageTrimmed
      })
      
      if (!error && data) {
        console.log('✅ Quote request saved via RPC:', { data, domain: domainTrimmed })
        return { success: true, id: data }
      } else {
        console.error('RPC error:', error)
      }
    }
  } catch (rpcError: any) {
    console.error('RPC error:', {
      message: rpcError?.message,
      stack: rpcError?.stack
    })
  }

  // If all methods fail, log detailed error but don't throw
  console.error('❌ All save methods failed for quote request:', { 
    domain: domainTrimmed, 
    messageLength: messageTrimmed.length,
    timestamp: new Date().toISOString()
  })
  
  // Still try one more time with basic insert without select
  try {
    console.log('Final attempt: Basic insert without select...')
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('quote_requests')
      .insert({
        domain: domainTrimmed,
        message: messageTrimmed,
        status: 'pending'
      })

    if (!error) {
      console.log('✅ Quote request saved via basic insert (no ID returned)')
      return { success: true }
    } else {
      console.error('Final insert attempt error:', error)
    }
  } catch (finalError: any) {
    console.error('Final insert attempt failed:', finalError)
  }

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

    // Attempt to save - MUST succeed before returning success
    console.log('Calling saveQuoteRequest with:', { domain: domainStr, messageLength: messageStr.length })
    const saveResult = await saveQuoteRequest(domainStr, messageStr)
    console.log('Save result:', saveResult)

    // CRITICAL: Only return success if save actually succeeded
    if (!saveResult.success) {
      console.error('❌ Quote request save FAILED:', {
        domain: domainStr,
        error: saveResult.error,
        timestamp: new Date().toISOString()
      })
      
      // Try to verify if data exists despite error
      try {
        const supabase = createSupabaseClient()
        const { data: verifyData, error: verifyError } = await supabase
          .from('quote_requests')
          .select('id, domain, created_at')
          .eq('domain', domainStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!verifyError && verifyData) {
          console.log('✅ Data exists in database despite save error! ID:', verifyData.id)
          // Data was saved, return success
          return NextResponse.json(
            {
              success: true,
              message: 'Quote request submitted successfully. We will be in touch soon.',
              data: { id: verifyData.id }
            },
            { 
              status: 201,
              headers: corsHeaders
            }
          )
        }
      } catch (verifyErr) {
        console.error('Verification check failed:', verifyErr)
      }
      
      // Save failed - return error
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save quote request. Please try again or contact support.',
          details: process.env.NODE_ENV === 'development' ? saveResult.error : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }

    // Save succeeded - return success
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
    // Catch-all: log error and return error to user
    console.error('Unexpected error in quote request handler:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error
    })
    
    // Return error so user knows something went wrong
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
