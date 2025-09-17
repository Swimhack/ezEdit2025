import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { addConnection, getConnection, ensureConnectionActive, queueFTPOperation, type FTPConnection } from '@/lib/ftp-connections'
import { logger as oldLogger } from '@/lib/logger'
import { createAPILogger } from '@/lib/pino-logger'
import { getWebsite } from '@/lib/websites-store'

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


// GET: List files in a directory
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const { websiteId, path = '/' } = await request.json()
  const apiLogger = createAPILogger(request as any, '/api/ftp/list')

  // Temporary user
  const userId = 'demo-user'

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId is required' }, { status: 400 })
  }

  const website = getWebsite(userId, websiteId)
  if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 })

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

  apiLogger.info({
    path,
    connectionId,
    operation: 'LIST_FILES'
  }, 'File listing request received')

  // CRITICAL: Server-side validation to prevent listing files as directories
  const commonFileExtensions = ['.php', '.html', '.htm', '.js', '.css', '.txt', '.json', '.xml', '.py', '.rb', '.go', '.java', '.cpp', '.c', '.cs', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];
  const hasFileExtension = commonFileExtensions.some(ext => path.endsWith(ext));

  if (hasFileExtension) {
    apiLogger.warn({
      path,
      connectionId,
      detectedExtension: commonFileExtensions.find(ext => path.endsWith(ext)),
      reason: 'file_as_directory_blocked'
    }, 'Blocked attempt to list file as directory')

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
      apiLogger.warn({ connectionId, path }, 'FTP connection inactive')
      return NextResponse.json(
        { error: 'FTP connection is not active. Please reconnect to your FTP server.' },
        { status: 503 }
      )
    }
  } catch (error: any) {
    apiLogger.error({ connectionId, path, error: error.message }, 'Connection validation failed')

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
    oldLogger.ftpOperation('LIST', { connectionId, path }, 'FTP_LIST')

    // Queue the FTP operation to prevent concurrent access
    const contents = await queueFTPOperation(connection, async () => {
      return await connection.client.list(path)
    })
    console.log("folderContents for", path, contents)

    const list = contents
    const duration = Date.now() - listStartTime

    oldLogger.performance('LIST', duration, {
      connectionId,
      path,
      itemCount: list.length
    }, 'FTP_LIST')

    const files = list.map((item: any) => formatFileInfo(item, path))

    return NextResponse.json({
      success: true,
      files,
      path,
      connectionId
    })

  } catch (err: any) {
    console.error("FTP .list error:", err)
    const duration = Date.now() - listStartTime
    oldLogger.ftpError('LIST', err, { path, connectionId }, 'FTP_LIST', duration)

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
    } else {
      const ftpCode = oldLogger['extractFtpCode'] ? oldLogger['extractFtpCode'](err) : undefined
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

    return NextResponse.json({ error: `Failed to list files in ${path}: ${errorMessage}` }, { status: statusCode })
  }
}
