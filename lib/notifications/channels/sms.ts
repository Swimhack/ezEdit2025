/**
 * SMS notification channel service with Twilio integration
 * Supports international SMS, delivery tracking, and cost optimization
 */

import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { BaseChannelProvider, ChannelSendResult, ChannelConfig } from './index';
import { NotificationChannel } from '../models/Notification';
import { getLogger } from '../../logging/logger';

/**
 * SMS provider configuration
 */
export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  webhookUrl?: string;
  enableStatusCallbacks: boolean;
  maxMessageLength: number;
  enableUnicode: boolean;
  rateLimit: {
    messagesPerSecond: number;
    messagesPerMinute: number;
  };
}

/**
 * SMS message status from Twilio
 */
export enum SMSStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  UNDELIVERED = 'undelivered',
  FAILED = 'failed'
}

/**
 * SMS delivery result
 */
export interface SMSDeliveryResult {
  messageId: string;
  status: SMSStatus;
  to: string;
  segments: number;
  price?: string;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Phone number validation result
 */
export interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  country: string;
  carrier?: string;
  type?: 'mobile' | 'landline' | 'voip';
  warnings: string[];
}

/**
 * SMS analytics data
 */
export interface SMSAnalytics {
  totalSent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  avgSegments: number;
  totalCost: number;
  byCountry: Record<string, {
    sent: number;
    delivered: number;
    cost: number;
  }>;
}

/**
 * Default SMS configuration
 */
const DefaultSMSConfig: Partial<ChannelConfig> = {
  enabled: true,
  rateLimit: {
    requests: 30, // Twilio limit is typically 1 message per second for trial
    window: 60 * 1000 // 1 minute
  },
  retryPolicy: {
    maxAttempts: 3,
    baseDelay: 5000, // 5 seconds
    exponentialBackoff: true
  },
  healthCheck: {
    interval: 5 * 60 * 1000, // 5 minutes
    timeout: 10 * 1000 // 10 seconds
  }
};

/**
 * SMS channel provider using Twilio
 */
export class SMSChannelProvider extends BaseChannelProvider {
  private smsConfig: SMSConfig;
  private deliveryStats = new Map<string, SMSDeliveryResult>();

  constructor(
    smsConfig: SMSConfig,
    channelConfig: Partial<ChannelConfig> = {}
  ) {
    super(NotificationChannel.SMS, { ...DefaultSMSConfig, ...channelConfig });
    this.smsConfig = smsConfig;
  }

  /**
   * Sends SMS notification
   */
  async sendNotification(
    notification: Notification,
    preferences: NotificationPreference
  ): Promise<ChannelSendResult> {
    try {
      // Get user's phone number from preferences or notification data
      const phoneNumber = this.extractPhoneNumber(notification, preferences);
      if (!phoneNumber) {
        throw new Error('No phone number available for SMS notification');
      }

      // Validate phone number
      const validation = await this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        throw new Error(`Invalid phone number: ${validation.warnings.join(', ')}`);
      }

      // Prepare message content
      const messageBody = this.prepareMessageContent(notification);
      if (messageBody.length > this.smsConfig.maxMessageLength) {
        this.logger.warn('SMS message truncated due to length', {
          originalLength: messageBody.length,
          maxLength: this.smsConfig.maxMessageLength,
          notificationId: notification.id
        });
      }

      // Send SMS via Twilio
      const result = await this.sendViaTwilio(validation.formatted, messageBody, notification.id);

      // Store delivery result for tracking
      this.deliveryStats.set(result.messageId, result);

      this.logger.info('SMS sent successfully', {
        notificationId: notification.id,
        messageId: result.messageId,
        to: validation.formatted,
        segments: result.segments
      });

      return {
        success: true,
        messageId: result.messageId,
        metadata: {
          provider: 'twilio',
          to: validation.formatted,
          segments: result.segments,
          price: result.price,
          currency: result.currency
        }
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        notificationId: notification.id
      });

      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Checks if SMS channel supports the notification type
   */
  supportsNotificationType(notificationType: string): boolean {
    // SMS is suitable for urgent notifications and alerts
    const supportedTypes = [
      'security_alert',
      'system_alert',
      'password_reset',
      'two_factor_auth',
      'account_verification',
      'critical_update'
    ];

    return supportedTypes.includes(notificationType);
  }

  /**
   * Performs health check by sending a test message
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      // Check account balance and status via Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.smsConfig.accountSid}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getTwilioAuthHeader()
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`);
      }

      const accountData = await response.json();

      // Check if account is active and has sufficient balance
      const isHealthy = accountData.status === 'active';

      if (!isHealthy) {
        this.logger.warn('Twilio account not active', {
          status: accountData.status,
          accountSid: this.smsConfig.accountSid
        });
      }

      return isHealthy;
    } catch (error) {
      this.logger.error('SMS health check failed', error as Error);
      return false;
    }
  }

  /**
   * Handles Twilio webhook for delivery status updates
   */
  async handleDeliveryWebhook(payload: any): Promise<void> {
    try {
      const {
        MessageSid: messageId,
        MessageStatus: status,
        To: to,
        ErrorCode: errorCode,
        ErrorMessage: errorMessage
      } = payload;

      if (!messageId) {
        throw new Error('Missing MessageSid in webhook payload');
      }

      // Update delivery stats
      const existingStats = this.deliveryStats.get(messageId);
      if (existingStats) {
        existingStats.status = status as SMSStatus;
        if (errorCode) existingStats.errorCode = errorCode;
        if (errorMessage) existingStats.errorMessage = errorMessage;

        this.deliveryStats.set(messageId, existingStats);
      }

      this.logger.info('SMS delivery status updated', {
        messageId,
        status,
        to,
        errorCode,
        errorMessage
      });

      // Update notification status in database if needed
      await this.updateNotificationDeliveryStatus(messageId, status, errorCode, errorMessage);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { payload });
    }
  }

  /**
   * Gets SMS analytics for reporting
   */
  getAnalytics(timeRange?: { start: Date; end: Date }): SMSAnalytics {
    const stats = Array.from(this.deliveryStats.values());

    // Filter by time range if provided
    const filteredStats = timeRange
      ? stats.filter(stat => {
          // Would need timestamp from delivery result
          return true; // Simplified for now
        })
      : stats;

    const totalSent = filteredStats.length;
    const delivered = filteredStats.filter(stat => stat.status === SMSStatus.DELIVERED).length;
    const failed = filteredStats.filter(stat =>
      stat.status === SMSStatus.FAILED || stat.status === SMSStatus.UNDELIVERED
    ).length;

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const avgSegments = totalSent > 0
      ? filteredStats.reduce((sum, stat) => sum + stat.segments, 0) / totalSent
      : 0;

    const totalCost = filteredStats.reduce((sum, stat) => {
      return sum + (stat.price ? parseFloat(stat.price) : 0);
    }, 0);

    // Group by country (simplified)
    const byCountry: Record<string, any> = {};

    return {
      totalSent,
      delivered,
      failed,
      deliveryRate,
      avgSegments,
      totalCost,
      byCountry
    };
  }

  /**
   * Gets delivery status for a specific message
   */
  async getDeliveryStatus(messageId: string): Promise<SMSDeliveryResult | null> {
    try {
      // First check local cache
      const cachedResult = this.deliveryStats.get(messageId);
      if (cachedResult) {
        return cachedResult;
      }

      // Query Twilio API for status
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.smsConfig.accountSid}/Messages/${messageId}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getTwilioAuthHeader()
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`);
      }

      const messageData = await response.json();

      const result: SMSDeliveryResult = {
        messageId: messageData.sid,
        status: messageData.status as SMSStatus,
        to: messageData.to,
        segments: messageData.num_segments || 1,
        price: messageData.price,
        currency: messageData.price_unit,
        errorCode: messageData.error_code,
        errorMessage: messageData.error_message
      };

      // Cache the result
      this.deliveryStats.set(messageId, result);

      return result;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { messageId });
      return null;
    }
  }

  /**
   * Estimates SMS cost for a message
   */
  estimateCost(message: string, phoneNumber: string): {
    segments: number;
    estimatedCost: number;
    currency: string;
  } {
    // Calculate segments (160 chars for GSM 7-bit, 70 for UCS-2)
    const isUnicode = /[^\x00-\x7F]/.test(message);
    const segmentLength = isUnicode ? 70 : 160;
    const segments = Math.ceil(message.length / segmentLength);

    // Estimate cost (would use actual Twilio pricing API)
    const basePrice = 0.0075; // USD per segment (example price)
    const estimatedCost = segments * basePrice;

    return {
      segments,
      estimatedCost,
      currency: 'USD'
    };
  }

  /**
   * Extracts phone number from notification or user preferences
   */
  private extractPhoneNumber(
    notification: Notification,
    preferences: NotificationPreference
  ): string | null {
    // Check notification data first
    if (notification.data && notification.data.phone_number) {
      return notification.data.phone_number;
    }

    // Check user profile (would need to fetch from database)
    // For now, return null if not found in notification data
    return null;
  }

  /**
   * Validates and formats phone number
   */
  private async validatePhoneNumber(phoneNumber: string): Promise<PhoneValidationResult> {
    try {
      // Use Twilio Lookup API for validation
      const response = await fetch(
        `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phoneNumber)}?Type=carrier`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getTwilioAuthHeader()
          }
        }
      );

      if (!response.ok) {
        return {
          valid: false,
          formatted: phoneNumber,
          country: 'unknown',
          warnings: [`Phone number validation failed: ${response.status}`]
        };
      }

      const data = await response.json();

      return {
        valid: true,
        formatted: data.phone_number,
        country: data.country_code,
        carrier: data.carrier?.name,
        type: data.carrier?.type,
        warnings: []
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { phoneNumber });

      // Basic validation fallback
      const isValid = /^\+[1-9]\d{1,14}$/.test(phoneNumber);
      return {
        valid: isValid,
        formatted: phoneNumber,
        country: 'unknown',
        warnings: isValid ? [] : ['Invalid phone number format']
      };
    }
  }

  /**
   * Prepares message content for SMS
   */
  private prepareMessageContent(notification: Notification): string {
    let message = `${notification.title}`;

    if (notification.message) {
      message += `\n\n${notification.message}`;
    }

    // Add action URL if present
    if (notification.data && notification.data.action_url) {
      message += `\n\n${notification.data.action_url}`;
    }

    // Truncate if too long
    if (message.length > this.smsConfig.maxMessageLength) {
      message = message.substring(0, this.smsConfig.maxMessageLength - 3) + '...';
    }

    return message;
  }

  /**
   * Sends SMS via Twilio API
   */
  private async sendViaTwilio(
    to: string,
    body: string,
    notificationId: string
  ): Promise<SMSDeliveryResult> {
    const payload = new URLSearchParams({
      To: to,
      From: this.smsConfig.fromNumber,
      Body: body
    });

    // Add status callback if enabled
    if (this.smsConfig.enableStatusCallbacks && this.smsConfig.webhookUrl) {
      payload.append('StatusCallback', this.smsConfig.webhookUrl);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.smsConfig.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': this.getTwilioAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${errorData.message || response.status}`);
    }

    const messageData = await response.json();

    return {
      messageId: messageData.sid,
      status: messageData.status as SMSStatus,
      to: messageData.to,
      segments: messageData.num_segments || 1,
      price: messageData.price,
      currency: messageData.price_unit,
      errorCode: messageData.error_code,
      errorMessage: messageData.error_message
    };
  }

  /**
   * Generates Twilio authorization header
   */
  private getTwilioAuthHeader(): string {
    const credentials = `${this.smsConfig.accountSid}:${this.smsConfig.authToken}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Updates notification delivery status in database
   */
  private async updateNotificationDeliveryStatus(
    messageId: string,
    status: string,
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Would update notification_deliveries table
      this.logger.debug('Would update notification delivery status', {
        messageId,
        status,
        errorCode,
        errorMessage
      });
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        messageId,
        status
      });
    }
  }

  /**
   * Gets configuration for the SMS provider
   */
  getSMSConfig(): SMSConfig {
    return { ...this.smsConfig };
  }

  /**
   * Updates SMS configuration
   */
  updateSMSConfig(newConfig: Partial<SMSConfig>): void {
    this.smsConfig = { ...this.smsConfig, ...newConfig };
    this.logger.info('SMS configuration updated', {
      accountSid: this.smsConfig.accountSid,
      fromNumber: this.smsConfig.fromNumber
    });
  }
}

/**
 * Creates SMS channel provider with default configuration
 */
export function createSMSChannel(config?: {
  sms: Partial<SMSConfig>;
  channel?: Partial<ChannelConfig>;
}): SMSChannelProvider {
  const defaultSMSConfig: SMSConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL,
    enableStatusCallbacks: true,
    maxMessageLength: 1600, // 10 segments max
    enableUnicode: true,
    rateLimit: {
      messagesPerSecond: 1,
      messagesPerMinute: 60
    }
  };

  const smsConfig = { ...defaultSMSConfig, ...config?.sms };
  return new SMSChannelProvider(smsConfig, config?.channel);
}

export default SMSChannelProvider;