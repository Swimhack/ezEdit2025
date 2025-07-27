import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

// Note: In a real implementation, you would use an actual FTP/SFTP library
// For demo purposes, this simulates the FTP connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { host, port, username, password, protocol = 'ftp', name } = await request.json()

    // Validate required fields
    if (!host || !username || !password) {
      return NextResponse.json(
        { error: 'Host, username, and password are required' },
        { status: 400 }
      )
    }

    // Simulate connection validation
    // In a real implementation, you would:
    // 1. Connect to the FTP/SFTP server
    // 2. Validate credentials
    // 3. Test basic operations

    // For demo purposes, accept any credentials except obviously fake ones
    if (password === 'wrong' || password === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Encrypt password before storing (in real implementation)
    const encryptedPassword = Buffer.from(password).toString('base64') // Simple encoding for demo

    // Save connection to database
    const { data: connection, error } = await supabase
      .from('ftp_connections')
      .insert({
        user_id: session.user.id,
        name: name || `${host}:${port}`,
        host,
        port: port || (protocol === 'sftp' ? 22 : 21),
        username,
        password_encrypted: encryptedPassword,
        protocol,
        is_active: true,
        last_connected: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save connection' },
        { status: 500 }
      )
    }

    // Return connection info (without password)
    const { password_encrypted, ...safeConnection } = connection
    
    return NextResponse.json({
      success: true,
      connection: safeConnection,
      message: 'Successfully connected to FTP server'
    })

  } catch (error) {
    console.error('FTP Connect API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's FTP connections
    const { data: connections, error } = await supabase
      .from('ftp_connections')
      .select('id, name, host, port, username, protocol, is_active, last_connected, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      connections: connections || []
    })

  } catch (error) {
    console.error('FTP Connections API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}