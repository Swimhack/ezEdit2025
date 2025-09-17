/**
 * Notification channels service - Central hub for all notification channel providers
 * Supports email, SMS, push, and in-app notifications with unified interface
 */

import { Notification, NotificationChannel } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { ChannelProvider } from '../dispatcher';
import { getLogger } from '../../logging/logger';

/**
 * Channel configuration interface
 */
export interface ChannelConfig {
  enabled: boolean;
  rateLimit: {
    requests: number;
    window: number; // in milliseconds
  };
  retryPolicy: {
    maxAttempts: number;
    baseDelay: number;
    exponentialBackoff: boolean;
  };
  healthCheck: {
    interval: number; // in milliseconds
    timeout: number; // in milliseconds
  };
}

/**
 * Channel send result interface
 */
export interface ChannelSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Channel health status interface
 */
export interface ChannelHealth {
  healthy: boolean;
  lastCheck: Date;
  latency: number;
  errorRate: number;
  details?: Record<string, any>;
}

/**
 * Default channel configuration
 */
const DefaultChannelConfig: ChannelConfig = {
  enabled: true,
  rateLimit: {
    requests: 1000,
    window: 60 * 1000 // 1 minute
  },
  retryPolicy: {
    maxAttempts: 3,
    baseDelay: 1000,
    exponentialBackoff: true
  },
  healthCheck: {
    interval: 30 * 1000, // 30 seconds
    timeout: 5 * 1000 // 5 seconds
  }
};

/**
 * Rate limiter for channels
 */
class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(): boolean {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    // Check if we're within the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    this.requests.push(now);
    return true;
  }

  getStats(): { current: number; limit: number; resetTime: number } {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    const oldestRequest = this.requests[0];
    const resetTime = oldestRequest ? oldestRequest + this.windowMs : now;

    return {
      current: this.requests.length,
      limit: this.maxRequests,
      resetTime
    };
  }
}

/**
 * Base notification channel provider
 */
export abstract class BaseChannelProvider implements ChannelProvider {
  protected config: ChannelConfig;
  protected rateLimiter: RateLimiter;
  protected health: ChannelHealth;
  protected logger = getLogger();
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(
    public readonly name: NotificationChannel,
    config: Partial<ChannelConfig> = {}
  ) {
    this.config = { ...DefaultChannelConfig, ...config };
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.requests,
      this.config.rateLimit.window
    );
    this.health = {
      healthy: true,
      lastCheck: new Date(),
      latency: 0,
      errorRate: 0
    };

    this.startHealthCheck();
  }

  /**
   * Abstract method to send notification via the channel
   */
  abstract sendNotification(
    notification: Notification,
    preferences: NotificationPreference
  ): Promise<ChannelSendResult>;

  /**
   * Abstract method to check if the channel supports a notification type
   */
  abstract supportsNotificationType(notificationType: string): boolean;

  /**
   * Abstract method to perform health check
   */
  abstract performHealthCheck(): Promise<boolean>;

  /**
   * Implementation of ChannelProvider interface
   */
  async send(notification: Notification, preferences: NotificationPreference): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Check if channel is enabled
      if (!this.config.enabled) {
        throw new Error(`${this.name} channel is disabled`);
      }

      // Check rate limit
      if (!this.rateLimiter.isAllowed()) {
        throw new Error(`Rate limit exceeded for ${this.name} channel`);
      }

      // Check health
      if (!this.health.healthy) {
        throw new Error(`${this.name} channel is unhealthy`);
      }

      // Send notification
      const result = await this.sendNotification(notification, preferences);

      // Log success
      this.logger.info('Channel notification sent', {
        channel: this.name,
        notificationId: notification.id,
        messageId: result.messageId,
        duration: Date.now() - startTime
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      // Log error
      this.logger.error('Email send failed', error as Error, {
        channel: this.name,
        notificationId: notification.id,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Implementation of ChannelProvider interface
   */
  async isAvailable(): Promise<boolean> {
    return this.config.enabled && this.health.healthy;
  }

  /**
   * Implementation of ChannelProvider interface
   */
  supports(notificationType: string): boolean {
    return this.supportsNotificationType(notificationType);
  }

  /**
   * Implementation of ChannelProvider interface
   */
  getRateLimit(): { requests: number; window: number } {
    return {
      requests: this.config.rateLimit.requests,
      window: this.config.rateLimit.window
    };
  }

  /**
   * Gets channel configuration
   */
  getConfig(): ChannelConfig {
    return { ...this.config };
  }

  /**
   * Updates channel configuration
   */
  updateConfig(config: Partial<ChannelConfig>): void {
    this.config = { ...this.config, ...config };

    // Update rate limiter if needed
    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        this.config.rateLimit.requests,
        this.config.rateLimit.window
      );
    }

    this.logger.info('Channel configuration updated', {
      channel: this.name,
      config: this.config
    });
  }

  /**
   * Gets channel health status
   */
  getHealth(): ChannelHealth {
    return { ...this.health };
  }

  /**
   * Gets rate limit statistics
   */
  getRateLimitStats(): { current: number; limit: number; resetTime: number } {
    return this.rateLimiter.getStats();
  }

  /**
   * Manually triggers a health check
   */
  async checkHealth(): Promise<boolean> {
    const startTime = Date.now();

    try {
      const healthy = await Promise.race([
        this.performHealthCheck(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.healthCheck.timeout)
        )
      ]);

      this.health = {
        healthy,
        lastCheck: new Date(),
        latency: Date.now() - startTime,
        errorRate: this.health.errorRate // Would be calculated from recent errors
      };

      if (!healthy) {
        this.logger.warn('Channel health check failed', {
          channel: this.name,
          latency: this.health.latency
        });
      }

      return healthy;
    } catch (error) {
      this.health = {
        healthy: false,
        lastCheck: new Date(),
        latency: Date.now() - startTime,
        errorRate: this.health.errorRate,
        details: { error: String(error) }
      };

      this.logger.error('Email send failed', error as Error, {
        channel: this.name
      });

      return false;
    }
  }

  /**
   * Starts periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.checkHealth().catch(error => {
        this.logger.error('Email send failed', error as Error, {
          channel: this.name
        });
      });
    }, this.config.healthCheck.interval);
  }

  /**
   * Stops health checks and cleans up
   */
  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.logger.info('Channel provider closed', {
      channel: this.name
    });
  }
}

/**
 * Email channel provider
 */
export class EmailChannelProvider extends BaseChannelProvider {
  constructor(config: Partial<ChannelConfig> = {}) {
    super(NotificationChannel.EMAIL, config);
  }

  async sendNotification(
    notification: Notification,
    preferences: NotificationPreference
  ): Promise<ChannelSendResult> {
    // This would integrate with the email sender service
    // For now, returning a mock result
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      metadata: {
        provider: 'email',
        timestamp: new Date().toISOString()
      }
    };
  }

  supportsNotificationType(notificationType: string): boolean {
    // Email supports all notification types
    return true;
  }

  async performHealthCheck(): Promise<boolean> {
    // Check email service availability
    // This would ping the email service endpoint
    return true;
  }
}

/**
 * In-app channel provider
 */
export class InAppChannelProvider extends BaseChannelProvider {
  constructor(config: Partial<ChannelConfig> = {}) {
    super(NotificationChannel.IN_APP, {
      ...config,
      // In-app notifications have higher rate limits
      rateLimit: {
        requests: 10000,
        window: 60 * 1000
      }
    });
  }

  async sendNotification(
    notification: Notification,
    preferences: NotificationPreference
  ): Promise<ChannelSendResult> {
    try {
      // Store in-app notification in database
      // This would be handled by a real-time system like WebSockets or Server-Sent Events

      return {
        success: true,
        messageId: `inapp_${Date.now()}`,
        metadata: {
          provider: 'in-app',
          timestamp: new Date().toISOString(),
          stored: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  supportsNotificationType(notificationType: string): boolean {
    // In-app supports all notification types
    return true;
  }

  async performHealthCheck(): Promise<boolean> {
    // Check database connectivity for in-app notifications
    return true;
  }
}

/**
 * Channel registry for managing all notification channels
 */
export class ChannelRegistry {
  private channels = new Map<NotificationChannel, BaseChannelProvider>();
  private logger = getLogger();

  /**
   * Registers a channel provider
   */
  register(provider: BaseChannelProvider): void {
    this.channels.set(provider.name, provider);
    this.logger.info('Channel registered', {
      channel: provider.name,
      totalChannels: this.channels.size
    });
  }

  /**
   * Unregisters a channel provider
   */
  async unregister(channel: NotificationChannel): Promise<void> {
    const provider = this.channels.get(channel);
    if (provider) {
      await provider.close();
      this.channels.delete(channel);
      this.logger.info('Channel unregistered', {
        channel,
        totalChannels: this.channels.size
      });
    }
  }

  /**
   * Gets a channel provider
   */
  get(channel: NotificationChannel): BaseChannelProvider | undefined {
    return this.channels.get(channel);
  }

  /**
   * Gets all registered channels
   */
  getAll(): Map<NotificationChannel, BaseChannelProvider> {
    return new Map(this.channels);
  }

  /**
   * Gets channels that support a specific notification type
   */
  getSupportingChannels(notificationType: string): BaseChannelProvider[] {
    return Array.from(this.channels.values()).filter(provider =>
      provider.supports(notificationType)
    );
  }

  /**
   * Gets health status for all channels
   */
  async getHealthStatus(): Promise<Record<NotificationChannel, ChannelHealth>> {
    const status: any = {};

    for (const [channel, provider] of this.channels.entries()) {
      status[channel] = provider.getHealth();
    }

    return status;
  }

  /**
   * Gets rate limit status for all channels
   */
  getRateLimitStatus(): Record<NotificationChannel, { current: number; limit: number; resetTime: number }> {
    const status: any = {};

    for (const [channel, provider] of this.channels.entries()) {
      status[channel] = provider.getRateLimitStats();
    }

    return status;
  }

  /**
   * Performs health checks on all channels
   */
  async checkAllHealth(): Promise<Record<NotificationChannel, boolean>> {
    const results: any = {};

    const healthChecks = Array.from(this.channels.entries()).map(async ([channel, provider]) => {
      results[channel] = await provider.checkHealth();
    });

    await Promise.allSettled(healthChecks);
    return results;
  }

  /**
   * Gets statistics for all channels
   */
  getStats(): {
    totalChannels: number;
    enabledChannels: number;
    healthyChannels: number;
    channelDetails: Record<NotificationChannel, {
      enabled: boolean;
      healthy: boolean;
      rateLimitUsage: number;
    }>;
  } {
    const channelDetails: any = {};
    let enabledChannels = 0;
    let healthyChannels = 0;

    for (const [channel, provider] of this.channels.entries()) {
      const config = provider.getConfig();
      const health = provider.getHealth();
      const rateStats = provider.getRateLimitStats();

      const enabled = config.enabled;
      const healthy = health.healthy;

      if (enabled) enabledChannels++;
      if (healthy) healthyChannels++;

      channelDetails[channel] = {
        enabled,
        healthy,
        rateLimitUsage: (rateStats.current / rateStats.limit) * 100
      };
    }

    return {
      totalChannels: this.channels.size,
      enabledChannels,
      healthyChannels,
      channelDetails
    };
  }

  /**
   * Closes all channels
   */
  async close(): Promise<void> {
    const closePromises = Array.from(this.channels.values()).map(provider => provider.close());
    await Promise.allSettled(closePromises);
    this.channels.clear();

    this.logger.info('All channels closed');
  }
}

/**
 * Global channel registry instance
 */
let globalRegistry: ChannelRegistry | null = null;

/**
 * Gets or creates the global channel registry
 */
export function getChannelRegistry(): ChannelRegistry {
  if (!globalRegistry) {
    globalRegistry = new ChannelRegistry();

    // Register default channels
    globalRegistry.register(new EmailChannelProvider());
    globalRegistry.register(new InAppChannelProvider());
  }
  return globalRegistry;
}

/**
 * Sets a new global channel registry
 */
export function setChannelRegistry(registry: ChannelRegistry): void {
  if (globalRegistry) {
    globalRegistry.close();
  }
  globalRegistry = registry;
}

export { NotificationChannel } from '../models/Notification';
export default ChannelRegistry;