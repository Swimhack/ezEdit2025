/**
 * Core logging service with structured logging, buffering, and multiple output targets
 * Supports structured JSON logging, automatic log rotation, and efficient batching
 */

import { ApplicationLog, ApplicationLogModel, LogLevel, CreateApplicationLogData } from './models/ApplicationLog';

/**
 * Log output target interface
 */
export interface LogTarget {
  name: string;
  write(logs: ApplicationLog[]): Promise<void>;
  shouldLog(level: LogLevel): boolean;
  close?(): Promise<void>;
}

/**
 * Console log target for development and debugging
 */
export class ConsoleLogTarget implements LogTarget {
  name = 'console';

  constructor(private minLevel: LogLevel = LogLevel.INFO) {}

  shouldLog(level: LogLevel): boolean {
    return ApplicationLogModel.getLevelPriority(level) >= ApplicationLogModel.getLevelPriority(this.minLevel);
  }

  async write(logs: ApplicationLog[]): Promise<void> {
    logs.forEach(log => {
      const formatted = ApplicationLogModel.format(log);
      if (ApplicationLogModel.isErrorLevel(log.level)) {
        console.error(formatted);
      } else {
        console.log(formatted);
      }
    });
  }
}

/**
 * File log target for persistent logging
 */
export class FileLogTarget implements LogTarget {
  name = 'file';
  private fileHandle: FileSystemWritableFileStream | null = null;

  constructor(
    private filePath: string,
    private minLevel: LogLevel = LogLevel.DEBUG,
    private maxSizeBytes: number = 10 * 1024 * 1024 // 10MB
  ) {}

  shouldLog(level: LogLevel): boolean {
    return ApplicationLogModel.getLevelPriority(level) >= ApplicationLogModel.getLevelPriority(this.minLevel);
  }

  async write(logs: ApplicationLog[]): Promise<void> {
    try {
      await this.ensureFileOpen();

      for (const log of logs) {
        const formatted = ApplicationLogModel.format(log) + '\n';
        await this.fileHandle?.write(formatted);
      }
    } catch (error) {
      console.error('Failed to write to log file:', error as Error);
    }
  }

  private async ensureFileOpen(): Promise<void> {
    if (!this.fileHandle) {
      try {
        // In a real implementation, use Node.js fs module or similar
        // This is a simplified version for the browser environment
        console.log(`Would open log file: ${this.filePath}`);
      } catch (error) {
        console.error('Failed to open log file:', error as Error);
      }
    }
  }

  async close(): Promise<void> {
    if (this.fileHandle) {
      await this.fileHandle.close();
      this.fileHandle = null;
    }
  }
}

/**
 * HTTP log target for remote logging services
 */
export class HttpLogTarget implements LogTarget {
  name = 'http';
  private queue: ApplicationLog[] = [];
  private sending = false;

  constructor(
    private endpoint: string,
    private apiKey: string,
    private minLevel: LogLevel = LogLevel.INFO,
    private batchSize: number = 100,
    private flushInterval: number = 5000
  ) {
    // Start periodic flush
    setInterval(() => this.flush(), this.flushInterval);
  }

  shouldLog(level: LogLevel): boolean {
    return ApplicationLogModel.getLevelPriority(level) >= ApplicationLogModel.getLevelPriority(this.minLevel);
  }

  async write(logs: ApplicationLog[]): Promise<void> {
    this.queue.push(...logs);

    // Flush immediately for critical logs
    if (logs.some(log => log.level === LogLevel.CRITICAL)) {
      await this.flush();
    } else if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.sending || this.queue.length === 0) {
      return;
    }

    this.sending = true;
    const logsToSend = this.queue.splice(0, this.batchSize);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ logs: logsToSend })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Re-queue failed logs at the front
      this.queue.unshift(...logsToSend);
      console.error('Failed to send logs to remote endpoint:', error as Error);
    } finally {
      this.sending = false;
    }
  }
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  source: string;
  defaultLevel: LogLevel;
  targets: LogTarget[];
  bufferSize: number;
  flushInterval: number;
  enableContextCapture: boolean;
}

/**
 * Default logger configuration
 */
export const DefaultLoggerConfig: LoggerConfig = {
  source: 'application',
  defaultLevel: LogLevel.INFO,
  targets: [new ConsoleLogTarget()],
  bufferSize: 100,
  flushInterval: 1000,
  enableContextCapture: true
};

/**
 * Core logger service with buffering and multiple targets
 */
export class Logger {
  private buffer: ApplicationLog[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private contextData: Record<string, any> = {};

  constructor(private config: LoggerConfig = DefaultLoggerConfig) {
    this.startFlushTimer();
  }

  /**
   * Sets persistent context data that will be included in all logs
   */
  setContext(context: Record<string, any>): void {
    this.contextData = { ...this.contextData, ...context };
  }

  /**
   * Clears specific context keys or all context data
   */
  clearContext(keys?: string[]): void {
    if (keys) {
      keys.forEach(key => delete this.contextData[key]);
    } else {
      this.contextData = {};
    }
  }

  /**
   * Logs a debug message
   */
  debug(message: string, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>): void {
    this.log(LogLevel.DEBUG, message, context, meta);
  }

  /**
   * Logs an info message
   */
  info(message: string, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>): void {
    this.log(LogLevel.INFO, message, context, meta);
  }

  /**
   * Logs a warning message
   */
  warn(message: string, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>): void {
    this.log(LogLevel.WARN, message, context, meta);
  }

  /**
   * Logs an error message
   */
  error(message: string, error?: Error, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>): void {
    const errorContext = error ? {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    } : context;

    this.log(LogLevel.ERROR, message, errorContext, {
      ...meta,
      error_stack: error?.stack
    });
  }

  /**
   * Logs a critical message (always flushed immediately)
   */
  critical(message: string, error?: Error, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>): void {
    const errorContext = error ? {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    } : context;

    this.log(LogLevel.CRITICAL, message, errorContext, {
      ...meta,
      error_stack: error?.stack
    });

    // Immediately flush critical logs
    this.flush();
  }

  /**
   * Logs a timed operation
   */
  async timed<T>(
    operation: string,
    fn: () => Promise<T>,
    level: LogLevel = LogLevel.INFO,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const startLog = ApplicationLogModel.create({
      level,
      source: this.config.source,
      message: `Starting ${operation}`,
      context: { ...this.contextData, ...context, operation },
      request_id: this.generateRequestId()
    });

    this.addToBuffer(startLog);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      const successLog = ApplicationLogModel.create({
        level,
        source: this.config.source,
        message: `Completed ${operation}`,
        context: { ...this.contextData, ...context, operation, success: true },
        duration_ms: duration,
        request_id: startLog.request_id
      });

      this.addToBuffer(successLog);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorLog = ApplicationLogModel.create({
        level: LogLevel.ERROR,
        source: this.config.source,
        message: `Failed ${operation}`,
        context: {
          ...this.contextData,
          ...context,
          operation,
          success: false,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error)
        },
        duration_ms: duration,
        error_stack: error instanceof Error ? error.stack : undefined,
        request_id: startLog.request_id
      });

      this.addToBuffer(errorLog);
      this.flush(); // Flush immediately on errors
      throw error;
    }
  }

  /**
   * Creates a child logger with additional context
   */
  child(additionalContext: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.setContext({ ...this.contextData, ...additionalContext });
    return childLogger;
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    meta?: Partial<CreateApplicationLogData>
  ): void {
    // Check if any target would log this level
    if (!this.config.targets.some(target => target.shouldLog(level))) {
      return;
    }

    const logData: CreateApplicationLogData = {
      level,
      source: this.config.source,
      message,
      context: { ...this.contextData, ...context },
      ...meta
    };

    // Add automatic context capture if enabled
    if (this.config.enableContextCapture) {
      logData.session_id = logData.session_id || this.getSessionId();
      logData.request_id = logData.request_id || this.generateRequestId();
      logData.user_agent = logData.user_agent || this.getUserAgent();
    }

    const log = ApplicationLogModel.create(logData);
    this.addToBuffer(log);

    // Flush immediately for critical logs
    if (level === LogLevel.CRITICAL) {
      this.flush();
    }
  }

  /**
   * Adds log to buffer and checks for flush conditions
   */
  private addToBuffer(log: ApplicationLog): void {
    this.buffer.push(log);

    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Flushes buffered logs to all targets
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToFlush = this.buffer.splice(0);

    // Send to each target that should log these levels
    this.config.targets.forEach(async target => {
      const targetLogs = logsToFlush.filter(log => target.shouldLog(log.level));
      if (targetLogs.length > 0) {
        try {
          await target.write(targetLogs);
        } catch (error) {
          console.error(`Failed to write to log target ${target.name}:`, error as Error);
        }
      }
    });
  }

  /**
   * Starts the automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Gets session ID from browser or generates one
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('log_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem('log_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Gets user agent string
   */
  private getUserAgent(): string | null {
    return typeof navigator !== 'undefined' ? navigator.userAgent : null;
  }

  /**
   * Gracefully shuts down the logger
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    this.flush();

    // Close all targets
    await Promise.all(
      this.config.targets.map(target =>
        target.close ? target.close() : Promise.resolve()
      )
    );
  }

  /**
   * Gets current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Gets logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Gets or creates the global logger instance
 */
export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!globalLogger) {
    const finalConfig = config ? { ...DefaultLoggerConfig, ...config } : DefaultLoggerConfig;
    globalLogger = new Logger(finalConfig);
  }
  return globalLogger;
}

/**
 * Sets a new global logger instance
 */
export function setLogger(logger: Logger): void {
  if (globalLogger) {
    globalLogger.close();
  }
  globalLogger = logger;
}

/**
 * Convenience functions for global logger
 */
export const log = {
  debug: (message: string, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>) =>
    getLogger().debug(message, context, meta),
  info: (message: string, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>) =>
    getLogger().info(message, context, meta),
  warn: (message: string, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>) =>
    getLogger().warn(message, context, meta),
  error: (message: string, error?: Error, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>) =>
    getLogger().error(message, error, context, meta),
  critical: (message: string, error?: Error, context?: Record<string, any>, meta?: Partial<CreateApplicationLogData>) =>
    getLogger().critical(message, error, context, meta),
  timed: <T>(operation: string, fn: () => Promise<T>, level?: LogLevel, context?: Record<string, any>) =>
    getLogger().timed(operation, fn, level, context)
};

export default Logger;
// Legacy ApplicationLogger export for API compatibility
export class ApplicationLogger {
  static log(level: string, message: string, context?: any) {
    console.log(`[${level}] ${message}`, context);
  }
  static info(message: string, context?: any) { ApplicationLogger.log('INFO', message, context); }
  static error(message: string, context?: any) { ApplicationLogger.log('ERROR', message, context); }
  static warn(message: string, context?: any) { ApplicationLogger.log('WARN', message, context); }
  static debug(message: string, context?: any) { ApplicationLogger.log('DEBUG', message, context); }
  static critical(message: string, context?: any) { ApplicationLogger.log('CRITICAL', message, context); }
}
