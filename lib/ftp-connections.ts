import { Client as FTPClient } from 'basic-ftp'
import { FTPConfig, getFTPConfig } from './ftp-config'

export interface FTPConnection {
  id: string
  host: string
  port: number
  username: string
  password: string
  protocol: string
  name: string
  connected: boolean
  lastConnected: string
  client: FTPClient
  lastActivity: number
  keepaliveInterval?: NodeJS.Timeout
  taskQueue: Promise<any>
  isReconnecting?: boolean
  ftpConfig?: FTPConfig
}

// Global connection storage - use globalThis to ensure singleton across modules
const globalForConnections = globalThis as unknown as {
  ftpConnections: Map<string, FTPConnection>
}

if (!globalForConnections.ftpConnections) {
  globalForConnections.ftpConnections = new Map<string, FTPConnection>()
}

const activeConnections = globalForConnections.ftpConnections

// Use configuration-based timeouts
const defaultConfig = getFTPConfig()
// Connection timeout from config
const CONNECTION_TIMEOUT = defaultConfig.connectionIdleTimeout
// Keepalive interval from config (30 seconds for legacy servers)
const KEEPALIVE_INTERVAL = defaultConfig.keepaliveInterval

export function addConnection(connection: FTPConnection): void {
  connection.lastActivity = Date.now()
  connection.taskQueue = Promise.resolve() // Initialize task queue
  activeConnections.set(connection.id, connection)

  // Start keepalive for this connection
  startKeepalive(connection)

  console.log(`[FTP] Connection added: ${connection.host}:${connection.port}`)
}

function startKeepalive(connection: FTPConnection): void {
  // Clear existing keepalive if any
  if (connection.keepaliveInterval) {
    clearInterval(connection.keepaliveInterval)
  }

  const keepaliveInterval = connection.ftpConfig?.keepaliveInterval || KEEPALIVE_INTERVAL

  connection.keepaliveInterval = setInterval(async () => {
    try {
      // Queue the keepalive to prevent conflicts with ongoing operations
      await queueFTPOperation(connection, async () => {
        // For legacy servers, use PWD (print working directory) instead of NOOP
        // as some old servers don't implement NOOP properly
        try {
          await connection.client.send('NOOP')
        } catch (noopError: any) {
          // Fallback to PWD if NOOP fails
          console.log(`[FTP] NOOP failed, trying PWD for keepalive: ${connection.id}`)
          await connection.client.pwd()
        }
        return true
      })

      connection.lastActivity = Date.now()
      console.log(`[FTP] Keepalive successful: ${connection.id} at ${new Date().toISOString()}`)
    } catch (error: any) {
      console.warn(`[FTP] Keepalive failed: ${connection.id}`, error.message)

      // Only attempt reconnect if not already reconnecting
      if (!connection.isReconnecting) {
        const reconnected = await ensureConnectionActive(connection)
        if (!reconnected) {
          console.error(`[FTP] Reconnection failed, removing connection: ${connection.id}`)
          removeConnection(connection.id)
        }
      }
    }
  }, keepaliveInterval)

  console.log(`[FTP] Keepalive started for ${connection.id} with interval ${keepaliveInterval}ms`)
}

export function getConnection(connectionId: string): FTPConnection | undefined {
  const connection = activeConnections.get(connectionId)
  if (connection) {
    connection.lastActivity = Date.now()

    console.log(`[FTP] Retrieved connection from pool: ${connectionId}, last activity: ${new Date(connection.lastActivity).toISOString()}, connected: ${connection.connected}`)
  } else {
    console.warn(`[FTP] Connection not found in pool: ${connectionId}`)
  }
  return connection
}

export function removeConnection(connectionId: string): void {
  const connection = activeConnections.get(connectionId)
  if (connection) {
    // Removing connection

    // Stop keepalive
    if (connection.keepaliveInterval) {
      clearInterval(connection.keepaliveInterval)
      connection.keepaliveInterval = undefined
    }

    try {
      connection.client.close()
      console.log(`[FTP] Connection closed successfully: ${connectionId}`)
    } catch (error) {
      console.error(`[FTP] Error closing connection ${connectionId}:`, error)
    }

    activeConnections.delete(connectionId)
    console.log(`[FTP] Connection removed from pool: ${connectionId}`)
  }
}

export function getAllConnections(): FTPConnection[] {
  return Array.from(activeConnections.values()).map(conn => ({
    id: conn.id,
    host: conn.host,
    port: conn.port,
    username: conn.username,
    password: '***', // Hide password in responses
    protocol: conn.protocol,
    name: conn.name,
    connected: conn.connected,
    lastConnected: conn.lastConnected,
    client: conn.client,
    lastActivity: conn.lastActivity,
    taskQueue: conn.taskQueue || []
  }))
}

export function cleanupOldConnections(): void {
  const now = Date.now()
  const connectionsToRemove: string[] = []

  console.log(`[FTP] Starting connection cleanup - Total: ${activeConnections.size}, Timeout: ${CONNECTION_TIMEOUT}ms`)

  for (const [id, connection] of activeConnections.entries()) {
    const inactiveTime = now - connection.lastActivity
    if (inactiveTime > CONNECTION_TIMEOUT) {
      connectionsToRemove.push(id)
      console.log(`[FTP] Marking connection for cleanup: ${id} (inactive for ${Math.round(inactiveTime / 60000)} minutes)`)
    }
  }

  connectionsToRemove.forEach(id => {
    console.log(`[FTP] Cleaning up inactive connection: ${id}`)
    removeConnection(id)
  })

  console.log(`[FTP] Connection cleanup completed - Removed: ${connectionsToRemove.length}, Remaining: ${activeConnections.size}`)
}

// Run cleanup every 10 minutes
setInterval(cleanupOldConnections, 10 * 60 * 1000)

// Queue FTP operations to prevent concurrent access
export async function queueFTPOperation<T>(connection: FTPConnection, operation: () => Promise<T>): Promise<T> {
  // Ensure task queue exists
  if (!connection.taskQueue) {
    connection.taskQueue = Promise.resolve()
  }

  // Create a new promise for this operation
  const operationPromise = connection.taskQueue
    .then(async () => {
      console.log(`[FTP] Executing queued operation for ${connection.id}`)
      try {
        const result = await operation()
        connection.lastActivity = Date.now()
        console.log(`[FTP] Queued operation completed for ${connection.id}`)
        return result
      } catch (error) {
        connection.lastActivity = Date.now()
        console.error(`[FTP] Queued operation failed for ${connection.id}:`, error)
        throw error
      }
    })
    .catch(error => {
      // Always return a resolved promise to prevent queue from breaking
      console.warn(`[FTP] Task queue recovered from error for ${connection.id}:`, error.message)
      throw error
    })

  // Update the queue for the next operation (but don't break it on errors)
  connection.taskQueue = operationPromise.catch(() => {
    // Return resolved promise to keep queue working
    return Promise.resolve()
  })

  return operationPromise
}

export async function ensureConnectionActive(connection: FTPConnection): Promise<boolean> {
  const startTime = Date.now()
  console.log(`[FTP] Testing connection activity: ${connection.id}`)

  // Prevent multiple simultaneous reconnection attempts
  if (connection.isReconnecting) {
    console.log(`[FTP] Connection already being tested/reconnected: ${connection.id}`)
    return connection.connected
  }

  try {
    console.log(`[FTP] Testing connection with queued directory listing: ${connection.id}`)

    // Queue the connection test to prevent conflicts
    // Use a simple command like PWD to verify connection
    await queueFTPOperation(connection, async () => {
      try {
        // Try PWD first (print working directory) - simpler and more reliable than LIST
        await connection.client.pwd()
        console.log(`[FTP] PWD test successful: ${connection.id}`)
        return true
      } catch (pwdError: any) {
        console.warn(`[FTP] PWD test failed, trying LIST: ${connection.id}`, pwdError.message)
        // Fallback to LIST if PWD fails
        await connection.client.list('/')
        console.log(`[FTP] LIST test successful: ${connection.id}`)
        return true
      }
    })

    console.log(`[FTP] Connection test successful: ${connection.id} (${Date.now() - startTime}ms)`)
    connection.connected = true
    connection.lastActivity = Date.now()
    return true
  } catch (error: any) {
    console.error(`[FTP] Connection test failed: ${connection.id}`, error.message || error)

    // Try to reconnect
    if (connection.isReconnecting) {
      console.log(`[FTP] Reconnection already in progress: ${connection.id}`)
      return false
    }

    connection.isReconnecting = true
    try {
      console.log(`[FTP] Attempting to reconnect: ${connection.id}`)

      // Close existing connection first
      try {
        connection.client.close()
      } catch (closeError) {
        console.warn(`[FTP] Error closing existing connection: ${connection.id}`, closeError)
      }

      // Create new client with configuration
      const newClient = new (require('basic-ftp').Client)()
      const ftpConfig = connection.ftpConfig || defaultConfig

      // Configure client for legacy servers
      newClient.ftp.verbose = ftpConfig.verbose
      newClient.ftp.timeout = ftpConfig.connectionTimeout
      newClient.timeout = ftpConfig.dataTimeout
      newClient.ftp.pasvTimeout = ftpConfig.pasvTimeout

      const reconnectStartTime = Date.now()
      await newClient.access({
        host: connection.host,
        port: connection.port,
        user: connection.username,
        password: connection.password,
        secure: false,
        connTimeout: ftpConfig.connectionTimeout,
        pasvTimeout: ftpConfig.pasvTimeout,
        keepalive: ftpConfig.keepaliveInterval
      })

      connection.client = newClient
      connection.lastActivity = Date.now()
      connection.connected = true
      connection.taskQueue = Promise.resolve() // Reset task queue after reconnection
      connection.isReconnecting = false

      // Restart keepalive for the new connection
      startKeepalive(connection)

      const reconnectDuration = Date.now() - reconnectStartTime
      console.log(`[FTP] Successfully reconnected to ${connection.host}: ${connection.id} (${reconnectDuration}ms)`)
      return true
    } catch (reconnectError: any) {
      console.error(`[FTP] Reconnection attempt failed: ${connection.id}`, reconnectError.message || reconnectError)
      connection.connected = false
      connection.isReconnecting = false

      console.log(`[FTP] Connection ensure active failed: ${connection.id} (${Date.now() - startTime}ms)`)
      return false
    }
  }
}