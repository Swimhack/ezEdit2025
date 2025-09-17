/**
 * ApplicationLog model for tracking all application events and activities
 * Supports structured logging with context, user tracking, and error handling
 */

import { z } from 'zod';

/**
 * Log level enumeration following standard logging conventions
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * ApplicationLog interface representing the complete log entry structure
 */
export interface ApplicationLog {
  /** Unique identifier for the log entry */
  id: string;
  /** Timestamp with millisecond precision */
  timestamp: Date;
  /** Log severity level */
  level: LogLevel;
  /** Source service or component that generated the log */
  source: string;
  /** Primary log message */
  message: string;
  /** Additional contextual data as JSON object */
  context?: Record<string, any>;
  /** Associated user ID if applicable */
  user_id?: string | null;
  /** Session identifier for request correlation */
  session_id?: string | null;
  /** Request correlation ID for tracing */
  request_id?: string | null;
  /** Client IP address if applicable */
  ip_address?: string | null;
  /** Browser or client user agent string */
  user_agent?: string | null;
  /** Operation duration in milliseconds */
  duration_ms?: number | null;
  /** Stack trace for error logs */
  error_stack?: string | null;
  /** Searchable tags for categorization */
  tags: string[];
}

/**
 * ApplicationLog creation data interface
 */
export interface CreateApplicationLogData {
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, any>;
  user_id?: string | null;
  session_id?: string | null;
  request_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  duration_ms?: number | null;
  error_stack?: string | null;
  tags?: string[];
}

/**
 * Validation schema for ApplicationLog creation
 */
export const CreateApplicationLogSchema = z.object({
  level: z.nativeEnum(LogLevel),
  source: z.string().min(1).max(255),
  message: z.string().min(1).max(10240), // 10KB limit
  context: z.record(z.any()).optional(),
  user_id: z.string().uuid().nullable().optional(),
  session_id: z.string().nullable().optional(),
  request_id: z.string().nullable().optional(),
  ip_address: z.string().ip().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  duration_ms: z.number().int().min(0).nullable().optional(),
  error_stack: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([])
});

/**
 * ApplicationLog model class with validation and helper methods
 */
export class ApplicationLogModel {
  /**
   * Validates log creation data
   */
  static validate(data: unknown): CreateApplicationLogData {
    return CreateApplicationLogSchema.parse(data);
  }

  /**
   * Creates a new ApplicationLog instance with generated UUID and timestamp
   */
  static create(data: CreateApplicationLogData): ApplicationLog {
    const validated = this.validate(data);

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level: validated.level,
      source: validated.source,
      message: this.redactSensitiveData(validated.message),
      context: validated.context ? this.redactSensitiveContext(validated.context) : undefined,
      user_id: validated.user_id,
      session_id: validated.session_id,
      request_id: validated.request_id,
      ip_address: validated.ip_address,
      user_agent: validated.user_agent,
      duration_ms: validated.duration_ms,
      error_stack: validated.error_stack ? this.redactSensitiveData(validated.error_stack) : null,
      tags: validated.tags || []
    };
  }

  /**
   * Checks if a log level is considered an error level
   */
  static isErrorLevel(level: LogLevel): boolean {
    return level === LogLevel.ERROR || level === LogLevel.CRITICAL;
  }

  /**
   * Checks if a log level should be persisted to long-term storage
   */
  static shouldPersist(level: LogLevel): boolean {
    return level !== LogLevel.DEBUG;
  }

  /**
   * Gets the numeric priority for a log level (higher = more important)
   */
  static getLevelPriority(level: LogLevel): number {
    const priorities = {
      [LogLevel.DEBUG]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.WARN]: 3,
      [LogLevel.ERROR]: 4,
      [LogLevel.CRITICAL]: 5
    };
    return priorities[level];
  }

  /**
   * Determines retention period based on log level and subscription tier
   */
  static getRetentionDays(level: LogLevel, subscriptionTier: 'standard' | 'premium' | 'enterprise'): number {
    const baseDays = {
      standard: 30,
      premium: 90,
      enterprise: 365
    }[subscriptionTier];

    // Critical and error logs get extended retention
    if (level === LogLevel.CRITICAL || level === LogLevel.ERROR) {
      return Math.max(baseDays, 90);
    }

    return baseDays;
  }

  /**
   * Redacts sensitive data from log messages and stack traces
   */
  private static redactSensitiveData(text: string): string {
    return text
      // Redact SSN patterns (XXX-XX-XXXX)
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, 'XXX-XX-XXXX')
      // Redact credit card patterns
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'XXXX-XXXX-XXXX-XXXX')
      // Redact email addresses partially
      .replace(/\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '$1@***')
      // Redact phone numbers
      .replace(/\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g, 'XXX-XXX-XXXX')
      // Redact potential passwords or tokens
      .replace(/\b(password|token|key|secret)[\s=:]+[^\s]+/gi, '$1=***');
  }

  /**
   * Redacts sensitive data from context objects
   */
  private static redactSensitiveContext(context: Record<string, any>): Record<string, any> {
    const redacted = { ...context };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'ssn', 'creditcard', 'credit_card'];

    Object.keys(redacted).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        redacted[key] = '***';
      } else if (typeof redacted[key] === 'string') {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveContext(redacted[key]);
      }
    });

    return redacted;
  }

  /**
   * Formats a log entry for display
   */
  static format(log: ApplicationLog): string {
    const timestamp = log.timestamp.toISOString();
    const level = log.level.padEnd(8);
    const source = log.source.padEnd(20);
    const contextStr = log.context ? ` | ${JSON.stringify(log.context)}` : '';
    const tagsStr = log.tags.length > 0 ? ` | tags: ${log.tags.join(', ')}` : '';

    return `${timestamp} | ${level} | ${source} | ${log.message}${contextStr}${tagsStr}`;
  }

  /**
   * Creates a structured log query filter
   */
  static createFilter(options: {
    level?: LogLevel;
    minLevel?: LogLevel;
    source?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    tags?: string[];
    startTime?: Date;
    endTime?: Date;
  }) {
    return {
      level: options.level,
      minLevel: options.minLevel,
      source: options.source,
      user_id: options.userId,
      session_id: options.sessionId,
      request_id: options.requestId,
      tags: options.tags,
      timestamp: {
        gte: options.startTime,
        lte: options.endTime
      }
    };
  }
}

/**
 * Type guard to check if an object is a valid ApplicationLog
 */
export function isApplicationLog(obj: any): obj is ApplicationLog {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    obj.timestamp instanceof Date &&
    Object.values(LogLevel).includes(obj.level) &&
    typeof obj.source === 'string' &&
    typeof obj.message === 'string' &&
    Array.isArray(obj.tags)
  );
}

export default ApplicationLogModel;