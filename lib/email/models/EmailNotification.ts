export enum NotificationType {
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_DELETED = 'account_deleted',
  FILE_UPLOADED = 'file_uploaded',
  EDIT_COMPLETED = 'edit_completed',
  COLLABORATION_INVITE = 'collaboration_invite',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_ALERT = 'system_alert',
  ERROR_ALERT = 'error_alert',
  WEEKLY_SUMMARY = 'weekly_summary',
  MONTHLY_REPORT = 'monthly_report'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed'
}

export enum EmailPriority {
  HIGH = 1,      // Immediate send
  NORMAL = 2,    // Within 5 minutes
  LOW = 3        // Batch processing
}

export enum EmailCategory {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  ALERT = 'alert',
  ACTIVITY = 'activity'
}

export interface WebhookEvent {
  type: string;
  timestamp: Date;
  details: Record<string, any>;
}

export interface EmailNotification {
  // Core identification
  id: string;                      // Unique notification ID (UUID)
  userId?: string;                 // Recipient user ID (null for non-user emails)
  recipientEmail: string;          // Recipient email address
  recipientName?: string;          // Recipient display name

  // Email content
  subject: string;                 // Email subject line
  templateId: string;              // Reference to notification template
  templateData: Record<string, any>; // Variables for template rendering
  htmlBody?: string;               // Rendered HTML content (cached)
  textBody?: string;               // Rendered plain text content

  // Email metadata
  type: NotificationType;          // Type of notification
  priority: EmailPriority;         // Delivery priority (1-3)
  category: EmailCategory;         // Transactional, marketing, alert

  // Delivery information
  status: DeliveryStatus;          // Current delivery status
  sentAt?: Date;                   // When email was sent
  deliveredAt?: Date;              // When email was delivered
  openedAt?: Date;                 // When email was first opened
  clickedAt?: Date;                // When links were clicked

  // Error handling
  failureReason?: string;          // Error message if failed
  retryCount: number;              // Number of retry attempts
  nextRetryAt?: Date;              // Scheduled retry time

  // Tracking
  messageId?: string;              // Resend message ID
  correlationId?: string;          // For linking related events
  webhookEvents: WebhookEvent[];  // Resend webhook events

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;              // System or user that triggered
}

export class EmailNotificationModel {
  static validate(notification: Partial<EmailNotification>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!notification.recipientEmail) {
      errors.push('recipientEmail is required');
    } else if (!this.isValidEmail(notification.recipientEmail)) {
      errors.push('recipientEmail must be valid email format');
    }

    if (!notification.subject) {
      errors.push('subject is required');
    }

    if (!notification.templateId) {
      errors.push('templateId is required');
    }

    if (!notification.type || !Object.values(NotificationType).includes(notification.type)) {
      errors.push('type must be valid NotificationType');
    }

    // Priority validation
    if (notification.priority && ![1, 2, 3].includes(notification.priority)) {
      errors.push('priority must be between 1 and 3');
    }

    // Retry count validation
    if (notification.retryCount && notification.retryCount > 3) {
      errors.push('retryCount must not exceed 3');
    }

    return errors;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static create(data: Partial<EmailNotification>): EmailNotification {
    const now = new Date();

    return {
      id: crypto.randomUUID(),
      recipientEmail: data.recipientEmail!,
      recipientName: data.recipientName,
      userId: data.userId,
      subject: data.subject!,
      templateId: data.templateId!,
      templateData: data.templateData || {},
      htmlBody: data.htmlBody,
      textBody: data.textBody,
      type: data.type!,
      priority: data.priority || EmailPriority.NORMAL,
      category: data.category || EmailCategory.TRANSACTIONAL,
      status: DeliveryStatus.PENDING,
      retryCount: 0,
      webhookEvents: [],
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy,
      sentAt: data.sentAt,
      deliveredAt: data.deliveredAt,
      openedAt: data.openedAt,
      clickedAt: data.clickedAt,
      failureReason: data.failureReason,
      nextRetryAt: data.nextRetryAt,
      messageId: data.messageId,
      correlationId: data.correlationId
    };
  }

  static updateStatus(
    notification: EmailNotification,
    status: DeliveryStatus,
    additionalData?: Partial<EmailNotification>
  ): EmailNotification {
    const updated = {
      ...notification,
      status,
      updatedAt: new Date(),
      ...additionalData
    };

    // Set timestamps based on status
    switch (status) {
      case DeliveryStatus.SENT:
        updated.sentAt = updated.sentAt || new Date();
        break;
      case DeliveryStatus.DELIVERED:
        updated.deliveredAt = updated.deliveredAt || new Date();
        break;
      case DeliveryStatus.OPENED:
        updated.openedAt = updated.openedAt || new Date();
        break;
      case DeliveryStatus.CLICKED:
        updated.clickedAt = updated.clickedAt || new Date();
        break;
    }

    return updated;
  }
}