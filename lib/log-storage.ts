/**
 * Real-time log storage system for FTP and application errors
 */

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  operation?: string
  correlationId?: string
  context?: Record<string, any>
  source: 'ftp' | 'auth' | 'api' | 'app'
}

// In-memory log storage (last 1000 entries)
const logBuffer: LogEntry[] = []
const MAX_LOG_ENTRIES = 1000

export function addLogEntry(entry: LogEntry): void {
  // Add timestamp if not provided
  if (!entry.timestamp) {
    entry.timestamp = new Date().toISOString()
  }

  // Add to buffer
  logBuffer.unshift(entry)

  // Keep only last MAX_LOG_ENTRIES
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.splice(MAX_LOG_ENTRIES)
  }

  // Also log to console for debugging
  const logLevel = entry.level.toUpperCase()
  const message = `[${entry.timestamp}] ${logLevel}: ${entry.message}`
  const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''

  console.log(`${message}${contextStr}`)
}

export async function getApplicationLogs(
  limit: number = 50,
  level?: string,
  source?: string
): Promise<string[]> {
  let filteredLogs = [...logBuffer]

  // Filter by level
  if (level) {
    const levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    }
    const minPriority = levelPriority[level as keyof typeof levelPriority] ?? 0
    filteredLogs = filteredLogs.filter(log =>
      (levelPriority[log.level] ?? 0) >= minPriority
    )
  }

  // Filter by source
  if (source) {
    filteredLogs = filteredLogs.filter(log => log.source === source)
  }

  // Limit results
  filteredLogs = filteredLogs.slice(0, limit)

  // Format as strings for display
  return filteredLogs.map(entry => {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase()
    const operation = entry.operation ? ` [${entry.operation}]` : ''
    const correlationId = entry.correlationId ? ` (${entry.correlationId.slice(0, 8)})` : ''
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : ''

    return `[${timestamp}] ${level}${operation}${correlationId}: ${entry.message}${context}`
  })
}

export function clearLogs(): void {
  logBuffer.length = 0
}

export function getLogStats(): { total: number, byLevel: Record<string, number>, bySource: Record<string, number> } {
  const byLevel: Record<string, number> = {}
  const bySource: Record<string, number> = {}

  for (const log of logBuffer) {
    byLevel[log.level] = (byLevel[log.level] || 0) + 1
    bySource[log.source] = (bySource[log.source] || 0) + 1
  }

  return {
    total: logBuffer.length,
    byLevel,
    bySource
  }
}

// Helper functions for different log types
export function logFTPError(message: string, error: Error, context?: Record<string, any>, correlationId?: string): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    operation: 'ftp_operation',
    correlationId,
    context: {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    },
    source: 'ftp'
  })
}

export function logFTPInfo(message: string, context?: Record<string, any>, correlationId?: string): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    operation: 'ftp_operation',
    correlationId,
    context,
    source: 'ftp'
  })
}

export function logFTPWarning(message: string, context?: Record<string, any>, correlationId?: string): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    operation: 'ftp_operation',
    correlationId,
    context,
    source: 'ftp'
  })
}

export function logAPIError(message: string, error: Error, context?: Record<string, any>, correlationId?: string): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    operation: 'api_request',
    correlationId,
    context: {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    },
    source: 'api'
  })
}

// Initialize with some startup logs
addLogEntry({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Log storage system initialized',
  operation: 'startup',
  source: 'app'
})

addLogEntry({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'FTP connection monitoring active',
  operation: 'startup',
  source: 'ftp'
})