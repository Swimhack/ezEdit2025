import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { addConnection, getConnection, ensureConnectionActive, queueFTPOperation, type FTPConnection } from '@/lib/ftp-connections'
import { createRequestLogger } from '@/lib/logger'
import { extractErrorContext, createErrorResponse } from '@/lib/api-error-handler'
import { getWebsite } from '@/lib/websites-memory-store'
import { randomUUID } from 'crypto'

// Helper to format file info
function formatFileInfo(item: any, path: string): any {
  const id = `${path}/${item.name}`.replace(/\/+/g, '/')
  const fullPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`

  // Debug: Log raw FTP response for analysis
  console.log(`[FTP] Raw item data for ${item.name}:`, {
    name: item.name,
    type: item.type,
    isDirectory: item.isDirectory,
    isFile: item.isFile,
    size: item.size
  })

  // CRITICAL: File extension detection is ABSOLUTE authority
  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(item.name)

  let fileType: string
  if (hasFileExtension) {
    // Files with extensions are ALWAYS files, regardless of FTP metadata
    fileType = 'file'
    console.log(`[FTP] ${item.name} forced to 'file' due to extension`)
  } else {
    // Only for items without extensions, check FTP metadata
    if (item.isDirectory || item.type === 1) {
      fileType = 'directory'
    } else {
      fileType = 'file'
    }
  }


  return {
    id,
    name: item.name,
    path: fullPath,
    type: fileType,
    size: item.size || 0,
    modified: item.modifiedAt ? item.modifiedAt.toISOString() : new Date().toISOString()
  }
}


// Rate limiting and circuit breaker - use per-client ID for better granularity
const requestCounts = new Map<string, { count: number, resetTime: number }>()
const failureCounts = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT = 10 // increased back to 10 requests per minute (should be enough with proper client fixes)
const FAILURE_THRESHOLD = 5 // increased back to 5 failures before circuit breaker opens
const CIRCUIT_BREAKER_TIMEOUT = 60000 // reduced back to 1 minute

// Clean up old entries periodically to prevent memory leaks
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
}, 60000) // Clean up every minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const minute = Math.floor(now / 60000)
  const key = `${clientId}:${minute}`

  const current = requestCounts.get(key) || { count: 0, resetTime: now + 60000 }
  current.count++
  requestCounts.set(key, current)

  // Clean old entries
  for (const [k, v] of requestCounts.entries()) {
    if (now > v.resetTime) {
      requestCounts.delete(k)
    }
  }

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

// GET: List files in a directory
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
    path = body.path || '/'
  } catch (error) {
    logger.error('Invalid JSON request body', error as Error, 'ftp_list_parse_error')
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
    });

    return NextResponse.json(
      { error: 'Service temporarily unavailable due to repeated failures. Please wait 1 minute and try again.' },
      { status: 503 }
    )
  }

  const website = getWebsite(userId, websiteId)
  if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 })

  // All websites must use real FTP connections

  // Find or create connection for this website
  let connectionId = `${website.host}:${website.port}:${website.username}`
  let connection = getConnection(connectionId)
  if (!connection) {
    const client = new FTPClient()
    try {
      await client.access({
        host: website.host.trim(),
        port: parseInt(website.port, 10) || 21,
        user: website.username,
        password: website.password,
        secure: false
      })
      const conn: FTPConnection = {
        id: connectionId,
        host: website.host.trim(),
        port: parseInt(website.port, 10) || 21,
        username: website.username,
        password: website.password,
        protocol: 'ftp',
        name: connectionId,
        connected: true,
        lastConnected: new Date().toISOString(),
        client,
        lastActivity: Date.now(),
        taskQueue: Promise.resolve()
      }
      addConnection(conn)
      connection = conn
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect'
      if (msg.includes('530')) {
        return NextResponse.json({ error: 'Authentication failed (530). Verify FTP username/password.' }, { status: 401 })
      }
      if (msg.includes('ENOTFOUND')) {
        return NextResponse.json({ error: `Host not found: ${website.host}` }, { status: 404 })
      }
      return NextResponse.json({ error: `Connection failed: ${msg}` }, { status: 400 })
    }
  }

  logger.info('File listing request received', {
    path,
    connectionId,
    correlationId,
    operation: 'ftp_list_start'
  })

  // CRITICAL: Server-side validation to prevent listing files as directories
  const commonFileExtensions = ['.php', '.html', '.htm', '.js', '.css', '.txt', '.json', '.xml', '.py', '.rb', '.go', '.java', '.cpp', '.c', '.cs', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];
  const hasFileExtension = commonFileExtensions.some(ext => path.endsWith(ext));

  if (hasFileExtension) {
    logger.warn('Blocked attempt to list file as directory', {
      path,
      connectionId,
      correlationId,
      detectedExtension: commonFileExtensions.find(ext => path.endsWith(ext)),
      operation: 'ftp_list_validation_error'
    })

    return NextResponse.json(
      { error: `Cannot list file as directory: ${path}` },
      { status: 400 }
    )
  }

  // Use the connection we have (created above or existing in pool)
  if (!connection) {
    return NextResponse.json(
      { error: `Connection not found: ${connectionId}. Please reconnect to your FTP server.` },
      { status: 404 }
    )
  }

  // Ensure connection is still active
  try {
    const isActive = await ensureConnectionActive(connection)
    if (!isActive) {
      logger.warn('FTP connection inactive', {
        connectionId,
        path,
        correlationId,
        operation: 'ftp_connection_inactive'
      })
      return NextResponse.json(
        { error: 'FTP connection is not active. Please reconnect to your FTP server.' },
        { status: 503 }
      )
    }
  } catch (error: any) {
    logger.error('Connection validation failed', error, 'ftp_connection_validation_error')

    // Handle ECONNRESET during validation
    if (error.message?.includes('ECONNRESET') || error.message?.includes('read ECONNRESET')) {
      return NextResponse.json(
        { error: 'Connection to FTP server was lost (ECONNRESET). Please reconnect.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to validate FTP connection. Please reconnect.' },
      { status: 503 }
    )
  }

  const listStartTime = Date.now()

  try {
    logger.info('Starting FTP list operation', {
      connectionId,
      path,
      correlationId,
      operation: 'ftp_list_operation'
    })

    // Queue the FTP operation to prevent concurrent access
    const contents = await queueFTPOperation(connection, async () => {
      return await connection.client.list(path)
    })
    console.log("folderContents for", path, contents)

    const list = contents
    const duration = Date.now() - listStartTime

    logger.performance('FTP list operation', duration, {
      connectionId,
      path,
      correlationId,
      itemCount: list.length,
      operation: 'ftp_list_performance'
    })

    const files = list.map((item: any) => formatFileInfo(item, path))

    logger.info('FTP list operation completed successfully', {
      connectionId,
      path,
      correlationId,
      fileCount: files.length,
      duration,
      operation: 'ftp_list_success'
    })

    return NextResponse.json({
      success: true,
      files,
      path,
      connectionId
    })

  } catch (err: any) {
    console.error("FTP .list error:", err)
    const duration = Date.now() - listStartTime

    logger.error('FTP list operation failed', err, 'ftp_list_error')

    // Record failure for circuit breaker
    recordFailure(websiteId)

    let errorMessage = err?.message || 'Unknown error'
    let statusCode = 500

    // Handle specific connection errors
    if (err.message?.includes('ECONNRESET') || err.message?.includes('read ECONNRESET')) {
      errorMessage = 'Connection to FTP server was lost (ECONNRESET). Please reconnect.'
      statusCode = 503
    } else if (err.message?.includes('Client is closed')) {
      errorMessage = 'FTP client connection is closed. Please reconnect.'
      statusCode = 503
    } else if (err.message?.includes('530')) {
      errorMessage = 'Authentication failed (530). Verify FTP username/password.'
      statusCode = 401
    } else if (err.message?.includes('None of the available transfer strategies work')) {
      errorMessage = 'FTP transfer failed - connection may be unstable. Please reconnect.'
      statusCode = 503
    } else if (err.message?.includes('EACCES') || err.message?.includes('permission denied')) {
      errorMessage = 'File system permission denied. This service requires proper configuration.'
      statusCode = 500
    } else {
      // Extract FTP error codes if available
      const ftpCodeMatch = err.message?.match(/(\d{3})/);
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

    logger.error('FTP list operation failed with classified error', {
      correlationId,
      path,
      connectionId,
      errorMessage,
      statusCode,
      duration,
      operation: 'ftp_list_classified_error'
    })

    return NextResponse.json({ error: `Failed to list files in ${path}: ${errorMessage}` }, { status: statusCode })
  }
}
