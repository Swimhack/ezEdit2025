/**
 * NotificationPreference model for managing user notification preferences
 * Supports per-type channel preferences, quiet hours, and delivery frequency
 */

import { z } from 'zod';
import { NotificationChannel } from './Notification';

/**
 * Notification delivery frequency options
 */
export enum NotificationFrequency {
  INSTANT = 'INSTANT',
  BATCHED_5MIN = 'BATCHED_5MIN',
  BATCHED_HOURLY = 'BATCHED_HOURLY',
  DAILY_DIGEST = 'DAILY_DIGEST'
}

/**
 * Channel preferences structure
 */
export interface ChannelPreferences {
  /** Enable email notifications */
  email: boolean;
  /** Enable SMS notifications */
  sms: boolean;
  /** Enable push notifications */
  push: boolean;
  /** Enable in-app notifications */
  in_app: boolean;
}

/**
 * Quiet hours configuration
 */
export interface QuietHours {
  /** Start time in HH:MM format (24-hour) */
  start: string;
  /** End time in HH:MM format (24-hour) */
  end: string;
  /** Timezone identifier (e.g., 'America/New_York') */
  timezone: string;
}

/**
 * NotificationPreference interface representing user preferences per notification type
 */
export interface NotificationPreference {
  /** Unique identifier for the preference */
  id: string;
  /** User ID this preference belongs to */
  user_id: string;
  /** Notification type this preference applies to */
  notification_type: string;
  /** Whether notifications of this type are enabled */
  enabled: boolean;
  /** Channel-specific preferences */
  channels: ChannelPreferences;
  /** Quiet hours when notifications should be suppressed */
  quiet_hours?: QuietHours | null;
  /** Delivery frequency for this notification type */
  frequency: NotificationFrequency;
  /** Creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * NotificationPreference creation data interface
 */
export interface CreateNotificationPreferenceData {
  user_id: string;
  notification_type: string;
  enabled?: boolean;
  channels?: Partial<ChannelPreferences>;
  quiet_hours?: QuietHours | null;
  frequency?: NotificationFrequency;
}

/**
 * NotificationPreference update data interface
 */
export interface UpdateNotificationPreferenceData {
  enabled?: boolean;
  channels?: Partial<ChannelPreferences>;
  quiet_hours?: QuietHours | null;
  frequency?: NotificationFrequency;
}

/**
 * Default channel preferences for new users
 */
export const DefaultChannelPreferences: ChannelPreferences = {
  email: true,
  sms: false,
  push: true,
  in_app: true
};

/**
 * Default preferences for different notification types
 */
export const DefaultTypePreferences: Record<string, Partial<CreateNotificationPreferenceData>> = {
  // Critical system notifications
  system_alert: {
    enabled: true,
    channels: { email: true, sms: true, push: true, in_app: true },
    frequency: NotificationFrequency.INSTANT
  },
  security_alert: {
    enabled: true,
    channels: { email: true, sms: true, push: true, in_app: true },
    frequency: NotificationFrequency.INSTANT
  },

  // Account-related notifications
  account_update: {
    enabled: true,
    channels: { email: true, sms: false, push: true, in_app: true },
    frequency: NotificationFrequency.INSTANT
  },
  password_reset: {
    enabled: true,
    channels: { email: true, sms: true, push: false, in_app: false },
    frequency: NotificationFrequency.INSTANT
  },

  // Application activity
  contract_analysis_complete: {
    enabled: true,
    channels: { email: true, sms: false, push: true, in_app: true },
    frequency: NotificationFrequency.INSTANT
  },
  comparison_shared: {
    enabled: true,
    channels: { email: true, sms: false, push: false, in_app: true },
    frequency: NotificationFrequency.BATCHED_5MIN
  },

  // Marketing and updates
  feature_announcement: {
    enabled: true,
    channels: { email: true, sms: false, push: false, in_app: true },
    frequency: NotificationFrequency.DAILY_DIGEST
  },
  newsletter: {
    enabled: false,
    channels: { email: true, sms: false, push: false, in_app: false },
    frequency: NotificationFrequency.DAILY_DIGEST
  }
};

/**
 * Validation schema for time format (HH:MM)
 */
const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format, use HH:MM');

/**
 * Validation schema for quiet hours
 */
export const QuietHoursSchema = z.object({
  start: timeSchema,
  end: timeSchema,
  timezone: z.string().min(1)
});

/**
 * Validation schema for channel preferences
 */
export const ChannelPreferencesSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  in_app: z.boolean()
});

/**
 * Validation schema for NotificationPreference creation
 */
export const CreateNotificationPreferenceSchema = z.object({
  user_id: z.string().uuid(),
  notification_type: z.string().min(1).max(100),
  enabled: z.boolean().optional().default(true),
  channels: ChannelPreferencesSchema.partial().optional(),
  quiet_hours: QuietHoursSchema.nullable().optional(),
  frequency: z.nativeEnum(NotificationFrequency).optional().default(NotificationFrequency.INSTANT)
});

/**
 * Validation schema for NotificationPreference updates
 */
export const UpdateNotificationPreferenceSchema = z.object({
  enabled: z.boolean().optional(),
  channels: ChannelPreferencesSchema.partial().optional(),
  quiet_hours: QuietHoursSchema.nullable().optional(),
  frequency: z.nativeEnum(NotificationFrequency).optional()
});

/**
 * NotificationPreference model class with validation and helper methods
 */
export class NotificationPreferenceModel {
  /**
   * Validates preference creation data
   */
  static validate(data: unknown): CreateNotificationPreferenceData {
    return CreateNotificationPreferenceSchema.parse(data);
  }

  /**
   * Validates preference update data
   */
  static validateUpdate(data: unknown): UpdateNotificationPreferenceData {
    return UpdateNotificationPreferenceSchema.parse(data);
  }

  /**
   * Creates a new NotificationPreference instance with defaults
   */
  static create(data: CreateNotificationPreferenceData): NotificationPreference {
    const validated = this.validate(data);

    // Get defaults for the notification type
    const typeDefaults = DefaultTypePreferences[validated.notification_type] || {};

    // Merge channel preferences with defaults
    const channels = {
      ...DefaultChannelPreferences,
      ...typeDefaults.channels,
      ...validated.channels
    };

    // Validate that at least one channel is enabled if the preference is enabled
    if (validated.enabled !== false && !Object.values(channels).some(enabled => enabled)) {
      throw new Error('At least one channel must be enabled when notifications are enabled');
    }

    const now = new Date();

    return {
      id: crypto.randomUUID(),
      user_id: validated.user_id,
      notification_type: validated.notification_type,
      enabled: validated.enabled ?? typeDefaults.enabled ?? true,
      channels,
      quiet_hours: validated.quiet_hours ?? typeDefaults.quiet_hours ?? null,
      frequency: validated.frequency ?? typeDefaults.frequency ?? NotificationFrequency.INSTANT,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Updates a NotificationPreference with validation
   */
  static update(preference: NotificationPreference, data: UpdateNotificationPreferenceData): Partial<NotificationPreference> {
    const validated = this.validateUpdate(data);

    const updates: Partial<NotificationPreference> = {
      updated_at: new Date()
    };

    if (validated.enabled !== undefined) {
      updates.enabled = validated.enabled;
    }

    if (validated.channels) {
      const newChannels = { ...preference.channels, ...validated.channels };

      // Validate that at least one channel is enabled if preference is/will be enabled
      const isEnabled = validated.enabled ?? preference.enabled;
      if (isEnabled && !Object.values(newChannels).some(enabled => enabled)) {
        throw new Error('At least one channel must be enabled when notifications are enabled');
      }

      updates.channels = newChannels;
    }

    if (validated.quiet_hours !== undefined) {
      // Validate quiet hours only apply to non-critical notifications
      if (validated.quiet_hours && this.isCriticalType(preference.notification_type)) {
        throw new Error('Quiet hours cannot be set for critical notification types');
      }
      updates.quiet_hours = validated.quiet_hours;
    }

    if (validated.frequency !== undefined) {
      updates.frequency = validated.frequency;
    }

    return updates;
  }

  /**
   * Checks if a notification type is critical and should bypass quiet hours
   */
  static isCriticalType(notificationType: string): boolean {
    const criticalTypes = ['system_alert', 'security_alert', 'password_reset'];
    return criticalTypes.includes(notificationType);
  }

  /**
   * Checks if notifications should be suppressed due to quiet hours
   */
  static isInQuietHours(preference: NotificationPreference, currentTime?: Date): boolean {
    if (!preference.quiet_hours || this.isCriticalType(preference.notification_type)) {
      return false;
    }

    const now = currentTime || new Date();

    try {
      // Convert current time to user's timezone
      const userTime = new Intl.DateTimeFormat('en-CA', {
        timeZone: preference.quiet_hours.timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).format(now);

      const currentTimeMinutes = this.timeToMinutes(userTime);
      const startMinutes = this.timeToMinutes(preference.quiet_hours.start);
      const endMinutes = this.timeToMinutes(preference.quiet_hours.end);

      // Handle quiet hours spanning midnight
      if (startMinutes > endMinutes) {
        return currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes;
      } else {
        return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
      }
    } catch (error) {
      // If timezone conversion fails, don't suppress notifications
      return false;
    }
  }

  /**
   * Gets enabled channels for a preference
   */
  static getEnabledChannels(preference: NotificationPreference): NotificationChannel[] {
    if (!preference.enabled) {
      return [];
    }

    const channels: NotificationChannel[] = [];
    if (preference.channels.email) channels.push(NotificationChannel.EMAIL);
    if (preference.channels.sms) channels.push(NotificationChannel.SMS);
    if (preference.channels.push) channels.push(NotificationChannel.PUSH);
    if (preference.channels.in_app) channels.push(NotificationChannel.IN_APP);

    return channels;
  }

  /**
   * Checks if immediate delivery is required
   */
  static requiresImmediateDelivery(preference: NotificationPreference): boolean {
    return (
      preference.frequency === NotificationFrequency.INSTANT ||
      this.isCriticalType(preference.notification_type)
    );
  }

  /**
   * Gets batching delay in milliseconds
   */
  static getBatchingDelay(frequency: NotificationFrequency): number {
    const delays = {
      [NotificationFrequency.INSTANT]: 0,
      [NotificationFrequency.BATCHED_5MIN]: 5 * 60 * 1000,
      [NotificationFrequency.BATCHED_HOURLY]: 60 * 60 * 1000,
      [NotificationFrequency.DAILY_DIGEST]: 24 * 60 * 60 * 1000
    };
    return delays[frequency];
  }

  /**
   * Creates default preferences for a user and notification type
   */
  static createDefault(userId: string, notificationType: string): NotificationPreference {
    const defaults = DefaultTypePreferences[notificationType] || {};

    return this.create({
      user_id: userId,
      notification_type: notificationType,
      ...defaults
    });
  }

  /**
   * Bulk creates default preferences for a new user
   */
  static createDefaultsForUser(userId: string): NotificationPreference[] {
    return Object.keys(DefaultTypePreferences).map(notificationType =>
      this.createDefault(userId, notificationType)
    );
  }

  /**
   * Converts time string (HH:MM) to minutes since midnight
   */
  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Formats preference for display
   */
  static format(preference: NotificationPreference): string {
    const status = preference.enabled ? 'ENABLED' : 'DISABLED';
    const enabledChannels = this.getEnabledChannels(preference);
    const frequency = preference.frequency.toLowerCase();
    const quietHours = preference.quiet_hours ?
      `${preference.quiet_hours.start}-${preference.quiet_hours.end} ${preference.quiet_hours.timezone}` :
      'None';

    return `${preference.notification_type} | ${status} | ${enabledChannels.join(', ')} | ${frequency} | Quiet: ${quietHours}`;
  }

  /**
   * Creates a preference filter for querying
   */
  static createFilter(options: {
    userId?: string;
    notificationType?: string;
    enabled?: boolean;
    channels?: NotificationChannel[];
    frequency?: NotificationFrequency;
  }) {
    const filter: any = {};

    if (options.userId) filter.user_id = options.userId;
    if (options.notificationType) filter.notification_type = options.notificationType;
    if (options.enabled !== undefined) filter.enabled = options.enabled;
    if (options.frequency) filter.frequency = options.frequency;

    // Channel filtering would need special handling in the database query
    return filter;
  }
}

/**
 * Type guard to check if an object is a valid NotificationPreference
 */
export function isNotificationPreference(obj: any): obj is NotificationPreference {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.notification_type === 'string' &&
    typeof obj.enabled === 'boolean' &&
    typeof obj.channels === 'object' &&
    Object.values(NotificationFrequency).includes(obj.frequency) &&
    obj.created_at instanceof Date &&
    obj.updated_at instanceof Date
  );
}

export default NotificationPreferenceModel;