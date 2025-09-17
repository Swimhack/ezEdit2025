interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  details?: any
  source?: string
  category?: string
  severity?: number
  duration?: number
  ftpCode?: string
  stackTrace?: string
}

class ApplicationLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  private addLog(level: LogEntry['level'], message: string, details?: any, source?: string, options?: {
    category?: string
    severity?: number
    duration?: number
    ftpCode?: string
    includeStackTrace?: boolean
  }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      source,
      category: options?.category,
      severity: options?.severity ?? this.calculateSeverity(level, options?.ftpCode),
      duration: options?.duration,
      ftpCode: options?.ftpCode,
      stackTrace: options?.includeStackTrace && process.env.NODE_ENV === 'development'
        ? new Error().stack
        : undefined
    }

    this.logs.push(entry)

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      const prefix = `[${source || 'APP'}]${options?.ftpCode ? ` [FTP:${options.ftpCode}]` : ''}`
      console[consoleMethod](`${prefix} ${message}`, details || '')
    }
  }

  private calculateSeverity(level: LogEntry['level'], ftpCode?: string): number {
    let baseSeverity = 0
    switch (level) {
      case 'error': baseSeverity = 5; break
      case 'warn': baseSeverity = 3; break
      case 'info': baseSeverity = 1; break
      case 'debug': baseSeverity = 0; break
    }

    // Increase severity for critical FTP errors
    if (ftpCode) {
      if (ftpCode.startsWith('5')) baseSeverity += 2 // Permanent failures
      if (ftpCode.startsWith('4')) baseSeverity += 1 // Temporary failures
    }

    return Math.min(baseSeverity, 10)
  }

  info(message: string, details?: any, source?: string, options?: {
    category?: string
    duration?: number
    ftpCode?: string
  }) {
    this.addLog('info', message, details, source, options)
  }

  warn(message: string, details?: any, source?: string, options?: {
    category?: string
    duration?: number
    ftpCode?: string
  }) {
    this.addLog('warn', message, details, source, options)
  }

  error(message: string, details?: any, source?: string, options?: {
    category?: string
    duration?: number
    ftpCode?: string
    includeStackTrace?: boolean
  }) {
    this.addLog('error', message, details, source, options)
  }

  debug(message: string, details?: any, source?: string, options?: {
    category?: string
    duration?: number
  }) {
    this.addLog('debug', message, details, source, options)
  }

  // FTP-specific logging methods
  ftpOperation(operation: string, details: any, source: string, duration?: number) {
    this.info(`FTP Operation: ${operation}`, details, source, {
      category: 'FTP_OPERATION',
      duration
    })
  }

  ftpError(operation: string, error: any, details: any, source: string, duration?: number) {
    const ftpCode = this.extractFtpCode(error)
    this.error(`FTP Error: ${operation} failed`, {
      ...details,
      error: error.message,
      code: error.code
    }, source, {
      category: 'FTP_ERROR',
      duration,
      ftpCode,
      includeStackTrace: true
    })
  }

  ftpConnection(status: 'connected' | 'disconnected' | 'failed', details: any, source: string, duration?: number) {
    const level = status === 'failed' ? 'error' : 'info'
    this.addLog(level, `FTP Connection: ${status}`, details, source, {
      category: 'FTP_CONNECTION',
      duration
    })
  }

  performance(operation: string, duration: number, details: any, source: string) {
    this.info(`Performance: ${operation}`, { ...details, duration }, source, {
      category: 'PERFORMANCE',
      duration
    })
  }

  private extractFtpCode(error: any): string | undefined {
    if (typeof error.message === 'string') {
      const match = error.message.match(/^(\d{3})\s/)
      return match ? match[1] : undefined
    }
    return undefined
  }

  getLogs(options?: { level?: LogEntry['level'], limit?: number, since?: string }): LogEntry[] {
    let filtered = [...this.logs]

    if (options?.level) {
      filtered = filtered.filter(log => log.level === options.level)
    }

    if (options?.since) {
      const sinceDate = new Date(options.since)
      filtered = filtered.filter(log => new Date(log.timestamp) > sinceDate)
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit)
    }

    return filtered
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
const logger = new ApplicationLogger()

// Export both the instance and class for flexibility
export { logger, ApplicationLogger }
export type { LogEntry }