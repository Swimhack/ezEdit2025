import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { addConnection, getConnection, ensureConnectionActive, queueFTPOperation, removeConnection, type FTPConnection } from '@/lib/ftp-connections'
import { createRequestLogger } from '@/lib/logger'
import { extractErrorContext, createErrorResponse } from '@/lib/api-error-handler'
import { getWebsite } from '@/lib/websites-memory-store'
import { getFTPConfig } from '@/lib/ftp-config'
import { randomUUID } from 'crypto'
import { logFTPActivity } from '@/lib/ftp-activity-log'

// Helper to normalize and validate paths
function normalizePath(path: string): string {
  if (!path) return '/'
  // Remove trailing slashes except for root
  path = path.replace(/\/+$/, '') || '/'
  // Ensure starts with /
  if (!path.startsWith('/')) path = '/' + path
  // Normalize double slashes
  path = path.replace(/\/+/g, '/')
  return path
}

// Helper to format file info with improved type detection
function formatFileInfo(item: any, path: string): any {
  // Ensure item has a name
  if (!item || !item.name) {
    console.warn('FTP item missing name property:', item)
    return null
  }

  const normalizedPath = normalizePath(path)
  const id = `${normalizedPath}/${item.name}`.replace(/\/+/g, '/')
  const fullPath = normalizedPath === '/' ? `/${item.name}` : `${normalizedPath}/${item.name}`

  // Improved file type detection
  let fileType: string
  
  // Check FTP metadata first
  if (item.isDirectory !== undefined) {
    fileType = item.isDirectory ? 'directory' : 'file'
  } else if (item.type !== undefined) {
    // Type 1 = directory, Type 0 = file
    fileType = item.type === 1 ? 'directory' : 'file'
  } else {
    // Fallback: use file extension
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(item.name)
    if (hasFileExtension) {
      fileType = 'file'
    } else {
      // Items without extensions are likely directories
      fileType = 'directory'
    }
  }

  return {
    id,
    name: item.name || 'unknown',
    path: fullPath,
    type: fileType,
    size: fileType === 'file' ? (item.size || 0) : 0,
    modified: item.modifiedAt ? item.modifiedAt.toISOString() : new Date().toISOString(),
    permissions: item.permissions || undefined
  }
}

// Rate limiting and circuit breaker
const requestCounts = new Map<string, { count: number, resetTime: number }>()
const failureCounts = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT = 30 // Increased for better user experience
const FAILURE_THRESHOLD = 5
const CIRCUIT_BREAKER_TIMEOUT = 60000

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
  for (const [key, value] of failureCounts.entries()) {
    if (now > value.resetTime) {
      failureCounts.delete(key)
    }
  }
}, 60000)

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const minute = Math.floor(now / 60000)
  const key = `${clientId}:${minute}`

  const current = requestCounts.get(key) || { count: 0, resetTime: now + 60000 }
  current.count++
  requestCounts.set(key, current)

  return current.count <= RATE_LIMIT
}

function checkCircuitBreaker(websiteId: string): boolean {
  const now = Date.now()
  const failures = failureCounts.get(websiteId)

  if (!failures) return true

  if (now > failures.resetTime) {
    failureCounts.delete(websiteId)
    return true
  }

  return failures.count < FAILURE_THRESHOLD
}

function recordFailure(websiteId: string) {
  const now = Date.now()
  const failures = failureCounts.get(websiteId) || { count: 0, resetTime: now + CIRCUIT_BREAKER_TIMEOUT }
  failures.count++
  failures.resetTime = now + CIRCUIT_BREAKER_TIMEOUT
  failureCounts.set(websiteId, failures)
}

function recordSuccess(websiteId: string) {
  // Reset failure count on success
  failureCounts.delete(websiteId)
}

// POST: List files in a directory
export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  const startTime = Date.now()
  let websiteId: string, path: string

  try {
    const body = await request.json()
    websiteId = body.websiteId
    path = normalizePath(body.path || '/')
    
    // Log request start
    logFTPActivity({
      operation: 'ftp_list',
      websiteId,
      correlationId,
      status: 'info',
      path,
      details: {
        requestPath: body.path,
        normalizedPath: path
      }
    });
  } catch (error) {
    logger.error('Invalid JSON request body', error as Error, 'ftp_list_parse_error')
    logFTPActivity({
      operation: 'ftp_list',
      correlationId,
      status: 'error',
      details: { error: 'Invalid JSON request body' },
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : { message: 'Unknown error' }
    });
    return createErrorResponse(
      new Error('Invalid JSON request body'),
      context
    )
  }

  const clientId = request.headers.get('x-forwarded-for') || 'unknown'

  // Rate limiting
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before making more requests.' },
      { status: 429 }
    )
  }

  // Temporary user
  const userId = 'demo-user'

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId is required' }, { status: 400 })
  }

  // Circuit breaker
  if (!checkCircuitBreaker(websiteId)) {
    logger.warn('Circuit breaker open for website', {
      websiteId,
      correlationId,
      operation: 'ftp_list_circuit_breaker_open'
    })

    return NextResponse.json(
      { error: 'Service temporarily unavailable due to repeated failures. Please wait 1 minute and try again.' },
      { status: 503 }
    )
  }

  const website = getWebsite(userId, websiteId)
  if (!website) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  }

  // Validate website has required credentials
  if (!website.username || !website.password) {
    logger.error('Website missing credentials', {
      websiteId,
      hasUsername: !!website.username,
      hasPassword: !!website.password,
      correlationId,
      operation: 'ftp_list_missing_credentials'
    })
    return NextResponse.json(
      { error: 'Website FTP credentials are missing. Please update your website settings.' },
      { status: 400 }
    )
  }
  let connectionId = `${website.host}:${website.port}:${website.username}`
  let connection = getConnection(connectionId)
  
  const ftpConfig = getFTPConfig()
  
  if (!connection) {
    const client = new FTPClient()
    
    // Configure client with best practices
    client.ftp.verbose = ftpConfig.verbose
    client.ftp.timeout = ftpConfig.connectionTimeout
    client.timeout = ftpConfig.dataTimeout
    client.ftp.pasvTimeout = ftpConfig.pasvTimeout
    
    try {
      logger.info('Attempting FTP connection', {
        host: website.host.trim(),
        port: parseInt(website.port, 10) || 21,
        username: website.username,
        hasPassword: !!website.password,
        passwordLength: website.password?.length || 0,
        path: website.path,
        connectionId,
        correlationId,
        operation: 'ftp_connection_attempt'
      })
      
      logFTPActivity({
        operation: 'ftp_connect',
        websiteId,
        connectionId,
        correlationId,
        status: 'info',
        details: {
          host: website.host.trim(),
          port: parseInt(website.port, 10) || 21,
          username: website.username,
          protocol: website.type,
          workingPath: website.path
        }
      });
      
      // Determine if we need secure connection based on website type
      const isSecure = website.type?.toLowerCase() === 'ftps' || website.type?.toLowerCase() === 'sftp'
      
      // Try connection with appropriate protocol
      const accessOptions: any = {
        host: website.host.trim(),
        port: parseInt(website.port, 10) || 21,
        user: website.username,
        password: website.password,
        secure: isSecure,
        connTimeout: ftpConfig.connectionTimeout,
        pasvTimeout: ftpConfig.pasvTimeout,
        keepalive: ftpConfig.keepaliveInterval
      }
      
      // For FTPS, configure secure options
      if (isSecure) {
        accessOptions.secureOptions = undefined // Let basic-ftp handle TLS
      }
      
      logger.info('FTP connection options', {
        ...accessOptions,
        password: '***',
        correlationId,
        operation: 'ftp_connection_options'
      })
      
      await client.access(accessOptions)
      
      logger.info('FTP connection established successfully', {
        connectionId,
        correlationId,
        operation: 'ftp_connection_success'
      })
      
      logFTPActivity({
        operation: 'ftp_connect',
        websiteId,
        connectionId,
        correlationId,
        status: 'success',
        details: {
          host: website.host.trim(),
          port: parseInt(website.port, 10) || 21
        },
        duration: Date.now() - startTime
      });
      
      // Test connection with PWD command
      try {
        const currentDir = await client.pwd()
        logger.info('FTP connection verified with PWD', {
          connectionId,
          currentDir,
          correlationId,
          operation: 'ftp_connection_verified'
        })
      } catch (pwdError: any) {
        logger.warn('PWD test failed but connection established', {
          connectionId,
          error: pwdError.message,
          correlationId,
          operation: 'ftp_pwd_warning'
        })
      }
      
      // Navigate to working directory if specified
      if (website.path && website.path !== '/') {
        try {
          await client.cd(website.path)
          logger.info('Changed to working directory', {
            path: website.path,
            connectionId,
            correlationId,
            operation: 'ftp_cd_success'
          })
        } catch (cdError: any) {
          logger.warn('Could not change to working directory', {
            path: website.path,
            connectionId,
            correlationId,
            error: cdError instanceof Error ? cdError.message : 'Unknown error',
            operation: 'ftp_cd_warning'
          })
          // Don't fail the connection if CD fails - some servers don't support it
        }
      }
      
      const conn: FTPConnection = {
        id: connectionId,
        host: website.host.trim(),
        port: parseInt(website.port, 10) || 21,
        username: website.username,
        password: website.password,
        protocol: website.type?.toLowerCase() === 'ftps' ? 'ftps' : 'ftp',
        name: connectionId,
        connected: true,
        lastConnected: new Date().toISOString(),
        client,
        lastActivity: Date.now(),
        taskQueue: Promise.resolve(),
        ftpConfig
      }
      addConnection(conn)
      connection = conn
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect'
      recordFailure(websiteId)
      
      logger.error('FTP connection failed', {
        error: err,
        connectionId,
        correlationId,
        host: website.host,
        port: website.port,
        username: website.username,
        errorMessage: msg,
        errorCode: err.code,
        operation: 'ftp_connection_failed'
      }, 'ftp_connection_error')
      
      logFTPActivity({
        operation: 'ftp_connect',
        websiteId,
        connectionId,
        correlationId,
        status: 'error',
        details: {
          host: website.host,
          port: website.port,
          username: website.username
        },
        error: {
          message: msg,
          code: err.code
        },
        duration: Date.now() - startTime
      });
      
      // Provide detailed error messages based on error code
      if (msg.includes('530') || msg.includes('User cannot log in') || msg.includes('Login incorrect') || msg.includes('Authentication failed')) {
        return NextResponse.json(
          { 
            error: 'Authentication failed. Please verify your FTP username and password.',
            details: 'The FTP server rejected the credentials. Please check your username and password in the website settings.',
            errorCode: '530'
          },
          { status: 401 }
        )
      }
      if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            error: `Cannot connect to FTP server: ${website.host}`,
            details: 'The server may be down or the host address is incorrect.',
            errorCode: err.code
          },
          { status: 404 }
        )
      }
      if (msg.includes('ETIMEDOUT')) {
        return NextResponse.json(
          { 
            error: 'Connection timeout. The FTP server may be unreachable.',
            details: 'Please check your network connection and server status.',
            errorCode: err.code
          },
          { status: 504 }
        )
      }
      return NextResponse.json(
        { 
          error: `Connection failed: ${msg}`,
          details: 'Please verify your FTP settings and try again.',
          errorCode: err.code
        },
        { status: 400 }
      )
    }
  }

  logger.info('File listing request received', {
    path,
    connectionId,
    correlationId,
    operation: 'ftp_list_start'
  })

  // Validate path is not a file
  const commonFileExtensions = ['.php', '.html', '.htm', '.js', '.css', '.txt', '.json', '.xml', '.py', '.rb', '.go', '.java', '.cpp', '.c', '.cs', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.zip', '.tar', '.gz']
  const hasFileExtension = commonFileExtensions.some(ext => path.toLowerCase().endsWith(ext))

  if (hasFileExtension && path !== '/') {
    logger.warn('Blocked attempt to list file as directory', {
      path,
      connectionId,
      correlationId,
      operation: 'ftp_list_validation_error'
    })

    return NextResponse.json(
      { error: `Cannot list file as directory: ${path}` },
      { status: 400 }
    )
  }

  if (!connection) {
    return NextResponse.json(
      { error: `Connection not found: ${connectionId}. Please reconnect.` },
      { status: 404 }
    )
  }

  // Ensure connection is still active - test with actual FTP command
  try {
    logger.info('Testing FTP connection before listing', {
      connectionId,
      path,
      correlationId,
      operation: 'ftp_connection_test_start'
    })

    const isActive = await ensureConnectionActive(connection)
    
    if (!isActive) {
      logger.warn('FTP connection inactive after test', {
        connectionId,
        path,
        correlationId,
        operation: 'ftp_connection_inactive'
      })
      
      // Remove the inactive connection from pool
      removeConnection(connectionId)
      
      return NextResponse.json(
        { 
          error: 'FTP connection is not active. Please reconnect.',
          details: 'The connection was lost. Please try again.'
        },
        { status: 503 }
      )
    }

    logger.info('FTP connection verified as active', {
      connectionId,
      path,
      correlationId,
      operation: 'ftp_connection_active_confirmed'
    })
  } catch (error: any) {
    logger.error('Connection validation failed', error, 'ftp_connection_validation_error')

    if (error.message?.includes('ECONNRESET') || error.message?.includes('read ECONNRESET')) {
      return NextResponse.json(
        { 
          error: 'Connection to FTP server was lost. Please reconnect.',
          details: 'The FTP connection was reset. Please try again.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to validate FTP connection. Please reconnect.',
        details: error.message || 'Connection test failed'
      },
      { status: 503 }
    )
  }

  const listStartTime = Date.now()

  // Retry logic for listing
  let retries = 3
  let lastError: any = null

  while (retries > 0) {
    try {
      logger.info('Starting FTP list operation', {
        connectionId,
        path,
        correlationId,
        retries,
        operation: 'ftp_list_operation'
      })

      // Queue the FTP operation to prevent concurrent access
      const result = await queueFTPOperation(connection, async () => {
        // Ensure we're in the correct directory before listing
        try {
          // If website has a working directory, change to it first
          if (website.path && website.path !== '/') {
            try {
              await connection.client.cd(website.path)
              logger.info('Changed to working directory for list operation', {
                path: website.path,
                connectionId,
                correlationId,
                operation: 'ftp_cd_for_list'
              })
            } catch (cdError) {
              logger.warn('Could not change to working directory during operation', {
                path: website.path,
                connectionId,
                correlationId,
                error: cdError instanceof Error ? cdError.message : 'Unknown error'
              })
              // Continue anyway - some servers don't require CD
            }
          }
          
          // If listing root, use working directory or root
          // If path is '/', list the working directory if set, otherwise root
          const listPath = path === '/' 
            ? (website.path && website.path !== '/' ? website.path : '/')
            : path
          
          logger.info('Listing directory', {
            path: listPath,
            originalPath: path,
            websitePath: website.path,
            connectionId,
            correlationId,
            operation: 'ftp_list_directory'
          })
          
          // Perform the actual LIST command
          const listing = await connection.client.list(listPath)
          
          logger.info('FTP LIST command completed', {
            path: listPath,
            itemCount: listing?.length || 0,
            connectionId,
            correlationId,
            operation: 'ftp_list_command_success'
          })
          
          // Return both listing and the actual path used
          return { listing: listing || [], actualPath: listPath }
        } catch (listError: any) {
          logger.error('FTP list operation failed', {
            error: listError,
            path,
            connectionId,
            correlationId,
            errorMessage: listError.message,
            errorCode: listError.code,
            operation: 'ftp_list_error'
          })
          throw listError
        }
      })

      const duration = Date.now() - listStartTime
      
      // Extract listing and actual path from result
      const contents = result.listing || []
      const actualPath = result.actualPath || path
      
      // Validate contents
      if (!Array.isArray(contents)) {
        logger.error('Invalid FTP list response', {
          connectionId,
          path,
          correlationId,
          contentsType: typeof contents,
          operation: 'ftp_list_invalid_response'
        })
        throw new Error('Invalid response from FTP server: expected array')
      }

             // Use actualPath for formatting file info to ensure correct paths
             const files = contents
               .map((item: any) => formatFileInfo(item, actualPath))
               .filter((file: any) => file !== null) // Filter out invalid items

             logger.performance('FTP list operation', duration, {
               connectionId,
               path,
               correlationId,
               itemCount: files.length,
               operation: 'ftp_list_performance'
             })

      logger.info('FTP list operation completed successfully', {
        connectionId,
        path,
        correlationId,
        fileCount: files.length,
        duration,
        operation: 'ftp_list_success'
      })

      // Record success
      recordSuccess(websiteId)
      
      // Log successful list operation
      logFTPActivity({
        operation: 'ftp_list',
        websiteId,
        connectionId,
        correlationId,
        status: 'success',
        path,
        details: {
          originalPath: path,
          websitePath: website.path,
          listPath: path === '/' ? (website.path && website.path !== '/' ? website.path : '/') : path
        },
        duration,
        fileCount: files.length
      });

      return NextResponse.json({
        success: true,
        files,
        path: actualPath, // Return the actual path that was listed
        originalPath: path, // Include original requested path for reference
        connectionId
      })

    } catch (err: any) {
      lastError = err
      retries--
      
      logger.error('FTP list operation failed', err, 'ftp_list_error')

      // Don't retry on certain errors
      if (err.message?.includes('550') || err.message?.includes('550 ')) {
        // Directory not found - don't retry
        recordFailure(websiteId)
        return NextResponse.json(
          { error: `Directory not found: ${path}` },
          { status: 404 }
        )
      }

      if (err.message?.includes('530')) {
        // Authentication failed - don't retry
        recordFailure(websiteId)
        return NextResponse.json(
          { error: 'Authentication failed (530). Verify FTP username/password.' },
          { status: 401 }
        )
      }

      if (retries > 0) {
        // Wait before retry (exponential backoff)
        const delay = (4 - retries) * 500 // 500ms, 1000ms, 1500ms
        logger.info('Retrying FTP list operation', {
          connectionId,
          path,
          correlationId,
          retries,
          delay,
          operation: 'ftp_list_retry'
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed
  const duration = Date.now() - listStartTime
  recordFailure(websiteId)
  
  // Log failed list operation
  logFTPActivity({
    operation: 'ftp_list',
    websiteId,
    connectionId,
    correlationId,
    status: 'error',
    path,
    details: {
      retriesExhausted: true,
      originalPath: path
    },
    error: lastError ? {
      message: lastError.message || 'Unknown error',
      code: lastError.code
    } : { message: 'Unknown error' },
    duration
  });

  let errorMessage = lastError?.message || 'Unknown error'
  let statusCode = 500

  // Handle specific connection errors
  if (lastError.message?.includes('ECONNRESET') || lastError.message?.includes('read ECONNRESET')) {
    errorMessage = 'Connection to FTP server was lost. Please reconnect.'
    statusCode = 503
  } else if (lastError.message?.includes('Client is closed')) {
    errorMessage = 'FTP client connection is closed. Please reconnect.'
    statusCode = 503
  } else if (lastError.message?.includes('530')) {
    errorMessage = 'Authentication failed (530). Verify FTP username/password.'
    statusCode = 401
  } else if (lastError.message?.includes('ETIMEDOUT')) {
    errorMessage = 'Operation timed out. The FTP server may be slow or unreachable.'
    statusCode = 504
  } else if (lastError.message?.includes('None of the available transfer strategies work')) {
    errorMessage = 'FTP transfer failed - connection may be unstable. Please reconnect.'
    statusCode = 503
  } else if (lastError.message?.includes('EACCES') || lastError.message?.includes('permission denied')) {
    errorMessage = 'Permission denied. You may not have access to this directory.'
    statusCode = 403
  } else {
    // Extract FTP error codes if available
    const ftpCodeMatch = lastError.message?.match(/(\d{3})/);
    const ftpCode = ftpCodeMatch ? ftpCodeMatch[1] : undefined;
    if (ftpCode) {
      if (ftpCode.startsWith('55')) {
        errorMessage = `Access denied to directory: ${path}`
        statusCode = 403
      } else if (ftpCode.startsWith('45')) {
        errorMessage = `Directory not found: ${path}`
        statusCode = 404
      }
    }
  }

  logger.error('FTP list operation failed after retries', {
    correlationId,
    path,
    connectionId,
    errorMessage,
    statusCode,
    duration,
    operation: 'ftp_list_classified_error'
  })

  return NextResponse.json(
    { error: `Failed to list files in ${path}: ${errorMessage}` },
    { status: statusCode }
  )
}
