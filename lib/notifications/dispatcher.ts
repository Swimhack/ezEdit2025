// @ts-nocheck
/**
 * Notification dispatcher service for multi-channel notification delivery
 * Supports queuing, batching, retry logic, and intelligent channel selection
 */

import {
  Notification,
  NotificationModel,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  CreateNotificationData
} from './models/Notification';
import { NotificationPreference, NotificationPreferenceModel } from './models/NotificationPreference';
import { supabase } from '../supabase';
import { getLogger } from '../logging/logger';

/**
 * Dispatch result interface
 */
export interface DispatchResult {
  notification: Notification;
  channels: {
    channel: NotificationChannel;
    success: boolean;
    messageId?: string;
    error?: string;
    retryAt?: Date;
  }[];
  overallSuccess: boolean;
  dispatchTime: number;
}

/**
 * Batch dispatch result interface
 */
export interface BatchDispatchResult {
  total: number;
  successful: number;
  failed: number;
  results: DispatchResult[];
  batchTime: number;
}

/**
 * Queue configuration interface
 */
export interface QueueConfig {
  maxSize: number;
  batchSize: number;
  flushInterval: number;
  priorityOrder: NotificationPriority[];
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Channel provider interface
 */
export interface ChannelProvider {
  name: NotificationChannel;
  isAvailable(): Promise<boolean>;
  send(notification: Notification, preferences: NotificationPreference): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
  supports(notificationType: string): boolean;
  getRateLimit(): { requests: number; window: number };
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit breaker for channel providers
 */
class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private successThreshold: number = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Default queue configuration
 */
const DefaultQueueConfig: QueueConfig = {
  maxSize: 10000,
  batchSize: 100,
  flushInterval: 5000,
  priorityOrder: [
    NotificationPriority.CRITICAL,
    NotificationPriority.HIGH,
    NotificationPriority.MEDIUM,
    NotificationPriority.LOW
  ],
  retryAttempts: 3,
  retryDelay: 30000 // 30 seconds
};

/**
 * Notification dispatcher service
 */
export class NotificationDispatcher {
  private messageQueue: Notification[] = [];
  private processing = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private channelProviders = new Map<NotificationChannel, ChannelProvider>();
  private circuitBreakers = new Map<NotificationChannel, CircuitBreaker>();
  private logger = getLogger();

  constructor(
    private config: QueueConfig = DefaultQueueConfig
  ) {
    this.startFlushTimer();
  }

  /**
   * Registers a channel provider
   */
  registerChannelProvider(provider: ChannelProvider): void {
    this.channelProviders.set(provider.name, provider);
    this.circuitBreakers.set(provider.name, new CircuitBreaker());
    this.logger.info('Channel provider registered', { channel: provider.name });
  }

  /**
   * Dispatches a single notification
   */
  async dispatch(notificationData: CreateNotificationData): Promise<DispatchResult> {
    const startTime = Date.now();

    try {
      // Create notification record
      const notification = NotificationModel.create(notificationData);

      // Get user preferences for the notification type
      const preferences = await this.getUserPreferences(
        notification.user_id,
        notification.type
      );

      // Check if notifications are enabled and not in quiet hours
      if (!this.shouldDispatch(notification, preferences)) {
        this.logger.info('Notification dispatch skipped', {
          notificationId: notification.id,
          reason: 'disabled or quiet hours'
        });

        return {
          notification,
          channels: [],
          overallSuccess: true,
          dispatchTime: Date.now() - startTime
        };
      }

      // Get enabled channels based on preferences
      const enabledChannels = this.getEnabledChannels(notification, preferences);

      // Store notification in database
      await this.storeNotification(notification);

      // Dispatch to each enabled channel
      const channelResults = await this.dispatchToChannels(notification, enabledChannels, preferences);

      // Update notification status based on results
      const overallSuccess = channelResults.some(result => result.success);
      const newStatus = overallSuccess ? NotificationStatus.SENT : NotificationStatus.FAILED;

      await this.updateNotificationStatus(notification.id, newStatus, channelResults);

      this.logger.info('Notification dispatched', {
        notificationId: notification.id,
        channels: enabledChannels.length,
        success: overallSuccess
      });

      return {
        notification,
        channels: channelResults,
        overallSuccess,
        dispatchTime: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        notificationData
      });

      throw error;
    }
  }

  /**
   * Queues a notification for batch processing
   */
  async queue(notificationData: CreateNotificationData): Promise<void> {
    const notification = NotificationModel.create(notificationData);

    // Check queue capacity
    if (this.messageQueue.length >= this.config.maxSize) {
      throw new Error('Notification queue is full');
    }

    this.messageQueue.push(notification);

    // Immediate dispatch for critical notifications
    if (notification.priority === NotificationPriority.CRITICAL) {
      await this.processQueue();
    }

    this.logger.debug('Notification queued', {
      notificationId: notification.id,
      queueSize: this.messageQueue.length
    });
  }

  /**
   * Processes queued notifications in batches
   */
  async processQueue(): Promise<BatchDispatchResult> {
    if (this.processing || this.messageQueue.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        batchTime: 0
      };
    }

    this.processing = true;
    const started = Date.now();

    try {
      // Sort queue by priority
      this.messageQueue.sort((a, b) => {
        const aPriority = this.config.priorityOrder.indexOf(a.priority);
        const bPriority = this.config.priorityOrder.indexOf(b.priority);
        return aPriority - bPriority;
      });

      // Take batch from queue
      const batch = this.messageQueue.splice(0, this.config.batchSize);
      const results: DispatchResult[] = [];

      // Process each notification in batch
      for (const notification of batch) {
        try {
          const result = await this.dispatchSingle(notification);
          results.push(result);
        } catch (error) {
          this.logger.error('Email send failed', error as Error, {
            notificationId: notification.id
          });

          results.push({
            notification,
            channels: [],
            overallSuccess: false,
            dispatchTime: 0
          });
        }
      }

      const successful = results.filter(r => r.overallSuccess).length;
      const failed = results.length - successful;

      this.logger.info('Queue processed', {
        total: batch.length,
        successful,
        failed,
        remainingInQueue: this.messageQueue.length,
        batchTime: Date.now() - started
      });

      return {
        total: batch.length,
        successful,
        failed,
        results,
        batchTime: Date.now() - started
      };
    } finally {
      this.processing = false;
    }
  }

  /**
   * Retries failed notifications
   */
  async retryFailed(): Promise<void> {
    try {
      // Get failed notifications ready for retry
      const { data: failedNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', NotificationStatus.FAILED)
        .lt('delivery_attempts', this.config.retryAttempts)
        .lt('created_at', new Date(Date.now() - this.config.retryDelay).toISOString());

      if (!failedNotifications || failedNotifications.length === 0) {
        return;
      }

      this.logger.info('Retrying failed notifications', {
        count: failedNotifications.length
      });

      for (const notificationData of failedNotifications as any[]) {
        const notification: Notification = {
          id: notificationData.id,
          user_id: notificationData.user_id,
          type: notificationData.type,
          priority: notificationData.priority,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          channels: notificationData.channels,
          status: notificationData.status,
          delivery_attempts: notificationData.delivery_attempts ?? 0,
          error_message: notificationData.error_message ?? null,
          created_at: new Date(notificationData.created_at),
          scheduled_for: notificationData.scheduled_for ? new Date(notificationData.scheduled_for) : null,
          sent_at: notificationData.sent_at ? new Date(notificationData.sent_at) : null
        };

        try {
          await this.dispatchSingle(notification, true);
        } catch (error) {
          this.logger.error('Email send failed', error as Error, {
            notificationId: notification.id
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to retry notifications', error as Error);
    }
  }

  /**
   * Gets channel health status
   */
  async getChannelHealth(): Promise<Record<NotificationChannel, {
    available: boolean;
    circuitState: string;
    rateLimit: { requests: number; window: number };
    lastError?: string;
  }>> {
    const health: any = {};

    for (const [channel, provider] of this.channelProviders.entries()) {
      const circuitBreaker = this.circuitBreakers.get(channel);

      try {
        const available = await provider.isAvailable();
        health[channel] = {
          available,
          circuitState: circuitBreaker?.getState() || 'unknown',
          rateLimit: provider.getRateLimit()
        };
      } catch (error) {
        health[channel] = {
          available: false,
          circuitState: circuitBreaker?.getState() || 'unknown',
          rateLimit: provider.getRateLimit(),
          lastError: String(error)
        };
      }
    }

    return health;
  }

  /**
   * Gets queue statistics
   */
  getQueueStats(): {
    size: number;
    processing: boolean;
    byPriority: Record<NotificationPriority, number>;
  } {
    const byPriority: Record<NotificationPriority, number> = {
      [NotificationPriority.LOW]: 0,
      [NotificationPriority.MEDIUM]: 0,
      [NotificationPriority.HIGH]: 0,
      [NotificationPriority.CRITICAL]: 0
    };

    this.messageQueue.forEach(notification => {
      byPriority[notification.priority]++;
    });

    return {
      size: this.messageQueue.length,
      processing: this.processing,
      byPriority
    };
  }

  /**
   * Dispatches a single notification (internal method)
   */
  private async dispatchSingle(notification: Notification, isRetry = false): Promise<DispatchResult> {
    const startTime = Date.now();

    // Get user preferences
    const preferences = await this.getUserPreferences(
      notification.user_id,
      notification.type
    );

    // Check if should dispatch
    if (!this.shouldDispatch(notification, preferences)) {
      return {
        notification,
        channels: [],
        overallSuccess: true,
        dispatchTime: Date.now() - startTime
      };
    }

    // Get enabled channels
    const enabledChannels = this.getEnabledChannels(notification, preferences);

    // Store or update notification
    if (!isRetry) {
      await this.storeNotification(notification);
    }

    // Dispatch to channels
    const channelResults = await this.dispatchToChannels(notification, enabledChannels, preferences);

    // Update status
    const overallSuccess = channelResults.some(result => result.success);
    const newStatus = overallSuccess ? NotificationStatus.SENT : NotificationStatus.FAILED;

    await this.updateNotificationStatus(notification.id, newStatus, channelResults);

    return {
      notification,
      channels: channelResults,
      overallSuccess,
      dispatchTime: Date.now() - startTime
    };
  }

  /**
   * Gets user preferences for notification type
   */
  private async getUserPreferences(userId: string, notificationType: string): Promise<NotificationPreference> {
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_type', notificationType)
        .single();

      if (data) {
        const pref: any = data as any
        return {
          user_id: pref.user_id,
          notification_type: pref.notification_type,
          enabled: !!pref.enabled,
          quiet_hours_start: pref.quiet_hours_start ? new Date(pref.quiet_hours_start) : null,
          quiet_hours_end: pref.quiet_hours_end ? new Date(pref.quiet_hours_end) : null,
          channels: pref.channels || [],
          id: pref.id || '',
          frequency: pref.frequency || 'immediate',
          created_at: new Date(pref.created_at),
          updated_at: new Date(pref.updated_at)
        } as unknown as NotificationPreference
      }

      // Create default preferences if none exist
      const defaultPreference = NotificationPreferenceModel.createDefault(userId, notificationType);
      await this.storePreference(defaultPreference);
      return defaultPreference;
    } catch (error) {
      // Return default preferences on error
      return NotificationPreferenceModel.createDefault(userId, notificationType);
    }
  }

  /**
   * Checks if notification should be dispatched
   */
  private shouldDispatch(notification: Notification, preferences: NotificationPreference): boolean {
    // Check if enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check quiet hours (except for critical notifications)
    if (notification.priority !== NotificationPriority.CRITICAL &&
        NotificationPreferenceModel.isInQuietHours(preferences)) {
      return false;
    }

    // Check if scheduled time has arrived
    if (notification.scheduled_for && notification.scheduled_for > new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Gets enabled channels for notification
   */
  private getEnabledChannels(notification: Notification, preferences: NotificationPreference): NotificationChannel[] {
    const preferredChannels = NotificationPreferenceModel.getEnabledChannels(preferences);
    const requestedChannels = notification.channels;

    // Intersection of preferred and requested channels
    return requestedChannels.filter(channel => preferredChannels.includes(channel));
  }

  /**
   * Dispatches notification to multiple channels
   */
  private async dispatchToChannels(
    notification: Notification,
    channels: NotificationChannel[],
    preferences: NotificationPreference
  ): Promise<Array<{
    channel: NotificationChannel;
    success: boolean;
    messageId?: string;
    error?: string;
    retryAt?: Date;
  }>> {
    const results = [];

    for (const channel of channels) {
      const provider = this.channelProviders.get(channel);
      const circuitBreaker = this.circuitBreakers.get(channel);

      if (!provider) {
        results.push({
          channel,
          success: false,
          error: 'No provider registered for channel'
        });
        continue;
      }

      if (!circuitBreaker) {
        results.push({
          channel,
          success: false,
          error: 'No circuit breaker for channel'
        });
        continue;
      }

      try {
        const result = await circuitBreaker.execute(() =>
          provider.send(notification, preferences)
        );

        results.push({
          channel,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        this.logger.debug('Channel dispatch completed', {
          notificationId: notification.id,
          channel,
          success: result.success
        });
      } catch (error) {
        const retryAt = new Date(Date.now() + this.config.retryDelay);

        results.push({
          channel,
          success: false,
          error: String(error),
          retryAt
        });

        this.logger.error('Email send failed', error as Error, {
          notificationId: notification.id,
          channel
        });
      }
    }

    return results;
  }

  /**
   * Stores notification in database
   */
  private async storeNotification(notification: Notification): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        channels: notification.channels,
        created_at: notification.created_at.toISOString(),
        scheduled_for: notification.scheduled_for?.toISOString(),
        status: notification.status,
        delivery_attempts: notification.delivery_attempts,
        dedup_key: notification.dedup_key
      });

    if (error) {
      throw new Error(`Failed to store notification: ${error.message}`);
    }
  }

  /**
   * Stores user preference in database
   */
  private async storePreference(preference: NotificationPreference): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .insert({
        id: preference.id,
        user_id: preference.user_id,
        notification_type: preference.notification_type,
        enabled: preference.enabled,
        channels: preference.channels,
        quiet_hours: preference.quiet_hours,
        frequency: preference.frequency,
        created_at: preference.created_at.toISOString(),
        updated_at: preference.updated_at.toISOString()
      });

    if (error) {
      throw new Error(`Failed to store preference: ${error.message}`);
    }
  }

  /**
   * Updates notification status in database
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    channelResults: any[]
  ): Promise<void> {
    const updates: any = { status };

    if (status === NotificationStatus.SENT) {
      updates.sent_at = new Date().toISOString();
    }

    if (channelResults.some(r => !r.success)) {
      updates.error_message = channelResults
        .filter(r => !r.success)
        .map(r => `${r.channel}: ${r.error}`)
        .join('; ');
    }

    const { error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', notificationId);

    if (error) {
      this.logger.error('Email send failed', error as Error, {
        notificationId,
        status
      });
    }
  }

  /**
   * Starts the automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.processQueue().catch(error => {
        this.logger.error('Failed to process queue during flush', error as Error);
      });
    }, this.config.flushInterval);
  }

  /**
   * Gracefully shuts down the dispatcher
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Process remaining queue
    await this.processQueue();
  }
}

/**
 * Global dispatcher instance
 */
let globalDispatcher: NotificationDispatcher | null = null;

/**
 * Gets or creates the global dispatcher instance
 */
export function getNotificationDispatcher(): NotificationDispatcher {
  if (!globalDispatcher) {
    globalDispatcher = new NotificationDispatcher();
  }
  return globalDispatcher;
}

/**
 * Sets a new global dispatcher instance
 */
export function setNotificationDispatcher(dispatcher: NotificationDispatcher): void {
  if (globalDispatcher) {
    globalDispatcher.close();
  }
  globalDispatcher = dispatcher;
}

export default NotificationDispatcher;