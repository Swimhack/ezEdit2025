/**
 * Notification preferences manager service
 * Handles user notification preferences, quiet hours, and intelligent preference learning
 */

import {
  NotificationPreference,
  NotificationPreferenceModel,
  CreateNotificationPreferenceData,
  UpdateNotificationPreferenceData,
  ChannelPreferences,
  QuietHours,
  NotificationFrequency,
  DefaultTypePreferences
} from './models/NotificationPreference';
import { NotificationChannel } from './models/Notification';
import { supabase } from '../supabase';
import { getLogger } from '../logging/logger';

/**
 * Preference update result interface
 */
export interface PreferenceUpdateResult {
  success: boolean;
  updated: NotificationPreference | null;
  errors: string[];
}

/**
 * Bulk preference update result interface
 */
export interface BulkPreferenceResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

/**
 * Preference analytics interface
 */
export interface PreferenceAnalytics {
  userId: string;
  totalNotifications: number;
  channelStats: Record<NotificationChannel, {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
  typeStats: Record<string, {
    sent: number;
    opened: number;
    engagement: number;
  }>;
  frequencyOptimal: NotificationFrequency;
  quietHoursOptimal: QuietHours | null;
  recommendations: Array<{
    type: string;
    channel: NotificationChannel;
    action: 'enable' | 'disable' | 'adjust_frequency';
    reason: string;
    confidence: number;
  }>;
}

/**
 * Smart preference learning configuration
 */
export interface LearningConfig {
  enabled: boolean;
  minDataPoints: number;
  learningRate: number;
  confidenceThreshold: number;
  autoApply: boolean;
}

/**
 * Default learning configuration
 */
const DefaultLearningConfig: LearningConfig = {
  enabled: true,
  minDataPoints: 50,
  learningRate: 0.1,
  confidenceThreshold: 0.8,
  autoApply: false
};

/**
 * Notification preferences manager service
 */
export class NotificationPreferencesManager {
  private logger = getLogger();

  constructor(
    private learningConfig: LearningConfig = DefaultLearningConfig
  ) {}

  /**
   * Gets user preferences for a specific notification type
   */
  async getPreference(userId: string, notificationType: string): Promise<NotificationPreference> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_type', notificationType)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(`Failed to get preference: ${error.message}`);
      }

      if (data) {
        return {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        };
      }

      // Create default preference if none exists
      const defaultPreference = NotificationPreferenceModel.createDefault(userId, notificationType);
      await this.createPreference(defaultPreference);
      return defaultPreference;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        userId,
        notificationType
      });
      throw error;
    }
  }

  /**
   * Gets all preferences for a user
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('notification_type');

      if (error) {
        throw new Error(`Failed to get user preferences: ${error.message}`);
      }

      const preferences = (data || []).map(row => ({
        ...row,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
      }));

      // Ensure all default types have preferences
      const existingTypes = new Set(preferences.map(p => p.notification_type));
      const missingTypes = Object.keys(DefaultTypePreferences).filter(type => !existingTypes.has(type));

      if (missingTypes.length > 0) {
        const newPreferences = await this.createDefaultPreferences(userId, missingTypes);
        preferences.push(...newPreferences);
      }

      return preferences;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Creates a new notification preference
   */
  async createPreference(data: CreateNotificationPreferenceData): Promise<NotificationPreference> {
    try {
      const preference = NotificationPreferenceModel.create(data);

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
        throw new Error(`Failed to create preference: ${error.message}`);
      }

      this.logger.info('Notification preference created', {
        userId: preference.user_id,
        notificationType: preference.notification_type,
        preferenceId: preference.id
      });

      return preference;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { data });
      throw error;
    }
  }

  /**
   * Updates an existing notification preference
   */
  async updatePreference(
    userId: string,
    notificationType: string,
    updates: UpdateNotificationPreferenceData
  ): Promise<PreferenceUpdateResult> {
    try {
      // Get current preference
      const currentPreference = await this.getPreference(userId, notificationType);

      // Apply updates with validation
      const updatedFields = NotificationPreferenceModel.update(currentPreference, updates);

      // Update in database
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...updatedFields,
          updated_at: updatedFields.updated_at?.toISOString()
        })
        .eq('user_id', userId)
        .eq('notification_type', notificationType);

      if (error) {
        throw new Error(`Failed to update preference: ${error.message}`);
      }

      // Get updated preference
      const updated = await this.getPreference(userId, notificationType);

      this.logger.info('Notification preference updated', {
        userId,
        notificationType,
        updates: Object.keys(updates)
      });

      return {
        success: true,
        updated,
        errors: []
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        userId,
        notificationType,
        updates
      });

      return {
        success: false,
        updated: null,
        errors: [String(error)]
      };
    }
  }

  /**
   * Bulk updates multiple preferences for a user
   */
  async bulkUpdatePreferences(
    userId: string,
    updates: Array<{
      notificationType: string;
      updates: UpdateNotificationPreferenceData;
    }>
  ): Promise<BulkPreferenceResult> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const { notificationType, updates: preferenceUpdates } of updates) {
      try {
        const result = await this.updatePreference(userId, notificationType, preferenceUpdates);
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(...result.errors);
        }
      } catch (error) {
        failed++;
        errors.push(`${notificationType}: ${error}`);
      }
    }

    this.logger.info('Bulk preference update completed', {
      userId,
      total: updates.length,
      successful,
      failed
    });

    return {
      total: updates.length,
      successful,
      failed,
      errors
    };
  }

  /**
   * Sets global channel preferences for a user
   */
  async setGlobalChannelPreferences(
    userId: string,
    channelPreferences: Partial<ChannelPreferences>
  ): Promise<BulkPreferenceResult> {
    try {
      const userPreferences = await this.getUserPreferences(userId);

      const updates = userPreferences.map(preference => ({
        notificationType: preference.notification_type,
        updates: {
          channels: {
            ...preference.channels,
            ...channelPreferences
          }
        }
      }));

      return await this.bulkUpdatePreferences(userId, updates);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        userId,
        channelPreferences
      });

      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [String(error)]
      };
    }
  }

  /**
   * Sets global quiet hours for a user
   */
  async setGlobalQuietHours(
    userId: string,
    quietHours: QuietHours | null
  ): Promise<BulkPreferenceResult> {
    try {
      const userPreferences = await this.getUserPreferences(userId);

      // Only update non-critical notification types
      const updatablePreferences = userPreferences.filter(preference =>
        !NotificationPreferenceModel.isCriticalType(preference.notification_type)
      );

      const updates = updatablePreferences.map(preference => ({
        notificationType: preference.notification_type,
        updates: { quiet_hours: quietHours }
      }));

      return await this.bulkUpdatePreferences(userId, updates);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        userId,
        quietHours
      });

      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [String(error)]
      };
    }
  }

  /**
   * Enables or disables all notifications for a user
   */
  async setAllNotifications(
    userId: string,
    enabled: boolean
  ): Promise<BulkPreferenceResult> {
    try {
      const userPreferences = await this.getUserPreferences(userId);

      const updates = userPreferences.map(preference => ({
        notificationType: preference.notification_type,
        updates: { enabled }
      }));

      return await this.bulkUpdatePreferences(userId, updates);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        userId,
        enabled
      });

      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [String(error)]
      };
    }
  }

  /**
   * Analyzes user notification behavior and provides insights
   */
  async analyzePreferences(userId: string): Promise<PreferenceAnalytics | null> {
    try {
      if (!this.learningConfig.enabled) {
        return null;
      }

      // Get notification delivery data (simplified query)
      const { data: deliveryData } = await supabase
        .from('notification_deliveries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

      if (!deliveryData || deliveryData.length < this.learningConfig.minDataPoints) {
        return null;
      }

      // Analyze channel performance
      const channelStats: any = {};
      const typeStats: any = {};

      for (const channel of Object.values(NotificationChannel)) {
        channelStats[channel] = {
          sent: 0,
          opened: 0,
          clicked: 0,
          openRate: 0,
          clickRate: 0
        };
      }

      deliveryData.forEach(delivery => {
        const channel = delivery.channel as NotificationChannel;
        const type = delivery.notification_type;

        if (channelStats[channel]) {
          channelStats[channel].sent++;
          if (delivery.opened_at) channelStats[channel].opened++;
          if (delivery.clicked_at) channelStats[channel].clicked++;
        }

        if (!typeStats[type]) {
          typeStats[type] = { sent: 0, opened: 0, engagement: 0 };
        }
        typeStats[type].sent++;
        if (delivery.opened_at) typeStats[type].opened++;
      });

      // Calculate rates
      Object.values(channelStats).forEach((stats: any) => {
        stats.openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
        stats.clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
      });

      Object.values(typeStats).forEach((stats: any) => {
        stats.engagement = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations(channelStats, typeStats);

      // Determine optimal frequency and quiet hours
      const frequencyOptimal = this.analyzeOptimalFrequency(deliveryData);
      const quietHoursOptimal = this.analyzeOptimalQuietHours(deliveryData);

      this.logger.info('Preference analysis completed', {
        userId,
        dataPoints: deliveryData.length,
        recommendations: recommendations.length
      });

      return {
        userId,
        totalNotifications: deliveryData.length,
        channelStats,
        typeStats,
        frequencyOptimal,
        quietHoursOptimal,
        recommendations
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { userId });
      return null;
    }
  }

  /**
   * Applies smart recommendations to user preferences
   */
  async applySmartRecommendations(
    userId: string,
    analytics: PreferenceAnalytics
  ): Promise<BulkPreferenceResult> {
    try {
      if (!this.learningConfig.autoApply) {
        throw new Error('Auto-apply is disabled');
      }

      const updates: Array<{
        notificationType: string;
        updates: UpdateNotificationPreferenceData;
      }> = [];

      // Apply high-confidence recommendations
      const highConfidenceRecs = analytics.recommendations.filter(
        rec => rec.confidence >= this.learningConfig.confidenceThreshold
      );

      for (const recommendation of highConfidenceRecs) {
        const preferenceUpdate: UpdateNotificationPreferenceData = {};

        switch (recommendation.action) {
          case 'enable':
            preferenceUpdate.channels = {
              [recommendation.channel]: true
            };
            break;
          case 'disable':
            preferenceUpdate.channels = {
              [recommendation.channel]: false
            };
            break;
          case 'adjust_frequency':
            preferenceUpdate.frequency = analytics.frequencyOptimal;
            break;
        }

        if (Object.keys(preferenceUpdate).length > 0) {
          updates.push({
            notificationType: recommendation.type,
            updates: preferenceUpdate
          });
        }
      }

      if (updates.length === 0) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          errors: []
        };
      }

      const result = await this.bulkUpdatePreferences(userId, updates);

      this.logger.info('Smart recommendations applied', {
        userId,
        recommendations: highConfidenceRecs.length,
        applied: result.successful
      });

      return result;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        userId
      });

      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [String(error)]
      };
    }
  }

  /**
   * Creates default preferences for missing notification types
   */
  private async createDefaultPreferences(
    userId: string,
    notificationTypes: string[]
  ): Promise<NotificationPreference[]> {
    const preferences: NotificationPreference[] = [];

    for (const notificationType of notificationTypes) {
      try {
        const preference = await this.createPreference({
          user_id: userId,
          notification_type: notificationType
        });
        preferences.push(preference);
      } catch (error) {
        this.logger.error('Email send failed', error as Error, {
          userId,
          notificationType
        });
      }
    }

    return preferences;
  }

  /**
   * Generates smart recommendations based on analytics
   */
  private generateRecommendations(
    channelStats: any,
    typeStats: any
  ): Array<{
    type: string;
    channel: NotificationChannel;
    action: 'enable' | 'disable' | 'adjust_frequency';
    reason: string;
    confidence: number;
  }> {
    const recommendations: any[] = [];

    // Recommend disabling poorly performing channels
    Object.entries(channelStats).forEach(([channel, stats]: [string, any]) => {
      if (stats.sent > 10 && stats.openRate < 5) {
        Object.keys(typeStats).forEach(type => {
          recommendations.push({
            type,
            channel: channel as NotificationChannel,
            action: 'disable',
            reason: `Low open rate (${stats.openRate.toFixed(1)}%) for ${channel}`,
            confidence: Math.min(0.9, 1 - (stats.openRate / 100))
          });
        });
      }
    });

    // Recommend enabling high-performing channels
    Object.entries(channelStats).forEach(([channel, stats]: [string, any]) => {
      if (stats.sent > 10 && stats.openRate > 50) {
        Object.keys(typeStats).forEach(type => {
          recommendations.push({
            type,
            channel: channel as NotificationChannel,
            action: 'enable',
            reason: `High open rate (${stats.openRate.toFixed(1)}%) for ${channel}`,
            confidence: Math.min(0.9, stats.openRate / 100)
          });
        });
      }
    });

    return recommendations;
  }

  /**
   * Analyzes optimal notification frequency
   */
  private analyzeOptimalFrequency(deliveryData: any[]): NotificationFrequency {
    // Simplified analysis - in real implementation would be more sophisticated
    const avgDeliveries = deliveryData.length / 90; // Per day over 90 days

    if (avgDeliveries < 1) return NotificationFrequency.DAILY_DIGEST;
    if (avgDeliveries < 5) return NotificationFrequency.BATCHED_HOURLY;
    if (avgDeliveries < 20) return NotificationFrequency.BATCHED_5MIN;
    return NotificationFrequency.INSTANT;
  }

  /**
   * Analyzes optimal quiet hours
   */
  private analyzeOptimalQuietHours(deliveryData: any[]): QuietHours | null {
    // Simplified analysis - would analyze when user is least engaged
    // For now, return default quiet hours
    return {
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    };
  }

  /**
   * Gets preference statistics for admin dashboard
   */
  async getPreferenceStats(): Promise<{
    totalUsers: number;
    enabledByChannel: Record<NotificationChannel, number>;
    enabledByType: Record<string, number>;
    avgPreferencesPerUser: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*');

      if (error) {
        throw new Error(`Failed to get preference stats: ${error.message}`);
      }

      const preferences = data || [];
      const uniqueUsers = new Set(preferences.map(p => p.user_id)).size;

      const enabledByChannel: any = {};
      const enabledByType: any = {};

      Object.values(NotificationChannel).forEach(channel => {
        enabledByChannel[channel] = 0;
      });

      preferences.forEach(pref => {
        if (pref.enabled) {
          enabledByType[pref.notification_type] = (enabledByType[pref.notification_type] || 0) + 1;

          Object.entries(pref.channels).forEach(([channel, enabled]) => {
            if (enabled) {
              enabledByChannel[channel] = (enabledByChannel[channel] || 0) + 1;
            }
          });
        }
      });

      return {
        totalUsers: uniqueUsers,
        enabledByChannel,
        enabledByType,
        avgPreferencesPerUser: uniqueUsers > 0 ? preferences.length / uniqueUsers : 0
      };
    } catch (error) {
      this.logger.error('Failed to get preference stats', error as Error);
      throw error;
    }
  }
}

/**
 * Global preferences manager instance
 */
let globalPreferencesManager: NotificationPreferencesManager | null = null;

/**
 * Gets or creates the global preferences manager instance
 */
export function getNotificationPreferencesManager(): NotificationPreferencesManager {
  if (!globalPreferencesManager) {
    globalPreferencesManager = new NotificationPreferencesManager();
  }
  return globalPreferencesManager;
}

/**
 * Sets a new global preferences manager instance
 */
export function setNotificationPreferencesManager(manager: NotificationPreferencesManager): void {
  globalPreferencesManager = manager;
}

export default NotificationPreferencesManager;