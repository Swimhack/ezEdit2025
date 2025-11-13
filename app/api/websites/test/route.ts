import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { Client as SSHClient } from 'ssh2'

/**
 * Test connection endpoint - validates credentials before saving
 * Best practice: Always test connections before storing credentials
 */

interface ConnectionTest {
  host: string
  port: string
  username: string
  password: string
  type: 'FTP' | 'FTPS' | 'SFTP'
  path?: string
}

interface TestResult {
  success: boolean
  message: string
  details?: {
    currentDir?: string
    fileCount?: number
    sampleFiles?: string[]
    detectedPlatform?: string
  }
  error?: {
    code: string
    message: string
    suggestion: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConnectionTest = await request.json()
    
    // Validate required fields
    const required = ['host', 'port', 'username', 'password', 'type']
    for (const field of required) {
      if (!body[field as keyof ConnectionTest]) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'MISSING_FIELD',
            message: `Missing required field: ${field}`,
            suggestion: `Please provide a ${field}`
          }
        }, { status: 400 })
      }
    }

    // Test based on connection type
    let result: TestResult

    if (body.type === 'SFTP') {
      result = await testSFTPConnection(body)
    } else {
      result = await testFTPConnection(body)
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error: any) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: {
        code: 'TEST_ERROR',
        message: error.message || 'Unknown error occurred',
        suggestion: 'Please check your connection details and try again'
      }
    }, { status: 500 })
  }
}

/**
 * Test FTP/FTPS connection
 */
async function testFTPConnection(config: ConnectionTest): Promise<TestResult> {
  const client = new FTPClient()
  client.ftp.verbose = false // Disable verbose logging for production

  try {
    const port = parseInt(config.port, 10)
    const isSecure = config.type === 'FTPS'

    // Attempt connection with timeout
    await Promise.race([
      client.access({
        host: config.host.trim(),
        port: port,
        user: config.username,
        password: config.password,
        secure: isSecure,
        secureOptions: isSecure ? { rejectUnauthorized: false } : undefined,
        connTimeout: 15000,
        pasvTimeout: 10000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 20000)
      )
    ])

    // Get current directory
    const currentDir = await client.pwd()
    
    // List files in root or specified path
    const targetPath = config.path || '/'
    const files = await client.list(targetPath)
    
    // Detect platform type
    const detectedPlatform = detectPlatform(files.map(f => f.name))

    await client.close()

    return {
      success: true,
      message: `Successfully connected to ${config.host}`,
      details: {
        currentDir,
        fileCount: files.length,
        sampleFiles: files.slice(0, 5).map(f => f.name),
        detectedPlatform
      }
    }

  } catch (error: any) {
    await client.close().catch(() => {})
    
    return {
      success: false,
      message: 'Connection failed',
      error: parseConnectionError(error, config.type)
    }
  }
}

/**
 * Test SFTP connection
 */
async function testSFTPConnection(config: ConnectionTest): Promise<TestResult> {
  return new Promise((resolve) => {
    const conn = new SSHClient()
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        conn.end()
        resolve({
          success: false,
          message: 'Connection timeout',
          error: {
            code: 'TIMEOUT',
            message: 'Connection timed out after 20 seconds',
            suggestion: 'Check if the server is accessible and the port is correct. SFTP typically uses port 22.'
          }
        })
      }
    }, 20000)

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          clearTimeout(timeout)
          if (!resolved) {
            resolved = true
            conn.end()
            resolve({
              success: false,
              message: 'SFTP initialization failed',
              error: {
                code: 'SFTP_ERROR',
                message: err.message,
                suggestion: 'The SSH connection succeeded but SFTP failed. Ensure SFTP is enabled on the server.'
              }
            })
          }
          return
        }

        const targetPath = config.path || '/'
        sftp.readdir(targetPath, (err, files) => {
          clearTimeout(timeout)
          conn.end()
          
          if (!resolved) {
            resolved = true
            
            if (err) {
              resolve({
                success: false,
                message: 'Failed to read directory',
                error: {
                  code: 'READ_ERROR',
                  message: err.message,
                  suggestion: `Cannot access path "${targetPath}". Try using "/" as the path or verify permissions.`
                }
              })
            } else {
              const fileNames = files.map(f => f.filename)
              const detectedPlatform = detectPlatform(fileNames)
              
              resolve({
                success: true,
                message: `Successfully connected to ${config.host}`,
                details: {
                  currentDir: targetPath,
                  fileCount: files.length,
                  sampleFiles: fileNames.slice(0, 5),
                  detectedPlatform
                }
              })
            }
          }
        })
      })
    })

    conn.on('error', (err) => {
      clearTimeout(timeout)
      if (!resolved) {
        resolved = true
        resolve({
          success: false,
          message: 'SSH connection failed',
          error: parseConnectionError(err, 'SFTP')
        })
      }
    })

    // Connect
    try {
      conn.connect({
        host: config.host.trim(),
        port: parseInt(config.port, 10),
        username: config.username,
        password: config.password,
        readyTimeout: 15000,
        keepaliveInterval: 10000
      })
    } catch (error: any) {
      clearTimeout(timeout)
      if (!resolved) {
        resolved = true
        resolve({
          success: false,
          message: 'Failed to initiate connection',
          error: {
            code: 'CONNECTION_ERROR',
            message: error.message,
            suggestion: 'Check your connection details and try again'
          }
        })
      }
    }
  })
}

/**
 * Parse connection errors into user-friendly messages with actionable suggestions
 */
function parseConnectionError(error: any, type: string): { code: string; message: string; suggestion: string } {
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || 'UNKNOWN'

  // Timeout errors
  if (errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
    return {
      code: 'TIMEOUT',
      message: 'Connection timed out',
      suggestion: 'The server is not responding. Check:\n• Is the hostname correct?\n• Is the server online?\n• Is your firewall blocking the connection?'
    }
  }

  // Authentication errors
  if (errorMessage.includes('authentication') || errorMessage.includes('login') || errorCode === 'EAUTH') {
    return {
      code: 'AUTH_FAILED',
      message: 'Authentication failed',
      suggestion: 'Username or password is incorrect. Double-check your credentials.'
    }
  }

  // Connection refused
  if (errorMessage.includes('econnrefused') || errorCode === 'ECONNREFUSED') {
    return {
      code: 'CONNECTION_REFUSED',
      message: 'Connection refused',
      suggestion: `The server refused the connection. Check:\n• Is ${type} enabled on the server?\n• Is the port correct? (FTP: 21, FTPS: 990, SFTP: 22)\n• Is a firewall blocking the port?`
    }
  }

  // Host not found
  if (errorMessage.includes('getaddrinfo') || errorMessage.includes('enotfound') || errorCode === 'ENOTFOUND') {
    return {
      code: 'HOST_NOT_FOUND',
      message: 'Host not found',
      suggestion: 'Cannot resolve hostname. Check:\n• Is the hostname spelled correctly?\n• Does the domain exist?\n• Is your internet connection working?'
    }
  }

  // Network unreachable
  if (errorMessage.includes('enetunreach') || errorCode === 'ENETUNREACH') {
    return {
      code: 'NETWORK_UNREACHABLE',
      message: 'Network unreachable',
      suggestion: 'Cannot reach the server. Check your internet connection.'
    }
  }

  // TLS/SSL errors
  if (errorMessage.includes('tls') || errorMessage.includes('ssl') || errorMessage.includes('certificate')) {
    return {
      code: 'TLS_ERROR',
      message: 'TLS/SSL error',
      suggestion: 'SSL certificate validation failed. Try:\n• Using FTP instead of FTPS\n• Contacting your hosting provider'
    }
  }

  // Generic error
  return {
    code: errorCode,
    message: error.message || 'Unknown error',
    suggestion: 'An unexpected error occurred. Please verify all connection details and try again.'
  }
}

/**
 * Detect platform type from file listing
 */
function detectPlatform(files: string[]): string {
  const fileSet = new Set(files.map(f => f.toLowerCase()))

  // WordPress detection
  if (fileSet.has('wp-config.php') || fileSet.has('wp-content') || fileSet.has('wp-includes')) {
    return 'WordPress'
  }

  // Common hosting paths
  if (fileSet.has('public_html') || fileSet.has('www') || fileSet.has('htdocs')) {
    return 'cPanel/Hosting'
  }

  // Generic web server
  if (fileSet.has('index.html') || fileSet.has('index.php')) {
    return 'Web Server'
  }

  return 'Unknown'
}
