export enum DeliveryEvent {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  DELIVERY_DELAYED = 'delivery_delayed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
  FAILED = 'failed'
}

export interface EmailDeliveryLog {
  // Core identification
  id: string;                      // Log entry ID
  notificationId: string;          // Reference to EmailNotification
  userId?: string;                 // Recipient user

  // Delivery details
  event: DeliveryEvent;            // Type of event
  status: string;                  // Event-specific status
  timestamp: Date;                 // When event occurred

  // Email details
  recipientEmail: string;          // Email address
  subject: string;                 // Email subject (for search)
  templateId: string;              // Template used
  messageId: string;               // Provider message ID

  // Provider information
  provider: string;                // 'resend' or fallback
  providerResponse?: any;          // Raw provider response
  providerMessageId?: string;      // Provider's ID

  // Metrics
  emailSize: number;               // Size in bytes
  processingTime: number;          // Time to send (ms)
  deliveryTime?: number;           // Time to deliver (ms)

  // User engagement
  opened: boolean;                 // Email was opened
  clicked: boolean;                // Links were clicked
  unsubscribed: boolean;           // User unsubscribed
  complained: boolean;             // Marked as spam

  // Error information
  error?: string;                  // Error message
  errorCode?: string;              // Error code
  errorDetails?: any;              // Additional error data

  // Network information
  ipAddress?: string;              // Sender IP
  userAgent?: string;              // Email client info
  location?: string;               // Geographic location

  // Audit trail
  createdAt: Date;
}

export class EmailDeliveryLogModel {
  private static logs: EmailDeliveryLog[] = [];

  static validate(log: Partial<EmailDeliveryLog>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!log.notificationId) {
      errors.push('notificationId is required');
    }

    if (!log.event || !Object.values(DeliveryEvent).includes(log.event)) {
      errors.push('event must be valid DeliveryEvent');
    }

    if (!log.recipientEmail) {
      errors.push('recipientEmail is required');
    }

    if (!log.subject) {
      errors.push('subject is required');
    }

    if (!log.templateId) {
      errors.push('templateId is required');
    }

    if (!log.messageId) {
      errors.push('messageId is required');
    }

    if (!log.provider) {
      errors.push('provider is required');
    }

    // Validation constraints
    if (log.emailSize && log.emailSize > 25 * 1024 * 1024) {
      errors.push('emailSize must be under 25MB');
    }

    if (log.timestamp) {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      if (log.timestamp < oneYearAgo || log.timestamp > oneHourFromNow) {
        errors.push('timestamp must be within reasonable range');
      }
    }

    return errors;
  }

  static create(data: Partial<EmailDeliveryLog>): EmailDeliveryLog {
    const log: EmailDeliveryLog = {
      id: crypto.randomUUID(),
      notificationId: data.notificationId!,
      userId: data.userId,
      event: data.event!,
      status: data.status || '',
      timestamp: data.timestamp || new Date(),
      recipientEmail: data.recipientEmail!,
      subject: data.subject!,
      templateId: data.templateId!,
      messageId: data.messageId!,
      provider: data.provider || 'resend',
      providerResponse: data.providerResponse,
      providerMessageId: data.providerMessageId,
      emailSize: data.emailSize || 0,
      processingTime: data.processingTime || 0,
      deliveryTime: data.deliveryTime,
      opened: data.opened || false,
      clicked: data.clicked || false,
      unsubscribed: data.unsubscribed || false,
      complained: data.complained || false,
      error: data.error,
      errorCode: data.errorCode,
      errorDetails: data.errorDetails,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      createdAt: new Date()
    };

    this.logs.push(log);
    return log;
  }

  static getByNotificationId(notificationId: string): EmailDeliveryLog[] {
    return this.logs.filter(log => log.notificationId === notificationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  static getByUserId(userId: string, limit = 100): EmailDeliveryLog[] {
    return this.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static getByTimeRange(start: Date, end: Date): EmailDeliveryLog[] {
    return this.logs.filter(log => 
      log.timestamp >= start && log.timestamp <= end
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static getMetrics(start: Date, end: Date): {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplaints: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    avgProcessingTime: number;
  } {
    const logs = this.getByTimeRange(start, end);
    
    const sent = logs.filter(l => l.event === DeliveryEvent.SENT).length;
    const delivered = logs.filter(l => l.event === DeliveryEvent.DELIVERED).length;
    const opened = logs.filter(l => l.event === DeliveryEvent.OPENED).length;
    const clicked = logs.filter(l => l.event === DeliveryEvent.CLICKED).length;
    const bounced = logs.filter(l => l.event === DeliveryEvent.BOUNCED).length;
    const complaints = logs.filter(l => l.event === DeliveryEvent.COMPLAINED).length;
    
    const avgProcessingTime = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.processingTime, 0) / logs.length 
      : 0;

    return {
      totalSent: sent,
      totalDelivered: delivered,
      totalOpened: opened,
      totalClicked: clicked,
      totalBounced: bounced,
      totalComplaints: complaints,
      deliveryRate: sent > 0 ? delivered / sent : 0,
      openRate: delivered > 0 ? opened / delivered : 0,
      clickRate: opened > 0 ? clicked / opened : 0,
      avgProcessingTime
    };
  }

  static cleanup(retentionDays = 180): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.createdAt >= cutoffDate);
    
    return initialCount - this.logs.length;
  }

  static logDeliveryEvent(
    notificationId: string,
    event: DeliveryEvent,
    data: Partial<EmailDeliveryLog>
  ): EmailDeliveryLog {
    return this.create({
      notificationId,
      event,
      ...data
    });
  }
}