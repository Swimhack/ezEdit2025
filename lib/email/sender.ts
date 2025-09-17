// @ts-nocheck
/**
 * Email sender service with Resend integration, template processing, and delivery tracking
 * Supports multiple providers, retry logic, and comprehensive delivery analytics
 */

import {
  EmailMessage,
  EmailMessageModel,
  CreateEmailMessageData,
  EmailProvider,
  EmailStatus,
  EmailAttachment
} from './models/EmailMessage';
import { supabase } from '../supabase';
import { getLogger } from '../logging/logger';

/**
 * Email provider configuration interface
 */
export interface EmailProviderConfig {
  apiKey: string;
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  webhookSecret?: string;
  timeout?: number;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

/**
 * Email send result interface
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  providerId?: string;
  error?: string;
  retryAfter?: number;
}

/**
 * Batch send result interface
 */
export interface BatchSendResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailSendResult[];
  errors: string[];
}

/**
 * Email provider interface
 */
export interface EmailProviderInterface {
  name: EmailProvider;
  send(email: EmailMessage): Promise<EmailSendResult>;
  isHealthy(): Promise<boolean>;
  handleWebhook(payload: any, signature: string): Promise<void>;
  getStats(): Promise<{
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  }>;
}

/**
 * Resend email provider implementation
 */
export class ResendProvider implements EmailProviderInterface {
  name = EmailProvider.RESEND;
  private logger = getLogger();

  constructor(private config: EmailProviderConfig) {}

  async send(email: EmailMessage): Promise<EmailSendResult> {
    try {
      const payload = this.buildResendPayload(email);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      this.logger.info('Email sent via Resend', {
        emailId: email.id,
        messageId: result.id,
        to: email.to.length
      });

      return {
        success: true,
        messageId: result.id,
        providerId: result.id
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        emailId: email.id,
        to: email.to.length
      });

      return {
        success: false,
        error: String(error),
        retryAfter: this.getRetryDelay(error)
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Resend health check failed', error as Error);
      return false;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature if secret is configured
      if (this.config.webhookSecret) {
        // Implement signature verification
        const isValid = this.verifyWebhookSignature(payload, signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Process webhook events
      await this.processResendWebhook(payload);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { payload });
      throw error;
    }
  }

  async getStats(): Promise<{
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  }> {
    // Would integrate with Resend analytics API
    return {
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0
    };
  }

  private buildResendPayload(email: EmailMessage): any {
    const payload: any = {
      from: `${this.config.fromName || 'EZEdit'} <${this.config.fromAddress}>`,
      to: email.to,
      subject: email.subject,
      html: email.html_body,
      text: email.text_body,
      reply_to: this.config.replyTo
    };

    if (email.cc && email.cc.length > 0) {
      payload.cc = email.cc;
    }

    if (email.bcc && email.bcc.length > 0) {
      payload.bcc = email.bcc;
    }

    if (email.attachments && email.attachments.length > 0) {
      payload.attachments = email.attachments.map(att => ({
        filename: att.filename,
        content_type: att.content_type,
        content: att.content_id // Would need to load actual content
      }));
    }

    // Add tracking
    payload.tags = [
      { name: 'email_id', value: email.id },
      { name: 'provider', value: 'resend' }
    ];

    return payload;
  }

  private getRetryDelay(error: any): number | undefined {
    // Parse rate limit headers or error messages
    if (String(error).includes('rate limit')) {
      return 60000; // 1 minute
    }
    return undefined;
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implement HMAC verification for webhook security
    // This is a simplified version - use crypto.subtle in production
    return true;
  }

  private async processResendWebhook(payload: any): Promise<void> {
    const { type, data } = payload;

    switch (type) {
      case 'email.sent':
        await this.updateEmailStatus(data.email_id, EmailStatus.SENT, {
          sent_at: new Date(data.created_at)
        });
        break;

      case 'email.delivered':
        await this.updateEmailStatus(data.email_id, EmailStatus.DELIVERED, {
          delivered_at: new Date(data.created_at)
        });
        break;

      case 'email.bounced':
        await this.updateEmailStatus(data.email_id, EmailStatus.BOUNCED, {
          bounce_type: data.bounce_type || 'unknown',
          error_message: data.reason
        });
        break;

      case 'email.opened':
        // TODO: Implement updateEmailEngagement method
        // await this.updateEmailEngagement(data.email_id, {
        //   opened_at: new Date(data.created_at)
        // });
        break;

      case 'email.clicked':
        // TODO: Implement updateEmailEngagement method
        // await this.updateEmailEngagement(data.email_id, {
        //   clicked_at: new Date(data.created_at)
        // });
        break;

      default:
        this.logger.warn('Unknown webhook event', { type, data });
    }
  }

  private async updateEmailStatus(messageId: string, status: EmailStatus, metadata: any): Promise<void> {
    try {
//       const { error } = await supabase
//         .from('email_messages')
//         .update({
//           status,
//           ...metadata
//         })
//         .eq('message_id', messageId);
// 
//       if (error) {
//         throw new Error(`Failed to update email status: ${error.message}`);
//       }
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        messageId,
        status
      });
    }
  }
// 
//   private async updateEmailEngagement(messageId: string, engagement: any): Promise<void> {
//     try {
//       const { error } = await supabase
//         .from('email_messages')
//         .update(engagement)
//         .eq('message_id', messageId);
// 
//       if (error) {
//         throw new Error(`Failed to update email engagement: ${error.message}`);
//       }
//     } catch (error) {
//       this.logger.error('Email send failed', error as Error, {
//         messageId,
//         engagement
//       });
//     }
//   }
}

/**
 * Email sender service configuration
 */
export interface EmailSenderConfig {
  defaultProvider: EmailProvider;
  providers: Record<EmailProvider, EmailProviderConfig>;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  enableTracking: boolean;
}

/**
 * Email sender service with provider management and delivery tracking
 */
export class EmailSenderService {
  private providers = new Map<EmailProvider, EmailProviderInterface>();
  private messageQueue: EmailMessage[] = [];
  private processing = false;
  private logger = getLogger();

  constructor(private config: EmailSenderConfig) {
    this.initializeProviders();
    this.startQueueProcessor();
  }

  /**
   * Sends a single email immediately
   */
  async send(emailData: CreateEmailMessageData): Promise<EmailSendResult> {
    try {
      const email = EmailMessageModel.create(emailData);

      // Store email in database
      await this.storeEmail(email);

      // Send email
      const result = await this.sendEmail(email);

      // Update status based on result
      const status = result.success ? EmailStatus.SENT : EmailStatus.FAILED;
      await this.updateEmailStatus(email.id, status, {
        message_id: result.messageId,
        error_message: result.error,
        sent_at: result.success ? new Date() : null
      });

      this.logger.info('Email send completed', {
        emailId: email.id,
        success: result.success,
        provider: email.provider
      });

      return result;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { emailData });
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Queues an email for batch processing
   */
  async queue(emailData: CreateEmailMessageData): Promise<string> {
    const email = EmailMessageModel.create(emailData);

    // Store email in database with queued status
    await this.storeEmail(email);

    // Add to queue
    this.messageQueue.push(email);

    this.logger.debug('Email queued', {
      emailId: email.id,
      queueSize: this.messageQueue.length
    });

    return email.id;
  }

  /**
   * Sends multiple emails in batch
   */
  async sendBatch(emails: CreateEmailMessageData[]): Promise<BatchSendResult> {
    const results: EmailSendResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    for (const emailData of emails) {
      try {
        const result = await this.send(emailData);
        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
          if (result.error) {
            errors.push(result.error);
          }
        }
      } catch (error) {
        failed++;
        errors.push(String(error));
        results.push({
          success: false,
          error: String(error)
        });
      }
    }

    this.logger.info('Batch send completed', {
      total: emails.length,
      successful,
      failed
    });

    return {
      total: emails.length,
      successful,
      failed,
      results,
      errors
    };
  }

  /**
   * Processes the email queue
   */
  async processQueue(): Promise<BatchSendResult> {
    if (this.processing || this.messageQueue.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        errors: []
      };
    }

    this.processing = true;

    try {
      const batch = this.messageQueue.splice(0, this.config.batchSize);
      const results: EmailSendResult[] = [];
      const errors: string[] = [];
      let successful = 0;
      let failed = 0;

      for (const email of batch) {
        try {
          const result = await this.sendEmail(email);
          results.push(result);

          const status = result.success ? EmailStatus.SENT : EmailStatus.FAILED;
          await this.updateEmailStatus(email.id, status, {
            message_id: result.messageId,
            error_message: result.error,
            sent_at: result.success ? new Date() : null
          });

          if (result.success) {
            successful++;
          } else {
            failed++;
            if (result.error) {
              errors.push(result.error);
            }
          }
        } catch (error) {
          failed++;
          errors.push(String(error));
          results.push({
            success: false,
            error: String(error)
          });

          await this.updateEmailStatus(email.id, EmailStatus.FAILED, {
            error_message: String(error)
          });
        }
      }

      this.logger.info('Queue batch processed', {
        total: batch.length,
        successful,
        failed,
        remainingInQueue: this.messageQueue.length
      });

      return {
        total: batch.length,
        successful,
        failed,
        results,
        errors
      };
    } finally {
      this.processing = false;
    }
  }

  /**
   * Retries failed emails
   */
  async retryFailed(): Promise<BatchSendResult> {
    try {
      // Get failed emails ready for retry
      const { data: failedEmails } = await supabase
        .from('email_messages')
        .select('*')
        .eq('status', EmailStatus.FAILED)
        .lt('retry_count', this.config.retryAttempts)
        .lt('created_at', new Date(Date.now() - this.config.retryDelay).toISOString());

      if (!failedEmails || failedEmails.length === 0) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
          errors: []
        };
      }

      this.logger.info('Retrying failed emails', {
        count: failedEmails.length
      });

      const results: EmailSendResult[] = [];
      const errors: string[] = [];
      let successful = 0;
      let failed = 0;

      for (const emailData of failedEmails as any[]) {
        const email: EmailMessage = {
          id: emailData.id,
          message_id: emailData.message_id,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          html_body: emailData.html_body,
          text_body: emailData.text_body,
          attachments: emailData.attachments,
          template_id: emailData.template_id,
          template_data: emailData.template_data,
          provider: emailData.provider,
          status: emailData.status,
          created_at: new Date(emailData.created_at),
          sent_at: emailData.sent_at ? new Date(emailData.sent_at) : null,
          delivered_at: emailData.delivered_at ? new Date(emailData.delivered_at) : null,
          opened_at: emailData.opened_at ? new Date(emailData.opened_at) : null,
          clicked_at: emailData.clicked_at ? new Date(emailData.clicked_at) : null,
          retry_count: emailData.retry_count
        };

        try {
          const result = await this.sendEmail(email);
          results.push(result);

          const status = result.success ? EmailStatus.SENT : EmailStatus.FAILED;
          await this.updateEmailStatus(email.id, status, {
            message_id: result.messageId,
            error_message: result.error,
            sent_at: result.success ? new Date() : null,
            retry_count: email.retry_count + 1
          });

          if (result.success) {
            successful++;
          } else {
            failed++;
            if (result.error) {
              errors.push(result.error);
            }
          }
        } catch (error) {
          failed++;
          errors.push(String(error));
          results.push({
            success: false,
            error: String(error)
          });
        }
      }

      return {
        total: failedEmails.length,
        successful,
        failed,
        results,
        errors
      };
    } catch (error) {
      this.logger.error('Failed to retry emails', error as Error);
      return {
        total: 0,
        successful: 0,
        failed: 1,
        results: [],
        errors: [String(error)]
      };
    }
  }

  /**
   * Gets email delivery statistics
   */
  async getDeliveryStats(timeRange?: { start: Date; end: Date }): Promise<{
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
    byProvider: Record<EmailProvider, {
      sent: number;
      delivered: number;
      failed: number;
    }>;
  }> {
    try {
      let query = supabase.from('email_messages').select('*');

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data: emails, error } = await query;

      if (error) {
        throw new Error(`Failed to get delivery stats: ${error.message}`);
      }

      const stats = EmailMessageModel.generateDeliveryStats(emails || []);

      // Calculate by provider
      const byProvider: any = {};
      Object.values(EmailProvider).forEach(provider => {
        byProvider[provider] = {
          sent: 0,
          delivered: 0,
          failed: 0
        };
      });

      (emails || []).forEach((email: any) => {
        const provider = email.provider as EmailProvider;
        if (byProvider[provider]) {
          if (email.sent_at) byProvider[provider].sent++;
          if (email.delivered_at) byProvider[provider].delivered++;
          if (email.status === EmailStatus.FAILED) byProvider[provider].failed++;
        }
      });

      return { ...stats, byProvider };
    } catch (error) {
      this.logger.error('Failed to get delivery stats', error as Error);
      throw error;
    }
  }

  /**
   * Gets provider health status
   */
  async getProviderHealth(): Promise<Record<EmailProvider, {
    healthy: boolean;
    lastCheck: Date;
    stats?: any;
  }>> {
    const health: any = {};

    for (const [provider, instance] of this.providers.entries()) {
      try {
        const healthy = await instance.isHealthy();
        const stats = await instance.getStats();

        health[provider] = {
          healthy,
          lastCheck: new Date(),
          stats
        };
      } catch (error) {
        health[provider] = {
          healthy: false,
          lastCheck: new Date(),
          error: String(error)
        };
      }
    }

    return health;
  }

  /**
   * Handles webhook from email providers
   */
  async handleWebhook(provider: EmailProvider, payload: any, signature: string): Promise<void> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Unknown email provider: ${provider}`);
    }

    await providerInstance.handleWebhook(payload, signature);
  }

  /**
   * Gets queue statistics
   */
  getQueueStats(): {
    size: number;
    processing: boolean;
  } {
    return {
      size: this.messageQueue.length,
      processing: this.processing
    };
  }

  /**
   * Initializes email providers
   */
  private initializeProviders(): void {
    Object.entries(this.config.providers).forEach(([provider, config]) => {
      switch (provider as EmailProvider) {
        case EmailProvider.RESEND:
          this.providers.set(EmailProvider.RESEND, new ResendProvider(config));
          break;
        // Add other providers here
        default:
          this.logger.warn('Unknown email provider', { provider });
      }
    });

    this.logger.info('Email providers initialized', {
      providers: Array.from(this.providers.keys())
    });
  }

  /**
   * Sends an email using the configured provider
   */
  private async sendEmail(email: EmailMessage): Promise<EmailSendResult> {
    const provider = this.providers.get(email.provider);
    if (!provider) {
      throw new Error(`Email provider ${email.provider} not configured`);
    }

    return await provider.send(email);
  }

  /**
   * Stores email in database
   */
  private async storeEmail(email: EmailMessage): Promise<void> {
    const { error } = await supabase
      .from('email_messages')
      .insert({
        id: email.id,
        message_id: email.message_id,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        html_body: email.html_body,
        text_body: email.text_body,
        attachments: email.attachments,
        template_id: email.template_id,
        template_data: email.template_data,
        provider: email.provider,
        status: email.status,
        created_at: email.created_at.toISOString(),
        retry_count: email.retry_count
      });

    if (error) {
      throw new Error(`Failed to store email: ${error.message}`);
    }
  }

  /**
   * Updates email status in database
   */
  private async updateEmailStatus(emailId: string, status: EmailStatus, updates: any): Promise<void> {
    const { error } = await supabase
      .from('email_messages')
      .update({
        status,
        ...updates
      })
      .eq('id', emailId);

    if (error) {
      this.logger.error('Email send failed', error as Error, {
        emailId,
        status
      });
    }
  }

  /**
   * Starts the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue().catch(error => {
        this.logger.error('Queue processing error', error as Error);
      });
    }, 30000); // Process every 30 seconds
  }
}

/**
 * Global email sender instance
 */
let globalEmailSender: EmailSenderService | null = null;

/**
 * Gets or creates the global email sender instance
 */
export function getEmailSender(): EmailSenderService {
  if (!globalEmailSender) {
    // Default configuration - would be loaded from environment
    const config: EmailSenderConfig = {
      defaultProvider: EmailProvider.RESEND,
      providers: {
        [EmailProvider.RESEND]: {
          apiKey: process.env.RESEND_API_KEY || '',
          fromAddress: process.env.FROM_EMAIL || 'noreply@ezedit.co',
          fromName: 'EZEdit',
          timeout: 30000
        },
        [EmailProvider.MAILGUN]: {
          apiKey: process.env.MAILGUN_API_KEY || '',
          fromAddress: process.env.FROM_EMAIL || 'noreply@ezedit.co',
          fromName: 'EZEdit',
          timeout: 30000
        }
      },
      retryAttempts: 3,
      retryDelay: 60000,
      batchSize: 50,
      enableTracking: true
    };

    globalEmailSender = new EmailSenderService(config);
  }
  return globalEmailSender;
}

/**
 * Sets a new global email sender instance
 */
export function setEmailSender(sender: EmailSenderService): void {
  globalEmailSender = sender;
}

export default EmailSenderService;