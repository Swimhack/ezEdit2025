/**
 * Client-side logger that sends logs to server
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogData {
  level: LogLevel
  message: string
  data?: any
  context?: string
  clientTime?: number
}

class ClientLogger {
  private queue: LogData[] = []
  private sending = false
  private enabled = true

  constructor() {
    // Send logs every 2 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), 2000)
    }
  }

  private async flush() {
    if (this.queue.length === 0 || this.sending || !this.enabled) return

    this.sending = true
    const logsToSend = [...this.queue]
    this.queue = []

    try {
      await fetch('/api/debug/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'batch',
          message: 'Batch log',
          data: logsToSend,
          clientTime: Date.now()
        })
      })
    } catch (error) {
      console.error('Failed to send logs:', error)
      // Re-queue failed logs
      this.queue.unshift(...logsToSend)
    } finally {
      this.sending = false
    }
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const logEntry: LogData = {
      level,
      message,
      data,
      context,
      clientTime: Date.now()
    }

    // Also log to console
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](`[${context || 'App'}]`, message, data || '')

    // Queue for server
    this.queue.push(logEntry)

    // If error, send immediately
    if (level === 'error') {
      this.flush()
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context)
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context)
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context)
  }

  error(message: string, data?: any, context?: string) {
    this.log('error', message, data, context)
  }

  disable() {
    this.enabled = false
  }

  enable() {
    this.enabled = true
  }
}

export const clientLogger = new ClientLogger()
