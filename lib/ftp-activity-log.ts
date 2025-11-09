/**
 * FTP Activity Log Storage
 * Centralized logging system for all FTP operations to aid troubleshooting
 */

export interface FTPActivityLog {
  id: string;
  timestamp: Date;
  operation: string;
  websiteId?: string;
  connectionId?: string;
  correlationId?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  path?: string;
  filePath?: string;
  details: Record<string, any>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  duration?: number;
  fileCount?: number;
  fileSize?: number;
}

// In-memory log storage (max 1000 entries)
const MAX_LOGS = 1000;
const logs: FTPActivityLog[] = [];

/**
 * Add a log entry
 */
export function logFTPActivity(entry: Omit<FTPActivityLog, 'id' | 'timestamp'>): void {
  const logEntry: FTPActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
    ...entry
  };

  logs.push(logEntry);

  // Keep only the most recent logs
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const level = entry.status === 'error' ? 'error' : entry.status === 'warning' ? 'warn' : 'info';
    console[level](`[FTP Activity] ${entry.operation}`, {
      status: entry.status,
      websiteId: entry.websiteId,
      connectionId: entry.connectionId,
      path: entry.path || entry.filePath,
      ...entry.details,
      error: entry.error
    });
  }
}

/**
 * Get logs with optional filters
 */
export function getFTPLogs(options: {
  websiteId?: string;
  connectionId?: string;
  operation?: string;
  status?: string;
  limit?: number;
  since?: Date;
} = {}): FTPActivityLog[] {
  let filtered = [...logs];

  if (options.websiteId) {
    filtered = filtered.filter(log => log.websiteId === options.websiteId);
  }

  if (options.connectionId) {
    filtered = filtered.filter(log => log.connectionId === options.connectionId);
  }

  if (options.operation) {
    filtered = filtered.filter(log => log.operation === options.operation);
  }

  if (options.status) {
    filtered = filtered.filter(log => log.status === options.status);
  }

  if (options.since) {
    filtered = filtered.filter(log => log.timestamp >= options.since!);
  }

  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply limit
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Get log statistics
 */
export function getFTPLogStats(): {
  total: number;
  byStatus: Record<string, number>;
  byOperation: Record<string, number>;
  recentErrors: number;
  oldestLog: Date | null;
  newestLog: Date | null;
} {
  const stats = {
    total: logs.length,
    byStatus: {} as Record<string, number>,
    byOperation: {} as Record<string, number>,
    recentErrors: 0,
    oldestLog: logs.length > 0 ? logs[0].timestamp : null,
    newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null
  };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  logs.forEach(log => {
    // Count by status
    stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;

    // Count by operation
    stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;

    // Count recent errors
    if (log.status === 'error' && log.timestamp >= oneHourAgo) {
      stats.recentErrors++;
    }
  });

  return stats;
}

/**
 * Clear logs (useful for testing or maintenance)
 */
export function clearFTPLogs(): void {
  logs.length = 0;
}

/**
 * Get logs for a specific correlation ID (for request tracing)
 */
export function getLogsByCorrelationId(correlationId: string): FTPActivityLog[] {
  return logs
    .filter(log => log.correlationId === correlationId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

