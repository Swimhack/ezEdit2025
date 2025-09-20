import { NotificationType, EmailCategory, EmailPriority } from './EmailNotification';

export interface NotificationTemplate {
  // Core identification
  id: string;                      // Template identifier (e.g., 'welcome-email')
  name: string;                    // Human-readable name
  description?: string;            // Template purpose and usage

  // Template content
  subjectTemplate: string;         // Subject line with variables
  componentPath: string;           // Path to React Email component
  defaultData: Record<string, any>; // Default template variables
  requiredFields: string[];        // Required template variables

  // Configuration
  type: NotificationType;          // Associated notification type
  category: EmailCategory;         // Email category
  priority: EmailPriority;         // Default priority

  // Features
  supportsHtml: boolean;           // HTML version available
  supportsText: boolean;           // Plain text version available
  hasUnsubscribe: boolean;         // Include unsubscribe link
  hasPreheader: boolean;           // Email preheader text

  // Versioning
  version: number;                 // Template version
  isActive: boolean;               // Currently in use
  deprecatedAt?: Date;             // When template was deprecated

  // Metadata
  tags: string[];                  // Searchable tags
  locale: string;                  // Language/locale (en-US)

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export class NotificationTemplateModel {
  private static templates: Map<string, NotificationTemplate> = new Map();

  static validate(template: Partial<NotificationTemplate>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!template.id) {
      errors.push('id is required');
    } else if (!this.isKebabCase(template.id)) {
      errors.push('id must be kebab-case format');
    }

    if (!template.name) {
      errors.push('name is required');
    }

    if (!template.subjectTemplate) {
      errors.push('subjectTemplate is required');
    }

    if (!template.componentPath) {
      errors.push('componentPath is required');
    }

    if (!template.type || !Object.values(NotificationType).includes(template.type)) {
      errors.push('type must be valid NotificationType');
    }

    if (!template.category || !Object.values(EmailCategory).includes(template.category)) {
      errors.push('category must be valid EmailCategory');
    }

    if (!template.priority || ![1, 2, 3].includes(template.priority)) {
      errors.push('priority must be between 1 and 3');
    }

    if (!template.locale) {
      errors.push('locale is required');
    }

    if (!template.createdBy) {
      errors.push('createdBy is required');
    }

    return errors;
  }

  static isKebabCase(str: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
  }

  static create(data: Partial<NotificationTemplate>): NotificationTemplate {
    const now = new Date();

    const template: NotificationTemplate = {
      id: data.id!,
      name: data.name!,
      description: data.description,
      subjectTemplate: data.subjectTemplate!,
      componentPath: data.componentPath!,
      defaultData: data.defaultData || {},
      requiredFields: data.requiredFields || [],
      type: data.type!,
      category: data.category!,
      priority: data.priority!,
      supportsHtml: data.supportsHtml ?? true,
      supportsText: data.supportsText ?? true,
      hasUnsubscribe: data.hasUnsubscribe ?? false,
      hasPreheader: data.hasPreheader ?? false,
      version: data.version || 1,
      isActive: data.isActive ?? true,
      deprecatedAt: data.deprecatedAt,
      tags: data.tags || [],
      locale: data.locale || 'en-US',
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy!,
      updatedBy: data.createdBy!
    };

    this.templates.set(template.id, template);
    return template;
  }

  static getById(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  static getByType(type: NotificationType): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type && t.isActive);
  }

  static getAll(): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.isActive);
  }

  static update(id: string, data: Partial<NotificationTemplate>): NotificationTemplate | null {
    const existing = this.templates.get(id);
    if (!existing) return null;

    const updated: NotificationTemplate = {
      ...existing,
      ...data,
      id: existing.id, // Cannot change ID
      version: existing.version + 1,
      updatedAt: new Date()
    };

    this.templates.set(id, updated);
    return updated;
  }

  static deprecate(id: string, updatedBy: string): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    template.isActive = false;
    template.deprecatedAt = new Date();
    template.updatedBy = updatedBy;
    template.updatedAt = new Date();

    return true;
  }

  static renderSubject(templateId: string, data: Record<string, any>): string {
    const template = this.getById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let subject = template.subjectTemplate;

    // Replace variables in subject template
    for (const [key, value] of Object.entries({ ...template.defaultData, ...data })) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value));
    }

    return subject;
  }

  static validateTemplateData(templateId: string, data: Record<string, any>): string[] {
    const template = this.getById(templateId);
    if (!template) {
      return [`Template not found: ${templateId}`];
    }

    const errors: string[] = [];

    for (const requiredField of template.requiredFields) {
      if (!(requiredField in data) && !(requiredField in template.defaultData)) {
        errors.push(`Required field missing: ${requiredField}`);
      }
    }

    return errors;
  }

  // Initialize default templates
  static initializeDefaults(): void {
    this.create({
      id: 'welcome',
      name: 'Welcome Email',
      description: 'Welcome new users with account verification',
      subjectTemplate: 'Welcome to EzEdit, {{name}}!',
      componentPath: 'lib/email/templates/welcome.tsx',
      defaultData: { appName: 'EzEdit' },
      requiredFields: ['name', 'verifyUrl'],
      type: NotificationType.WELCOME,
      category: EmailCategory.TRANSACTIONAL,
      priority: EmailPriority.HIGH,
      hasUnsubscribe: false,
      hasPreheader: true,
      tags: ['welcome', 'onboarding'],
      createdBy: 'system'
    });

    this.create({
      id: 'password-reset',
      name: 'Password Reset',
      description: 'Password reset link for users',
      subjectTemplate: 'Reset your EzEdit password',
      componentPath: 'lib/email/templates/password-reset.tsx',
      defaultData: { appName: 'EzEdit' },
      requiredFields: ['name', 'resetUrl'],
      type: NotificationType.PASSWORD_RESET,
      category: EmailCategory.TRANSACTIONAL,
      priority: EmailPriority.HIGH,
      hasUnsubscribe: false,
      tags: ['password', 'security'],
      createdBy: 'system'
    });

    this.create({
      id: 'email-verification',
      name: 'Email Verification',
      description: 'Verify email address for new accounts',
      subjectTemplate: 'Verify your email address',
      componentPath: 'lib/email/templates/email-verification.tsx',
      defaultData: { appName: 'EzEdit' },
      requiredFields: ['name', 'verifyUrl'],
      type: NotificationType.EMAIL_VERIFICATION,
      category: EmailCategory.TRANSACTIONAL,
      priority: EmailPriority.HIGH,
      hasUnsubscribe: false,
      tags: ['verification', 'security'],
      createdBy: 'system'
    });

    this.create({
      id: 'admin-alert',
      name: 'Admin Alert',
      description: 'System alerts for administrators',
      subjectTemplate: 'System Alert: {{alertType}}',
      componentPath: 'lib/email/templates/admin-alert.tsx',
      defaultData: { appName: 'EzEdit' },
      requiredFields: ['alertType', 'message'],
      type: NotificationType.SYSTEM_ALERT,
      category: EmailCategory.ALERT,
      priority: EmailPriority.HIGH,
      hasUnsubscribe: false,
      tags: ['alert', 'admin'],
      createdBy: 'system'
    });
  }
}

// Initialize default templates
NotificationTemplateModel.initializeDefaults();