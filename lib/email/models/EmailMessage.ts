/**
 * EmailMessage model for tracking email delivery and content
 * Supports multiple providers, templates, attachments, and delivery tracking
 */

import { z } from 'zod';

/**
 * Email provider enumeration
 */
export enum EmailProvider {
  RESEND = 'RESEND',
  MAILGUN = 'MAILGUN'
}

/**
 * Email status enumeration for tracking delivery
 */
export enum EmailStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  BOUNCED = 'BOUNCED',
  FAILED = 'FAILED'
}

/**
 * Email bounce type classification
 */
export enum BounceType {
  SOFT = 'soft',
  HARD = 'hard',
  COMPLAINT = 'complaint'
}

/**
 * Email attachment structure
 */
export interface EmailAttachment {
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME content type */
  content_type: string;
  /** Optional content ID for inline attachments */
  content_id?: string;
  /** Whether this is an inline attachment */
  inline?: boolean;
}

/**
 * EmailMessage interface representing the complete email structure
 */
export interface EmailMessage {
  /** Unique identifier for the email */
  id: string;
  /** Provider-specific message ID */
  message_id: string;
  /** Sender email address */
  from: string;
  /** Recipient email addresses */
  to: string[];
  /** CC recipient email addresses */
  cc?: string[] | null;
  /** BCC recipient email addresses */
  bcc?: string[] | null;
  /** Email subject line */
  subject: string;
  /** HTML body content */
  html_body?: string | null;
  /** Plain text body content */
  text_body: string;
  /** Email attachments */
  attachments?: EmailAttachment[] | null;
  /** Template ID if using a template */
  template_id?: string | null;
  /** Template data for variable substitution */
  template_data?: Record<string, any> | null;
  /** Email service provider used */
  provider: EmailProvider;
  /** Current email status */
  status: EmailStatus;
  /** Email creation timestamp */
  created_at: Date;
  /** Email sent timestamp */
  sent_at?: Date | null;
  /** Email delivered timestamp */
  delivered_at?: Date | null;
  /** First email open timestamp */
  opened_at?: Date | null;
  /** First link click timestamp */
  clicked_at?: Date | null;
  /** Bounce type if bounced */
  bounce_type?: string | null;
  /** Error message if failed */
  error_message?: string | null;
  /** Number of send retry attempts */
  retry_count: number;
}

/**
 * EmailMessage creation data interface
 */
export interface CreateEmailMessageData {
  from: string;
  to: string[];
  cc?: string[] | null;
  bcc?: string[] | null;
  subject: string;
  html_body?: string | null;
  text_body?: string;
  attachments?: EmailAttachment[] | null;
  template_id?: string | null;
  template_data?: Record<string, any> | null;
  provider?: EmailProvider;
}

/**
 * EmailMessage update data interface
 */
export interface UpdateEmailMessageData {
  message_id?: string;
  status?: EmailStatus;
  sent_at?: Date | null;
  delivered_at?: Date | null;
  opened_at?: Date | null;
  clicked_at?: Date | null;
  bounce_type?: string | null;
  error_message?: string | null;
  retry_count?: number;
}

/**
 * Validation schema for email addresses
 */
const emailSchema = z.string().email();

/**
 * Validation schema for email attachments
 */
export const EmailAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  size: z.number().int().min(0).max(25 * 1024 * 1024), // 25MB max
  content_type: z.string().min(1),
  content_id: z.string().optional(),
  inline: z.boolean().optional().default(false)
});

/**
 * Validation schema for EmailMessage creation
 */
export const CreateEmailMessageSchema = z.object({
  from: emailSchema,
  to: z.array(emailSchema).min(1).max(100),
  cc: z.array(emailSchema).max(100).nullable().optional(),
  bcc: z.array(emailSchema).max(100).nullable().optional(),
  subject: z.string().min(1).max(200),
  html_body: z.string().max(1024 * 1024).nullable().optional(), // 1MB max
  text_body: z.string().min(1).max(1024 * 1024).optional(), // 1MB max
  attachments: z.array(EmailAttachmentSchema).max(10).nullable().optional(),
  template_id: z.string().max(100).nullable().optional(),
  template_data: z.record(z.any()).nullable().optional(),
  provider: z.nativeEnum(EmailProvider).optional().default(EmailProvider.RESEND)
}).refine(data => data.html_body || data.text_body, {
  message: 'Either html_body or text_body must be provided'
});

/**
 * Validation schema for EmailMessage updates
 */
export const UpdateEmailMessageSchema = z.object({
  message_id: z.string().optional(),
  status: z.nativeEnum(EmailStatus).optional(),
  sent_at: z.date().nullable().optional(),
  delivered_at: z.date().nullable().optional(),
  opened_at: z.date().nullable().optional(),
  clicked_at: z.date().nullable().optional(),
  bounce_type: z.string().max(50).nullable().optional(),
  error_message: z.string().max(1000).nullable().optional(),
  retry_count: z.number().int().min(0).max(10).optional()
});

/**
 * Valid status transitions for email delivery
 */
export const ValidStatusTransitions: Record<EmailStatus, EmailStatus[]> = {
  [EmailStatus.QUEUED]: [EmailStatus.SENT, EmailStatus.FAILED],
  [EmailStatus.SENT]: [EmailStatus.DELIVERED, EmailStatus.BOUNCED, EmailStatus.FAILED],
  [EmailStatus.DELIVERED]: [], // Terminal state
  [EmailStatus.BOUNCED]: [], // Terminal state
  [EmailStatus.FAILED]: [EmailStatus.QUEUED] // Can retry
};

/**
 * EmailMessage model class with validation and helper methods
 */
export class EmailMessageModel {
  /**
   * Validates email creation data
   */
  static validate(data: unknown): CreateEmailMessageData {
    const validated = CreateEmailMessageSchema.parse(data);

    // Calculate total size including attachments
    const totalSize = this.calculateTotalSize(validated);
    if (totalSize > 25 * 1024 * 1024) { // 25MB limit
      throw new Error('Total email size including attachments exceeds 25MB limit');
    }

    return validated;
  }

  /**
   * Validates email update data
   */
  static validateUpdate(data: unknown): UpdateEmailMessageData {
    return UpdateEmailMessageSchema.parse(data);
  }

  /**
   * Creates a new EmailMessage instance with generated UUID
   */
  static create(data: CreateEmailMessageData): EmailMessage {
    const validated = this.validate(data);

    // Generate text body from HTML if not provided
    const textBody = validated.text_body || this.htmlToText(validated.html_body || '');

    return {
      id: crypto.randomUUID(),
      message_id: '', // Will be set by provider
      from: validated.from,
      to: validated.to,
      cc: validated.cc,
      bcc: validated.bcc,
      subject: validated.subject,
      html_body: validated.html_body,
      text_body: textBody,
      attachments: validated.attachments,
      template_id: validated.template_id,
      template_data: validated.template_data,
      provider: validated.provider || EmailProvider.RESEND,
      status: EmailStatus.QUEUED,
      created_at: new Date(),
      sent_at: null,
      delivered_at: null,
      opened_at: null,
      clicked_at: null,
      bounce_type: null,
      error_message: null,
      retry_count: 0
    };
  }

  /**
   * Updates email status with validation
   */
  static updateStatus(email: EmailMessage, newStatus: EmailStatus, metadata?: Partial<UpdateEmailMessageData>): Partial<EmailMessage> {
    // Validate state transition
    if (!this.canTransitionTo(email.status, newStatus)) {
      throw new Error(`Invalid status transition from ${email.status} to ${newStatus}`);
    }

    const updates: Partial<EmailMessage> = {
      status: newStatus,
      ...metadata
    };

    // Set timestamps based on status
    const now = new Date();
    switch (newStatus) {
      case EmailStatus.SENT:
        updates.sent_at = metadata?.sent_at || now;
        break;
      case EmailStatus.DELIVERED:
        updates.delivered_at = metadata?.delivered_at || now;
        if (!email.sent_at) {
          updates.sent_at = now;
        }
        break;
      case EmailStatus.BOUNCED:
        updates.bounce_type = metadata?.bounce_type || 'unknown';
        break;
      case EmailStatus.FAILED:
        updates.retry_count = email.retry_count + 1;
        break;
    }

    return updates;
  }

  /**
   * Checks if a status transition is valid
   */
  static canTransitionTo(currentStatus: EmailStatus, newStatus: EmailStatus): boolean {
    return ValidStatusTransitions[currentStatus].includes(newStatus);
  }

  /**
   * Checks if an email should be retried
   */
  static shouldRetry(email: EmailMessage, maxRetries: number = 3): boolean {
    return (
      email.status === EmailStatus.FAILED &&
      email.retry_count < maxRetries
    );
  }

  /**
   * Gets retry delay based on attempt count
   */
  static getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1min, 5min, 15min
    const delays = [60000, 300000, 900000]; // in milliseconds
    return delays[Math.min(retryCount, delays.length - 1)];
  }

  /**
   * Calculates total email size including attachments
   */
  static calculateTotalSize(email: CreateEmailMessageData | EmailMessage): number {
    let size = 0;

    // Add body sizes
    if (email.html_body) size += Buffer.byteLength(email.html_body, 'utf8');
    if (email.text_body) size += Buffer.byteLength(email.text_body, 'utf8');

    // Add attachment sizes
    if (email.attachments) {
      size += email.attachments.reduce((total, attachment) => total + attachment.size, 0);
    }

    return size;
  }

  /**
   * Checks if an email is trackable (has tracking enabled)
   */
  static isTrackable(email: EmailMessage): boolean {
    return email.html_body !== null; // Only HTML emails support tracking
  }

  /**
   * Gets email engagement metrics
   */
  static getEngagementMetrics(email: EmailMessage): {
    sent: boolean;
    delivered: boolean;
    opened: boolean;
    clicked: boolean;
    deliveryTime?: number;
    openTime?: number;
    clickTime?: number;
  } {
    const sent = email.sent_at !== null;
    const delivered = email.delivered_at !== null;
    const opened = email.opened_at !== null;
    const clicked = email.clicked_at !== null;

    const metrics: any = { sent, delivered, opened, clicked };

    if (sent && delivered && email.sent_at && email.delivered_at) {
      metrics.deliveryTime = email.delivered_at.getTime() - email.sent_at.getTime();
    }

    if (delivered && opened && email.delivered_at && email.opened_at) {
      metrics.openTime = email.opened_at.getTime() - email.delivered_at.getTime();
    }

    if (opened && clicked && email.opened_at && email.clicked_at) {
      metrics.clickTime = email.clicked_at.getTime() - email.opened_at.getTime();
    }

    return metrics;
  }

  /**
   * Gets email status display with color coding
   */
  static getStatusDisplay(status: EmailStatus): { text: string; color: string } {
    const displays = {
      [EmailStatus.QUEUED]: { text: 'Queued', color: 'blue' },
      [EmailStatus.SENT]: { text: 'Sent', color: 'green' },
      [EmailStatus.DELIVERED]: { text: 'Delivered', color: 'green' },
      [EmailStatus.BOUNCED]: { text: 'Bounced', color: 'red' },
      [EmailStatus.FAILED]: { text: 'Failed', color: 'red' }
    };
    return displays[status];
  }

  /**
   * Validates email address format
   */
  static isValidEmail(email: string): boolean {
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extracts email domain
   */
  static extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || '';
  }

  /**
   * Checks if email domain is likely spam/temporary
   */
  static isSuspiciousDomain(email: string): boolean {
    const domain = this.extractDomain(email);
    const suspiciousDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email'
    ];
    return suspiciousDomains.includes(domain);
  }

  /**
   * Simple HTML to text conversion
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Formats email for display
   */
  static format(email: EmailMessage): string {
    const timestamp = email.created_at.toISOString();
    const status = email.status.toLowerCase();
    const recipients = email.to.length > 1 ? `${email.to[0]} +${email.to.length - 1}` : email.to[0];
    const size = this.formatSize(this.calculateTotalSize(email));

    return `${timestamp} | ${status} | ${recipients} | ${email.subject} | ${size}`;
  }

  /**
   * Formats byte size for display
   */
  private static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  /**
   * Creates an email filter for querying
   */
  static createFilter(options: {
    from?: string;
    to?: string;
    subject?: string;
    status?: EmailStatus;
    provider?: EmailProvider;
    startTime?: Date;
    endTime?: Date;
    hasAttachments?: boolean;
    templateId?: string;
  }) {
    const filter: any = {};

    if (options.from) filter.from = { contains: options.from };
    if (options.to) filter.to = { contains: options.to };
    if (options.subject) filter.subject = { contains: options.subject };
    if (options.status) filter.status = options.status;
    if (options.provider) filter.provider = options.provider;
    if (options.templateId) filter.template_id = options.templateId;

    if (options.startTime || options.endTime) {
      filter.created_at = {};
      if (options.startTime) filter.created_at.gte = options.startTime;
      if (options.endTime) filter.created_at.lte = options.endTime;
    }

    if (options.hasAttachments !== undefined) {
      filter.attachments = options.hasAttachments ? { not: null } : null;
    }

    return filter;
  }

  /**
   * Generates delivery statistics
   */
  static generateDeliveryStats(emails: EmailMessage[]): {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  } {
    const total = emails.length;
    const sent = emails.filter(e => e.sent_at !== null).length;
    const delivered = emails.filter(e => e.delivered_at !== null).length;
    const opened = emails.filter(e => e.opened_at !== null).length;
    const clicked = emails.filter(e => e.clicked_at !== null).length;
    const bounced = emails.filter(e => e.status === EmailStatus.BOUNCED).length;
    const failed = emails.filter(e => e.status === EmailStatus.FAILED).length;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0
    };
  }
}

/**
 * Type guard to check if an object is a valid EmailMessage
 */
export function isEmailMessage(obj: any): obj is EmailMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.message_id === 'string' &&
    typeof obj.from === 'string' &&
    Array.isArray(obj.to) &&
    typeof obj.subject === 'string' &&
    typeof obj.text_body === 'string' &&
    Object.values(EmailProvider).includes(obj.provider) &&
    Object.values(EmailStatus).includes(obj.status) &&
    obj.created_at instanceof Date &&
    typeof obj.retry_count === 'number'
  );
}

export default EmailMessageModel;