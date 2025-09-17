/**
 * NotificationDelivery model for tracking per-channel notification delivery
 * Provides detailed delivery status and metadata for each notification channel
 */

import { z } from 'zod';

/**
 * Notification delivery channels
 */
export enum DeliveryChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP'
}

/**
 * Delivery status enumeration
 */
export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

/**
 * Channel-specific metadata structures
 */
export interface EmailDeliveryMetadata {
  /** Email message ID from provider */
  message_id: string;
  /** SMTP response code */
  smtp_code?: number;
  /** Email provider used */
  provider: 'RESEND' | 'MAILGUN';
  /** Bounce type if bounced */
  bounce_type?: 'soft' | 'hard' | 'complaint';
  /** Tracking pixel URL */
  tracking_url?: string;
}

export interface SMSDeliveryMetadata {
  /** SMS message ID from provider */
  message_id: string;
  /** Phone number used */
  phone_number: string;
  /** SMS provider used */
  provider: 'TWILIO' | 'AWS_SNS';
  /** Message segments count */
  segments?: number;
  /** Delivery receipt ID */
  receipt_id?: string;
}

export interface PushDeliveryMetadata {
  /** Push notification ID */
  notification_id: string;
  /** Device token or registration ID */
  device_token: string;
  /** Push service used */
  service: 'FCM' | 'APNS' | 'WNS';
  /** Platform (iOS, Android, Web) */
  platform: string;
  /** TTL for the notification */
  ttl?: number;
}

export interface InAppDeliveryMetadata {
  /** WebSocket connection ID */
  connection_id?: string;
  /** Session ID where delivered */
  session_id?: string;
  /** Whether user was online */
  user_online: boolean;
  /** Browser/app info */
  user_agent?: string;
}

/**
 * Union type for delivery metadata
 */
export type DeliveryMetadata = EmailDeliveryMetadata | SMSDeliveryMetadata | PushDeliveryMetadata | InAppDeliveryMetadata;

/**
 * NotificationDelivery interface representing delivery tracking per channel
 */
export interface NotificationDelivery {
  /** Unique identifier for the delivery record */
  id: string;
  /** Parent notification ID */
  notification_id: string;
  /** Delivery channel used */
  channel: DeliveryChannel;
  /** Current delivery status */
  status: DeliveryStatus;
  /** Timestamp when delivery was initiated */
  sent_at?: Date | null;
  /** Timestamp when delivery was confirmed */
  delivered_at?: Date | null;
  /** Timestamp when delivery failed */
  failed_at?: Date | null;
  /** Provider-specific message identifier */
  provider_message_id?: string | null;
  /** Error message if delivery failed */
  error_message?: string | null;
  /** Channel-specific delivery metadata */
  metadata?: DeliveryMetadata | null;
}

/**
 * NotificationDelivery creation data interface
 */
export interface CreateNotificationDeliveryData {
  notification_id: string;
  channel: DeliveryChannel;
  metadata?: DeliveryMetadata | null;
}

/**
 * NotificationDelivery update data interface
 */
export interface UpdateNotificationDeliveryData {
  status?: DeliveryStatus;
  sent_at?: Date | null;
  delivered_at?: Date | null;
  failed_at?: Date | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  metadata?: DeliveryMetadata | null;
}

/**
 * Validation schema for NotificationDelivery creation
 */
export const CreateNotificationDeliverySchema = z.object({
  notification_id: z.string().uuid(),
  channel: z.nativeEnum(DeliveryChannel),
  metadata: z.record(z.any()).nullable().optional()
});

/**
 * Validation schema for NotificationDelivery updates
 */
export const UpdateNotificationDeliverySchema = z.object({
  status: z.nativeEnum(DeliveryStatus).optional(),
  sent_at: z.date().nullable().optional(),
  delivered_at: z.date().nullable().optional(),
  failed_at: z.date().nullable().optional(),
  provider_message_id: z.string().max(255).nullable().optional(),
  error_message: z.string().max(1000).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional()
});

/**
 * Valid status transitions for delivery tracking
 */
export const ValidDeliveryTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.SENT, DeliveryStatus.FAILED],
  [DeliveryStatus.SENT]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
  [DeliveryStatus.DELIVERED]: [], // Terminal state
  [DeliveryStatus.FAILED]: [] // Terminal state
};

/**
 * Channel priority for delivery ordering
 */
export const ChannelPriority: Record<DeliveryChannel, number> = {
  [DeliveryChannel.IN_APP]: 1, // Highest priority - immediate
  [DeliveryChannel.PUSH]: 2, // Second - near real-time
  [DeliveryChannel.SMS]: 3, // Third - important but slower
  [DeliveryChannel.EMAIL]: 4 // Lowest - can be batched
};

/**
 * NotificationDelivery model class with validation and helper methods
 */
export class NotificationDeliveryModel {
  /**
   * Validates delivery creation data
   */
  static validate(data: unknown): CreateNotificationDeliveryData {
    return CreateNotificationDeliverySchema.parse(data);
  }

  /**
   * Validates delivery update data
   */
  static validateUpdate(data: unknown): UpdateNotificationDeliveryData {
    return UpdateNotificationDeliverySchema.parse(data);
  }

  /**
   * Creates a new NotificationDelivery instance
   */
  static create(data: CreateNotificationDeliveryData): NotificationDelivery {
    const validated = this.validate(data);

    return {
      id: crypto.randomUUID(),
      notification_id: validated.notification_id,
      channel: validated.channel,
      status: DeliveryStatus.PENDING,
      sent_at: null,
      delivered_at: null,
      failed_at: null,
      provider_message_id: null,
      error_message: null,
      metadata: validated.metadata
    };
  }

  /**
   * Updates delivery status with validation
   */
  static updateStatus(delivery: NotificationDelivery, newStatus: DeliveryStatus, updateData?: Partial<UpdateNotificationDeliveryData>): Partial<NotificationDelivery> {
    // Validate state transition
    if (!this.canTransitionTo(delivery.status, newStatus)) {
      throw new Error(`Invalid status transition from ${delivery.status} to ${newStatus}`);
    }

    const updates: Partial<NotificationDelivery> = {
      status: newStatus,
      ...updateData
    };

    // Set timestamps based on status
    const now = new Date();
    switch (newStatus) {
      case DeliveryStatus.SENT:
        updates.sent_at = updateData?.sent_at || now;
        break;
      case DeliveryStatus.DELIVERED:
        updates.delivered_at = updateData?.delivered_at || now;
        if (!delivery.sent_at) {
          updates.sent_at = now;
        }
        break;
      case DeliveryStatus.FAILED:
        updates.failed_at = updateData?.failed_at || now;
        break;
    }

    return updates;
  }

  /**
   * Checks if a status transition is valid
   */
  static canTransitionTo(currentStatus: DeliveryStatus, newStatus: DeliveryStatus): boolean {
    return ValidDeliveryTransitions[currentStatus].includes(newStatus);
  }

  /**
   * Checks if delivery is in a terminal state
   */
  static isTerminalStatus(status: DeliveryStatus): boolean {
    return status === DeliveryStatus.DELIVERED || status === DeliveryStatus.FAILED;
  }

  /**
   * Gets delivery priority for channel ordering
   */
  static getChannelPriority(channel: DeliveryChannel): number {
    return ChannelPriority[channel];
  }

  /**
   * Sorts channels by delivery priority
   */
  static sortChannelsByPriority(channels: DeliveryChannel[]): DeliveryChannel[] {
    return [...channels].sort((a, b) => this.getChannelPriority(a) - this.getChannelPriority(b));
  }

  /**
   * Gets expected delivery time for a channel
   */
  static getExpectedDeliveryTime(channel: DeliveryChannel): number {
    const times = {
      [DeliveryChannel.IN_APP]: 1000, // 1 second
      [DeliveryChannel.PUSH]: 5000, // 5 seconds
      [DeliveryChannel.SMS]: 30000, // 30 seconds
      [DeliveryChannel.EMAIL]: 60000 // 1 minute
    };
    return times[channel];
  }

  /**
   * Checks if delivery is overdue
   */
  static isOverdue(delivery: NotificationDelivery): boolean {
    if (!delivery.sent_at || this.isTerminalStatus(delivery.status)) {
      return false;
    }

    const expectedTime = this.getExpectedDeliveryTime(delivery.channel);
    const elapsed = Date.now() - delivery.sent_at.getTime();
    return elapsed > expectedTime * 2; // Allow 2x expected time
  }

  /**
   * Gets delivery duration in milliseconds
   */
  static getDeliveryDuration(delivery: NotificationDelivery): number | null {
    if (!delivery.sent_at || !delivery.delivered_at) {
      return null;
    }
    return delivery.delivered_at.getTime() - delivery.sent_at.getTime();
  }

  /**
   * Creates channel-specific metadata validators
   */
  static validateChannelMetadata(channel: DeliveryChannel, metadata: any): boolean {
    try {
      switch (channel) {
        case DeliveryChannel.EMAIL:
          z.object({
            message_id: z.string(),
            provider: z.enum(['RESEND', 'MAILGUN']),
            smtp_code: z.number().optional(),
            bounce_type: z.enum(['soft', 'hard', 'complaint']).optional(),
            tracking_url: z.string().url().optional()
          }).parse(metadata);
          return true;

        case DeliveryChannel.SMS:
          z.object({
            message_id: z.string(),
            phone_number: z.string(),
            provider: z.enum(['TWILIO', 'AWS_SNS']),
            segments: z.number().int().positive().optional(),
            receipt_id: z.string().optional()
          }).parse(metadata);
          return true;

        case DeliveryChannel.PUSH:
          z.object({
            notification_id: z.string(),
            device_token: z.string(),
            service: z.enum(['FCM', 'APNS', 'WNS']),
            platform: z.string(),
            ttl: z.number().int().positive().optional()
          }).parse(metadata);
          return true;

        case DeliveryChannel.IN_APP:
          z.object({
            connection_id: z.string().optional(),
            session_id: z.string().optional(),
            user_online: z.boolean(),
            user_agent: z.string().optional()
          }).parse(metadata);
          return true;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Gets delivery status display with color coding
   */
  static getStatusDisplay(status: DeliveryStatus): { text: string; color: string } {
    const displays = {
      [DeliveryStatus.PENDING]: { text: 'Pending', color: 'gray' },
      [DeliveryStatus.SENT]: { text: 'Sent', color: 'blue' },
      [DeliveryStatus.DELIVERED]: { text: 'Delivered', color: 'green' },
      [DeliveryStatus.FAILED]: { text: 'Failed', color: 'red' }
    };
    return displays[status];
  }

  /**
   * Gets channel display name with icon
   */
  static getChannelDisplay(channel: DeliveryChannel): { name: string; icon: string } {
    const displays = {
      [DeliveryChannel.EMAIL]: { name: 'Email', icon: '📧' },
      [DeliveryChannel.SMS]: { name: 'SMS', icon: '📱' },
      [DeliveryChannel.PUSH]: { name: 'Push', icon: '🔔' },
      [DeliveryChannel.IN_APP]: { name: 'In-App', icon: '💬' }
    };
    return displays[channel];
  }

  /**
   * Formats delivery for display
   */
  static format(delivery: NotificationDelivery): string {
    const channel = delivery.channel.toLowerCase();
    const status = delivery.status.toLowerCase();
    const duration = delivery.sent_at && delivery.delivered_at ?
      `${this.getDeliveryDuration(delivery)}ms` : 'N/A';

    return `${delivery.notification_id} | ${channel} | ${status} | ${duration}`;
  }

  /**
   * Creates a delivery filter for querying
   */
  static createFilter(options: {
    notificationId?: string;
    channel?: DeliveryChannel;
    status?: DeliveryStatus;
    startTime?: Date;
    endTime?: Date;
    isOverdue?: boolean;
    hasMetadata?: boolean;
  }) {
    const filter: any = {};

    if (options.notificationId) filter.notification_id = options.notificationId;
    if (options.channel) filter.channel = options.channel;
    if (options.status) filter.status = options.status;

    if (options.startTime || options.endTime) {
      filter.sent_at = {};
      if (options.startTime) filter.sent_at.gte = options.startTime;
      if (options.endTime) filter.sent_at.lte = options.endTime;
    }

    if (options.hasMetadata !== undefined) {
      filter.metadata = options.hasMetadata ? { not: null } : null;
    }

    // Overdue filtering would need to be handled in the service layer
    return filter;
  }

  /**
   * Generates delivery statistics per channel
   */
  static generateChannelStats(deliveries: NotificationDelivery[]): Record<DeliveryChannel, {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    avgDeliveryTime: number;
  }> {
    const stats: any = {};

    Object.values(DeliveryChannel).forEach(channel => {
      const channelDeliveries = deliveries.filter(d => d.channel === channel);
      const total = channelDeliveries.length;
      const pending = channelDeliveries.filter(d => d.status === DeliveryStatus.PENDING).length;
      const sent = channelDeliveries.filter(d => d.status === DeliveryStatus.SENT).length;
      const delivered = channelDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length;
      const failed = channelDeliveries.filter(d => d.status === DeliveryStatus.FAILED).length;

      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

      const deliveryTimes = channelDeliveries
        .map(d => this.getDeliveryDuration(d))
        .filter(time => time !== null) as number[];

      const avgDeliveryTime = deliveryTimes.length > 0 ?
        deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length : 0;

      stats[channel] = {
        total,
        pending,
        sent,
        delivered,
        failed,
        deliveryRate,
        avgDeliveryTime
      };
    });

    return stats;
  }

  /**
   * Bulk creates delivery records for multiple channels
   */
  static createBulk(notificationId: string, channels: DeliveryChannel[]): NotificationDelivery[] {
    return channels.map(channel => this.create({
      notification_id: notificationId,
      channel
    }));
  }
}

/**
 * Type guard to check if an object is a valid NotificationDelivery
 */
export function isNotificationDelivery(obj: any): obj is NotificationDelivery {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.notification_id === 'string' &&
    Object.values(DeliveryChannel).includes(obj.channel) &&
    Object.values(DeliveryStatus).includes(obj.status)
  );
}

export default NotificationDeliveryModel;