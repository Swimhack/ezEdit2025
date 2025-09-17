/**
 * Push notification service using Web Push API
 * Supports browser push notifications with VAPID authentication and subscription management
 */

import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { BaseChannelProvider, ChannelSendResult, ChannelConfig } from './index';
import { NotificationChannel } from '../models/Notification';
import { getLogger } from '../../logging/logger';

/**
 * Web Push configuration
 */
export interface WebPushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string; // mailto: or https: URL
  ttl: number; // Time to live in seconds
  urgency: 'very-low' | 'low' | 'normal' | 'high';
  enableBatching: boolean;
  batchSize: number;
  maxRetries: number;
}

/**
 * Push subscription interface
 */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  browser: string;
  device: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  last_used?: Date;
}

/**
 * Push notification payload
 */
export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

/**
 * Push delivery result
 */
export interface PushDeliveryResult {
  subscriptionId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  retry?: boolean;
  endpoint: string;
}

/**
 * Push analytics data
 */
export interface PushAnalytics {
  totalSent: number;
  delivered: number;
  failed: number;
  clicked: number;
  dismissed: number;
  deliveryRate: number;
  clickRate: number;
  byBrowser: Record<string, {
    sent: number;
    delivered: number;
    clicked: number;
  }>;
  byDevice: Record<string, {
    sent: number;
    delivered: number;
    clicked: number;
  }>;
}

/**
 * VAPID JWT payload
 */
interface VapidJWT {
  aud: string;
  exp: number;
  sub: string;
}

/**
 * Default push configuration
 */
const DefaultPushConfig: Partial<ChannelConfig> = {
  enabled: true,
  rateLimit: {
    requests: 1000, // High limit for push notifications
    window: 60 * 1000 // 1 minute
  },
  retryPolicy: {
    maxAttempts: 3,
    baseDelay: 2000, // 2 seconds
    exponentialBackoff: true
  },
  healthCheck: {
    interval: 10 * 60 * 1000, // 10 minutes
    timeout: 5 * 1000 // 5 seconds
  }
};

/**
 * Push notification channel provider
 */
export class PushChannelProvider extends BaseChannelProvider {
  private pushConfig: WebPushConfig;
  private subscriptions = new Map<string, PushSubscription>();
  private deliveryStats = new Map<string, PushDeliveryResult>();

  constructor(
    pushConfig: WebPushConfig,
    channelConfig: Partial<ChannelConfig> = {}
  ) {
    super(NotificationChannel.PUSH, { ...DefaultPushConfig, ...channelConfig });
    this.pushConfig = pushConfig;
    this.loadSubscriptions();
  }

  /**
   * Sends push notification
   */
  async sendNotification(
    notification: Notification,
    preferences: NotificationPreference
  ): Promise<ChannelSendResult> {
    try {
      // Get user's push subscriptions
      const userSubscriptions = await this.getUserSubscriptions(notification.user_id);
      if (userSubscriptions.length === 0) {
        throw new Error('No active push subscriptions found for user');
      }

      // Prepare push payload
      const payload = this.preparePushPayload(notification);

      // Send to all user subscriptions
      const deliveryResults = await this.sendToSubscriptions(userSubscriptions, payload);

      // Process results
      const successful = deliveryResults.filter(result => result.success);
      const failed = deliveryResults.filter(result => !result.success);

      // Clean up invalid subscriptions
      await this.cleanupInvalidSubscriptions(failed);

      const overallSuccess = successful.length > 0;

      this.logger.info('Push notification sent', {
        notificationId: notification.id,
        subscriptions: userSubscriptions.length,
        successful: successful.length,
        failed: failed.length
      });

      return {
        success: overallSuccess,
        messageId: notification.id,
        metadata: {
          provider: 'web-push',
          subscriptions: userSubscriptions.length,
          delivered: successful.length,
          failed: failed.length,
          results: deliveryResults
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
   * Checks if push channel supports the notification type
   */
  supportsNotificationType(notificationType: string): boolean {
    // Push notifications support most notification types
    const unsupportedTypes = [
      'password_reset', // Too sensitive for push
      'email_verification' // Needs to be in email
    ];

    return !unsupportedTypes.includes(notificationType);
  }

  /**
   * Performs health check
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      // Check if we have active subscriptions
      const activeSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.active);

      if (activeSubscriptions.length === 0) {
        this.logger.warn('No active push subscriptions for health check');
        return true; // Not necessarily unhealthy, just no users
      }

      // Test with a sample subscription (if available)
      const testSubscription = activeSubscriptions[0];
      const testPayload: PushPayload = {
        title: 'Health Check',
        body: 'Testing push notification service',
        tag: 'health-check',
        silent: true
      };

      try {
        await this.sendToSubscription(testSubscription, testPayload, true);
        return true;
      } catch (error) {
        this.logger.warn('Push health check failed with test subscription', error as Error);
        return false;
      }
    } catch (error) {
      this.logger.error('Push health check failed', error as Error);
      return false;
    }
  }

  /**
   * Subscribes a user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    metadata: {
      browser: string;
      device: string;
    }
  ): Promise<PushSubscription> {
    try {
      // Validate subscription
      if (!subscription.endpoint || !subscription.keys.p256dh || !subscription.keys.auth) {
        throw new Error('Invalid push subscription data');
      }

      const pushSubscription: PushSubscription = {
        id: this.generateSubscriptionId(),
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        browser: metadata.browser,
        device: metadata.device,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Store subscription
      this.subscriptions.set(pushSubscription.id, pushSubscription);
      await this.storeSubscription(pushSubscription);

      this.logger.info('Push subscription created', {
        userId,
        subscriptionId: pushSubscription.id,
        browser: metadata.browser,
        device: metadata.device
      });

      return pushSubscription;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Unsubscribes from push notifications
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        return false;
      }

      // Mark as inactive
      subscription.active = false;
      subscription.updated_at = new Date();

      this.subscriptions.set(subscriptionId, subscription);
      await this.updateSubscription(subscription);

      this.logger.info('Push subscription deactivated', {
        subscriptionId,
        userId: subscription.user_id
      });

      return true;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { subscriptionId });
      return false;
    }
  }

  /**
   * Gets user's active subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.user_id === userId && sub.active
    );
  }

  /**
   * Gets push analytics
   */
  getAnalytics(timeRange?: { start: Date; end: Date }): PushAnalytics {
    const stats = Array.from(this.deliveryStats.values());

    const totalSent = stats.length;
    const delivered = stats.filter(stat => stat.success).length;
    const failed = stats.filter(stat => !stat.success).length;

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;

    // Would track clicks and dismissals from client-side events
    const clicked = 0;
    const dismissed = 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;

    return {
      totalSent,
      delivered,
      failed,
      clicked,
      dismissed,
      deliveryRate,
      clickRate,
      byBrowser: {},
      byDevice: {}
    };
  }

  /**
   * Handles push notification events (click, dismiss, etc.)
   */
  async handlePushEvent(
    subscriptionId: string,
    event: {
      type: 'click' | 'dismiss' | 'show';
      notificationId: string;
      timestamp: Date;
      action?: string;
    }
  ): Promise<void> {
    try {
      this.logger.info('Push notification event received', {
        subscriptionId,
        event: event.type,
        notificationId: event.notificationId,
        action: event.action
      });

      // Update subscription last used time
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.last_used = event.timestamp;
        subscription.updated_at = new Date();
        this.subscriptions.set(subscriptionId, subscription);
        await this.updateSubscription(subscription);
      }

      // Store event for analytics (would go to database)
      await this.recordPushEvent(subscriptionId, event);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        subscriptionId,
        event
      });
    }
  }

  /**
   * Prepares push notification payload
   */
  private preparePushPayload(notification: Notification): PushPayload {
    const payload: PushPayload = {
      title: notification.title,
      body: notification.message,
      icon: '/icon-192.png', // Default app icon
      badge: '/badge-72.png', // Default badge
      tag: notification.id,
      timestamp: notification.created_at.getTime(),
      requireInteraction: notification.priority === 'CRITICAL',
      data: {
        notificationId: notification.id,
        type: notification.type,
        userId: notification.user_id,
        ...notification.data
      }
    };

    // Add action URL if available
    if (notification.data && notification.data.action_url) {
      payload.url = notification.data.action_url;
      payload.actions = [
        {
          action: 'view',
          title: 'View',
          icon: '/action-view.png'
        }
      ];
    }

    // Add image if available
    if (notification.data && notification.data.image_url) {
      payload.image = notification.data.image_url;
    }

    return payload;
  }

  /**
   * Sends push notification to multiple subscriptions
   */
  private async sendToSubscriptions(
    subscriptions: PushSubscription[],
    payload: PushPayload
  ): Promise<PushDeliveryResult[]> {
    const results: PushDeliveryResult[] = [];

    if (this.pushConfig.enableBatching) {
      // Send in batches
      for (let i = 0; i < subscriptions.length; i += this.pushConfig.batchSize) {
        const batch = subscriptions.slice(i, i + this.pushConfig.batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(sub => this.sendToSubscription(sub, payload))
        );

        batchResults.forEach((result, index) => {
          const subscription = batch[index];
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              subscriptionId: subscription.id,
              success: false,
              error: String(result.reason),
              endpoint: subscription.endpoint
            });
          }
        });

        // Small delay between batches
        if (i + this.pushConfig.batchSize < subscriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } else {
      // Send all at once
      const allResults = await Promise.allSettled(
        subscriptions.map(sub => this.sendToSubscription(sub, payload))
      );

      allResults.forEach((result, index) => {
        const subscription = subscriptions[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            subscriptionId: subscription.id,
            success: false,
            error: String(result.reason),
            endpoint: subscription.endpoint
          });
        }
      });
    }

    return results;
  }

  /**
   * Sends push notification to a single subscription
   */
  private async sendToSubscription(
    subscription: PushSubscription,
    payload: PushPayload,
    isHealthCheck = false
  ): Promise<PushDeliveryResult> {
    try {
      const vapidHeaders = await this.generateVapidHeaders(subscription.endpoint);
      const body = JSON.stringify(payload);

      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body).toString(),
          'TTL': this.pushConfig.ttl.toString(),
          'Urgency': this.pushConfig.urgency,
          ...vapidHeaders
        },
        body
      });

      const result: PushDeliveryResult = {
        subscriptionId: subscription.id,
        success: response.ok,
        statusCode: response.status,
        endpoint: subscription.endpoint
      };

      if (!response.ok) {
        const errorText = await response.text();
        result.error = `HTTP ${response.status}: ${errorText}`;
        result.retry = response.status >= 500; // Retry on server errors
      }

      // Store result for analytics (skip for health checks)
      if (!isHealthCheck) {
        this.deliveryStats.set(`${subscription.id}_${Date.now()}`, result);
      }

      return result;
    } catch (error) {
      const result: PushDeliveryResult = {
        subscriptionId: subscription.id,
        success: false,
        error: String(error),
        endpoint: subscription.endpoint,
        retry: true
      };

      if (!isHealthCheck) {
        this.deliveryStats.set(`${subscription.id}_${Date.now()}`, result);
      }

      return result;
    }
  }

  /**
   * Generates VAPID headers for authentication
   */
  private async generateVapidHeaders(endpoint: string): Promise<Record<string, string>> {
    try {
      // Extract audience from endpoint
      const url = new URL(endpoint);
      const audience = `${url.protocol}//${url.hostname}`;

      // Create JWT payload
      const payload: VapidJWT = {
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
        sub: this.pushConfig.vapidSubject
      };

      // Generate JWT (simplified - use proper JWT library in production)
      const jwt = await this.generateJWT(payload);

      return {
        'Authorization': `vapid t=${jwt}, k=${this.pushConfig.vapidPublicKey}`
      };
    } catch (error) {
      throw new Error(`Failed to generate VAPID headers: ${error}`);
    }
  }

  /**
   * Generates JWT token (simplified implementation)
   */
  private async generateJWT(payload: VapidJWT): Promise<string> {
    // In production, use proper JWT library with ECDSA P-256
    const header = { alg: 'ES256', typ: 'JWT' };
    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(payload));

    // Simplified signature (use proper crypto in production)
    const signature = this.base64urlEncode('signature');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Base64URL encoding
   */
  private base64urlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Cleans up invalid subscriptions
   */
  private async cleanupInvalidSubscriptions(failedResults: PushDeliveryResult[]): Promise<void> {
    for (const result of failedResults) {
      // Mark subscription as inactive for permanent failures
      if (result.statusCode === 410 || result.statusCode === 404) {
        await this.unsubscribe(result.subscriptionId);
      }
    }
  }

  /**
   * Generates unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Loads subscriptions from storage
   */
  private async loadSubscriptions(): Promise<void> {
    try {
      // Would load from database in real implementation
      this.logger.debug('Push subscriptions loaded from storage');
    } catch (error) {
      this.logger.error('Failed to load push subscriptions', error as Error);
    }
  }

  /**
   * Stores subscription in database
   */
  private async storeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      // Would store in database
      this.logger.debug('Push subscription stored', {
        subscriptionId: subscription.id
      });
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * Updates subscription in database
   */
  private async updateSubscription(subscription: PushSubscription): Promise<void> {
    try {
      // Would update in database
      this.logger.debug('Push subscription updated', {
        subscriptionId: subscription.id
      });
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * Records push event for analytics
   */
  private async recordPushEvent(
    subscriptionId: string,
    event: any
  ): Promise<void> {
    try {
      // Would store in database
      this.logger.debug('Push event recorded', {
        subscriptionId,
        eventType: event.type
      });
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        subscriptionId,
        eventType: event.type
      });
    }
  }

  /**
   * Gets push configuration
   */
  getPushConfig(): WebPushConfig {
    return { ...this.pushConfig };
  }

  /**
   * Updates push configuration
   */
  updatePushConfig(newConfig: Partial<WebPushConfig>): void {
    this.pushConfig = { ...this.pushConfig, ...newConfig };
    this.logger.info('Push configuration updated');
  }
}

/**
 * Creates push channel provider with default configuration
 */
export function createPushChannel(config?: {
  push: Partial<WebPushConfig>;
  channel?: Partial<ChannelConfig>;
}): PushChannelProvider {
  const defaultPushConfig: WebPushConfig = {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:support@ezedit.co',
    ttl: 24 * 60 * 60, // 24 hours
    urgency: 'normal',
    enableBatching: true,
    batchSize: 100,
    maxRetries: 3
  };

  const pushConfig = { ...defaultPushConfig, ...config?.push };
  return new PushChannelProvider(pushConfig, config?.channel);
}

export default PushChannelProvider;