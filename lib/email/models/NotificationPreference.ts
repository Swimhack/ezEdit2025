import { NotificationType } from './EmailNotification';

export enum DigestFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never'
}

export interface TypePreference {
  enabled: boolean;                // Type-specific on/off
  frequency?: DigestFrequency;     // Override global frequency
  channels: string[];              // email, sms (future), push
}

export interface NotificationPreference {
  // Core identification
  id: string;                      // Preference record ID
  userId: string;                  // User who owns preferences

  // Global settings
  emailEnabled: boolean;           // Master email on/off switch
  emailAddress: string;            // Preferred email address
  timezone: string;                // User timezone for scheduling
  locale: string;                  // Preferred language

  // Category preferences
  transactionalEnabled: boolean;   // Critical emails (always true)
  marketingEnabled: boolean;       // Marketing communications
  alertsEnabled: boolean;          // System alerts
  activityEnabled: boolean;        // Activity notifications

  // Detailed preferences by type
  typePreferences: Map<NotificationType, TypePreference>;

  // Frequency settings
  digestFrequency: DigestFrequency; // Immediate, daily, weekly
  quietHoursStart?: string;        // HH:MM format
  quietHoursEnd?: string;          // HH:MM format
  weekendDigest: boolean;          // Batch weekend emails

  // Unsubscribe
  unsubscribeToken: string;        // Unique token for links
  unsubscribedAt?: Date;           // Global unsubscribe date
  unsubscribeReason?: string;      // User feedback

  // Bounce handling
  bounceCount: number;             // Email bounce counter
  suppressedAt?: Date;             // When email was suppressed
  suppressReason?: string;         // Bounce, complaint, manual

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  lastEmailAt?: Date;              // Last email sent
}

export class NotificationPreferenceModel {
  private static preferences: Map<string, NotificationPreference> = new Map();

  static validate(preference: Partial<NotificationPreference>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!preference.userId) {
      errors.push('userId is required');
    }

    if (!preference.emailAddress) {
      errors.push('emailAddress is required');
    } else if (!this.isValidEmail(preference.emailAddress)) {
      errors.push('emailAddress must be valid email format');
    }

    if (!preference.timezone) {
      errors.push('timezone is required');
    } else if (!this.isValidTimezone(preference.timezone)) {
      errors.push('timezone must be valid IANA timezone');
    }

    if (!preference.locale) {
      errors.push('locale is required');
    }

    // Transactional emails cannot be disabled
    if (preference.transactionalEnabled === false) {
      errors.push('transactionalEnabled cannot be false (legal requirement)');
    }

    // Quiet hours validation
    if (preference.quietHoursStart && !this.isValidTimeFormat(preference.quietHoursStart)) {
      errors.push('quietHoursStart must be in HH:MM format');
    }

    if (preference.quietHoursEnd && !this.isValidTimeFormat(preference.quietHoursEnd)) {
      errors.push('quietHoursEnd must be in HH:MM format');
    }

    return errors;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  static isValidTimeFormat(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  static generateUnsubscribeToken(): string {
    return crypto.randomUUID() + '-' + Date.now().toString(36);
  }

  static create(data: Partial<NotificationPreference>): NotificationPreference {
    const now = new Date();

    const preference: NotificationPreference = {
      id: crypto.randomUUID(),
      userId: data.userId!,
      emailEnabled: data.emailEnabled ?? true,
      emailAddress: data.emailAddress!,
      timezone: data.timezone || 'UTC',
      locale: data.locale || 'en-US',
      transactionalEnabled: true, // Always true
      marketingEnabled: data.marketingEnabled ?? true,
      alertsEnabled: data.alertsEnabled ?? true,
      activityEnabled: data.activityEnabled ?? true,
      typePreferences: data.typePreferences || new Map(),
      digestFrequency: data.digestFrequency || DigestFrequency.IMMEDIATE,
      quietHoursStart: data.quietHoursStart,
      quietHoursEnd: data.quietHoursEnd,
      weekendDigest: data.weekendDigest ?? false,
      unsubscribeToken: this.generateUnsubscribeToken(),
      unsubscribedAt: data.unsubscribedAt,
      unsubscribeReason: data.unsubscribeReason,
      bounceCount: data.bounceCount || 0,
      suppressedAt: data.suppressedAt,
      suppressReason: data.suppressReason,
      createdAt: now,
      updatedAt: now,
      lastEmailAt: data.lastEmailAt
    };

    // Initialize default type preferences
    this.initializeDefaultTypePreferences(preference);

    this.preferences.set(preference.userId, preference);
    return preference;
  }

  static getByUserId(userId: string): NotificationPreference | undefined {
    return this.preferences.get(userId);
  }

  static getByUnsubscribeToken(token: string): NotificationPreference | undefined {
    return Array.from(this.preferences.values()).find(p => p.unsubscribeToken === token);
  }

  static update(userId: string, data: Partial<NotificationPreference>): NotificationPreference | null {
    const existing = this.preferences.get(userId);
    if (!existing) return null;

    const updated: NotificationPreference = {
      ...existing,
      ...data,
      userId: existing.userId, // Cannot change userId
      transactionalEnabled: true, // Always true
      updatedAt: new Date()
    };

    this.preferences.set(userId, updated);
    return updated;
  }

  static unsubscribe(token: string, reason?: string, categories?: string[]): boolean {
    const preference = this.getByUnsubscribeToken(token);
    if (!preference) return false;

    const now = new Date();

    if (categories && categories.length > 0) {
      // Partial unsubscribe
      for (const category of categories) {
        switch (category) {
          case 'marketing':
            preference.marketingEnabled = false;
            break;
          case 'alerts':
            preference.alertsEnabled = false;
            break;
          case 'activity':
            preference.activityEnabled = false;
            break;
        }
      }
    } else {
      // Global unsubscribe
      preference.emailEnabled = false;
      preference.unsubscribedAt = now;
    }

    preference.unsubscribeReason = reason;
    preference.updatedAt = now;

    return true;
  }

  static shouldSendEmail(
    userId: string,
    notificationType: NotificationType,
    category: string
  ): { allowed: boolean; reason?: string } {
    const preference = this.getByUserId(userId);
    if (!preference) {
      return { allowed: true }; // Default to allowing if no preferences set
    }

    // Check if globally disabled
    if (!preference.emailEnabled) {
      return { allowed: false, reason: 'Email globally disabled' };
    }

    // Check if suppressed due to bounces
    if (preference.suppressedAt) {
      return { allowed: false, reason: 'Email suppressed due to bounces/complaints' };
    }

    // Transactional emails always allowed
    if (category === 'transactional') {
      return { allowed: true };
    }

    // Check category preferences
    switch (category) {
      case 'marketing':
        if (!preference.marketingEnabled) {
          return { allowed: false, reason: 'Marketing emails disabled' };
        }
        break;
      case 'alert':
        if (!preference.alertsEnabled) {
          return { allowed: false, reason: 'Alert emails disabled' };
        }
        break;
      case 'activity':
        if (!preference.activityEnabled) {
          return { allowed: false, reason: 'Activity emails disabled' };
        }
        break;
    }

    // Check type-specific preferences
    const typePreference = preference.typePreferences.get(notificationType);
    if (typePreference && !typePreference.enabled) {
      return { allowed: false, reason: `${notificationType} notifications disabled` };
    }

    // Check quiet hours
    if (this.isInQuietHours(preference)) {
      return { allowed: false, reason: 'Currently in quiet hours' };
    }

    return { allowed: true };
  }

  private static isInQuietHours(preference: NotificationPreference): boolean {
    if (!preference.quietHoursStart || !preference.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: preference.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const [currentHour, currentMinute] = userTime.split(':').map(Number);
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preference.quietHoursStart.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;

    const [endHour, endMinute] = preference.quietHoursEnd.split(':').map(Number);
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      // Same day (e.g., 09:00 to 17:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight (e.g., 22:00 to 06:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private static initializeDefaultTypePreferences(preference: NotificationPreference): void {
    const defaults = new Map<NotificationType, TypePreference>([
      [NotificationType.WELCOME, { enabled: true, channels: ['email'] }],
      [NotificationType.EMAIL_VERIFICATION, { enabled: true, channels: ['email'] }],
      [NotificationType.PASSWORD_RESET, { enabled: true, channels: ['email'] }],
      [NotificationType.ACCOUNT_DELETED, { enabled: true, channels: ['email'] }],
      [NotificationType.FILE_UPLOADED, { enabled: true, channels: ['email'] }],
      [NotificationType.EDIT_COMPLETED, { enabled: false, channels: ['email'] }],
      [NotificationType.COLLABORATION_INVITE, { enabled: true, channels: ['email'] }],
      [NotificationType.SECURITY_ALERT, { enabled: true, channels: ['email'] }],
      [NotificationType.SYSTEM_ALERT, { enabled: true, channels: ['email'] }],
      [NotificationType.ERROR_ALERT, { enabled: true, channels: ['email'] }],
      [NotificationType.WEEKLY_SUMMARY, { enabled: true, frequency: DigestFrequency.WEEKLY, channels: ['email'] }],
      [NotificationType.MONTHLY_REPORT, { enabled: true, frequency: DigestFrequency.MONTHLY, channels: ['email'] }]
    ]);

    preference.typePreferences = defaults;
  }

  static recordEmailSent(userId: string): void {
    const preference = this.preferences.get(userId);
    if (preference) {
      preference.lastEmailAt = new Date();
      preference.updatedAt = new Date();
    }
  }

  static recordBounce(userId: string, reason: string): void {
    const preference = this.preferences.get(userId);
    if (preference) {
      preference.bounceCount += 1;
      preference.updatedAt = new Date();

      // Auto-suppress after 3 bounces
      if (preference.bounceCount >= 3) {
        preference.suppressedAt = new Date();
        preference.suppressReason = `Auto-suppressed after ${preference.bounceCount} bounces: ${reason}`;
      }
    }
  }
}