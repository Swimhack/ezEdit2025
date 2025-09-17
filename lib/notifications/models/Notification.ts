/**
 * Notification model for multi-channel notification management
 * Supports email, SMS, push, and in-app notifications with state tracking
 */

import { z } from 'zod';

/**
 * Notification priority levels affecting delivery behavior
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Notification status enumeration for state tracking
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Available notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in-app'
}

/**
 * Notification interface representing the complete notification structure
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Recipient user ID */
  user_id: string;
  /** Notification type/category for preferences matching */
  type: string;
  /** Priority level affecting delivery behavior */
  priority: NotificationPriority;
  /** Notification title/subject */
  title: string;
  /** Notification body/message */
  message: string;
  /** Additional payload data */
  data?: Record<string, any> | null;
  /** Channels through which to deliver the notification */
  channels: NotificationChannel[];
  /** Creation timestamp */
  created_at: Date;
  /** Scheduled delivery time (null for immediate) */
  scheduled_for?: Date | null;
  /** Actual send timestamp */
  sent_at?: Date | null;
  /** Current notification status */
  status: NotificationStatus;
  /** Number of delivery attempts made */
  delivery_attempts: number;
  /** Error message if delivery failed */
  error_message?: string | null;
  /** Deduplication key to prevent duplicates */
  dedup_key?: string | null;
}

/**
 * Notification creation data interface
 */
export interface CreateNotificationData {
  user_id: string;
  type: string;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  channels: NotificationChannel[];
  scheduled_for?: Date | null;
  dedup_key?: string | null;
}

/**
 * Notification update data interface
 */
export interface UpdateNotificationData {
  status?: NotificationStatus;
  sent_at?: Date | null;
  error_message?: string | null;
  delivery_attempts?: number;
}

/**
 * Validation schema for Notification creation
 */
export const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string().min(1).max(100),
  priority: z.nativeEnum(NotificationPriority).optional().default(NotificationPriority.MEDIUM),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  data: z.record(z.any()).nullable().optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1),
  scheduled_for: z.date().nullable().optional(),
  dedup_key: z.string().max(255).nullable().optional()
});

/**
 * Validation schema for Notification updates
 */
export const UpdateNotificationSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  sent_at: z.date().nullable().optional(),
  error_message: z.string().max(1000).nullable().optional(),
  delivery_attempts: z.number().int().min(0).max(10).optional()
});

/**
 * Valid state transitions for notification status
 */
export const ValidStatusTransitions: Record<NotificationStatus, NotificationStatus[]> = {
  [NotificationStatus.PENDING]: [NotificationStatus.QUEUED, NotificationStatus.CANCELLED],
  [NotificationStatus.QUEUED]: [NotificationStatus.SENT, NotificationStatus.FAILED, NotificationStatus.CANCELLED],
  [NotificationStatus.SENT]: [], // Terminal state
  [NotificationStatus.FAILED]: [NotificationStatus.QUEUED, NotificationStatus.CANCELLED], // Retry allowed
  [NotificationStatus.CANCELLED]: [] // Terminal state
};

/**
 * Notification model class with validation and helper methods
 */
export class NotificationModel {
  /**
   * Validates notification creation data
   */
  static validate(data: unknown): CreateNotificationData {
    return CreateNotificationSchema.parse(data);
  }

  /**
   * Validates notification update data
   */
  static validateUpdate(data: unknown): UpdateNotificationData {
    return UpdateNotificationSchema.parse(data);
  }

  /**
   * Creates a new Notification instance with generated UUID and timestamp
   */
  static create(data: CreateNotificationData): Notification {
    const validated = this.validate(data);

    // Validate scheduled_for is in the future if provided
    if (validated.scheduled_for && validated.scheduled_for <= new Date()) {
      throw new Error('scheduled_for must be in the future');
    }

    return {
      id: crypto.randomUUID(),
      user_id: validated.user_id,
      type: validated.type,
      priority: validated.priority || NotificationPriority.MEDIUM,
      title: validated.title,
      message: validated.message,
      data: validated.data,
      channels: validated.channels,
      created_at: new Date(),
      scheduled_for: validated.scheduled_for,
      sent_at: null,
      status: NotificationStatus.PENDING,
      delivery_attempts: 0,
      error_message: null,
      dedup_key: validated.dedup_key
    };
  }

  /**
   * Updates notification status with validation
   */
  static updateStatus(notification: Notification, newStatus: NotificationStatus, errorMessage?: string): Partial<Notification> {
    // Validate state transition
    if (!this.canTransitionTo(notification.status, newStatus)) {
      throw new Error(`Invalid status transition from ${notification.status} to ${newStatus}`);
    }

    const updates: Partial<Notification> = {
      status: newStatus
    };

    // Set sent_at when transitioning to SENT
    if (newStatus === NotificationStatus.SENT) {
      updates.sent_at = new Date();
    }

    // Set error message for FAILED status
    if (newStatus === NotificationStatus.FAILED) {
      updates.error_message = errorMessage || 'Delivery failed';
      updates.delivery_attempts = notification.delivery_attempts + 1;
    }

    return updates;
  }

  /**
   * Checks if a status transition is valid
   */
  static canTransitionTo(currentStatus: NotificationStatus, newStatus: NotificationStatus): boolean {
    return ValidStatusTransitions[currentStatus].includes(newStatus);
  }

  /**
   * Checks if a notification is ready to be sent
   */
  static isReadyToSend(notification: Notification): boolean {
    if (notification.status !== NotificationStatus.PENDING) {
      return false;
    }

    // Check if scheduled time has arrived
    if (notification.scheduled_for && notification.scheduled_for > new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Checks if a notification should be retried
   */
  static shouldRetry(notification: Notification, maxRetries: number = 3): boolean {
    return (
      notification.status === NotificationStatus.FAILED &&
      notification.delivery_attempts < maxRetries &&
      notification.priority !== NotificationPriority.LOW
    );
  }

  /**
   * Checks if a notification is critical priority
   */
  static isCritical(notification: Notification): boolean {
    return notification.priority === NotificationPriority.CRITICAL;
  }

  /**
   * Gets retry delay based on attempt count and priority
   */
  static getRetryDelay(notification: Notification): number {
    const baseDelay = {
      [NotificationPriority.LOW]: 300000, // 5 minutes
      [NotificationPriority.MEDIUM]: 60000, // 1 minute
      [NotificationPriority.HIGH]: 30000, // 30 seconds
      [NotificationPriority.CRITICAL]: 10000 // 10 seconds
    }[notification.priority];

    // Exponential backoff
    return baseDelay * Math.pow(2, notification.delivery_attempts);
  }

  /**
   * Generates a deduplication key based on notification content
   */
  static generateDedupKey(userId: string, type: string, title: string): string {
    // Simple hash of content for deduplication
    const content = `${userId}:${type}:${title}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Checks if a notification is a duplicate based on dedup_key and time window
   */
  static isDuplicate(notification: Notification, dedupWindowMinutes: number = 5): boolean {
    if (!notification.dedup_key) {
      return false;
    }

    const windowStart = new Date(notification.created_at.getTime() - (dedupWindowMinutes * 60 * 1000));
    // This would need to be checked against the database in actual implementation
    return false; // Placeholder
  }

  /**
   * Gets notification priority display name
   */
  static getPriorityDisplay(priority: NotificationPriority): string {
    const displays = {
      [NotificationPriority.LOW]: 'Low',
      [NotificationPriority.MEDIUM]: 'Medium',
      [NotificationPriority.HIGH]: 'High',
      [NotificationPriority.CRITICAL]: 'Critical'
    };
    return displays[priority];
  }

  /**
   * Gets notification status display name with color coding
   */
  static getStatusDisplay(status: NotificationStatus): { text: string; color: string } {
    const displays = {
      [NotificationStatus.PENDING]: { text: 'Pending', color: 'gray' },
      [NotificationStatus.QUEUED]: { text: 'Queued', color: 'blue' },
      [NotificationStatus.SENT]: { text: 'Sent', color: 'green' },
      [NotificationStatus.FAILED]: { text: 'Failed', color: 'red' },
      [NotificationStatus.CANCELLED]: { text: 'Cancelled', color: 'orange' }
    };
    return displays[status];
  }

  /**
   * Formats notification for display
   */
  static format(notification: Notification): string {
    const timestamp = notification.created_at.toISOString();
    const priority = notification.priority.toLowerCase();
    const status = notification.status.toLowerCase();
    const channels = notification.channels.join(', ');

    return `${timestamp} | ${priority} | ${status} | ${channels} | ${notification.title}`;
  }

  /**
   * Creates a notification filter for querying
   */
  static createFilter(options: {
    userId?: string;
    type?: string;
    priority?: NotificationPriority;
    status?: NotificationStatus;
    channels?: NotificationChannel[];
    startTime?: Date;
    endTime?: Date;
    readyToSend?: boolean;
  }) {
    const filter: any = {};

    if (options.userId) filter.user_id = options.userId;
    if (options.type) filter.type = options.type;
    if (options.priority) filter.priority = options.priority;
    if (options.status) filter.status = options.status;
    if (options.channels) filter.channels = { overlap: options.channels };

    if (options.startTime || options.endTime) {
      filter.created_at = {};
      if (options.startTime) filter.created_at.gte = options.startTime;
      if (options.endTime) filter.created_at.lte = options.endTime;
    }

    if (options.readyToSend) {
      filter.status = NotificationStatus.PENDING;
      filter.OR = [
        { scheduled_for: null },
        { scheduled_for: { lte: new Date() } }
      ];
    }

    return filter;
  }

  /**
   * Merges notification data for template rendering
   */
  static mergeTemplateData(notification: Notification, templateData: Record<string, any>): Record<string, any> {
    return {
      ...templateData,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        type: notification.type
      },
      user_id: notification.user_id,
      ...(notification.data || {})
    };
  }
}

/**
 * Type guard to check if an object is a valid Notification
 */
export function isNotification(obj: any): obj is Notification {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.type === 'string' &&
    Object.values(NotificationPriority).includes(obj.priority) &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string' &&
    Array.isArray(obj.channels) &&
    obj.created_at instanceof Date &&
    Object.values(NotificationStatus).includes(obj.status) &&
    typeof obj.delivery_attempts === 'number'
  );
}

export default NotificationModel;