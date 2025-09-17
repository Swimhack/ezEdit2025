// @ts-nocheck
/**
 * Email template service with HTML/text templates and variable substitution
 * Supports template caching, variable validation, and dynamic content rendering
 */

import { EmailMessage, CreateEmailMessageData } from './models/EmailMessage';
import { supabase } from '../supabase';
import { getLogger } from '../logging/logger';

/**
 * Email template interface
 */
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  html_body: string;
  text_body: string;
  variables: TemplateVariable[];
  category: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'email';
  required: boolean;
  default_value?: any;
  description?: string;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    options?: string[];
  };
}

/**
 * Template rendering context
 */
export interface TemplateContext {
  [key: string]: any;
  user?: {
    id: string;
    name: string;
    email: string;
    [key: string]: any;
  };
  company?: {
    name: string;
    logo_url?: string;
    website?: string;
    [key: string]: any;
  };
  system?: {
    app_name: string;
    app_url: string;
    support_email: string;
    [key: string]: any;
  };
}

/**
 * Template rendering result
 */
export interface TemplateRenderResult {
  success: boolean;
  subject: string;
  html_body: string;
  text_body: string;
  errors: string[];
  warnings: string[];
  variables_used: string[];
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing_variables: string[];
  unused_variables: string[];
}

/**
 * Built-in email templates
 */
export const BuiltInTemplates: Record<string, Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>> = {
  welcome: {
    name: 'Welcome Email',
    description: 'Welcome new users to the platform',
    subject: 'Welcome to {{system.app_name}}, {{user.name}}!',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to {{system.app_name}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to {{system.app_name}}!</h1>
          </div>
          <div class="content">
            <h2>Hi {{user.name}},</h2>
            <p>Welcome to {{system.app_name}}! We're excited to have you on board.</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile setup</li>
              <li>Explore our features</li>
              <li>Join our community</li>
            </ul>
            <p style="text-align: center;">
              <a href="{{system.app_url}}/dashboard" class="button">Get Started</a>
            </p>
            <p>If you have any questions, feel free to contact us at {{system.support_email}}.</p>
            <p>Best regards,<br>The {{system.app_name}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{current_year}} {{company.name}}. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `
      Welcome to {{system.app_name}}!

      Hi {{user.name}},

      Welcome to {{system.app_name}}! We're excited to have you on board.

      Here's what you can do next:
      - Complete your profile setup
      - Explore our features
      - Join our community

      Get started: {{system.app_url}}/dashboard

      If you have any questions, feel free to contact us at {{system.support_email}}.

      Best regards,
      The {{system.app_name}} Team

      ---
      © {{current_year}} {{company.name}}. All rights reserved.
      Unsubscribe: {{unsubscribe_url}}
    `,
    variables: [
      { name: 'user.name', type: 'string', required: true, description: 'User\'s display name' },
      { name: 'user.email', type: 'email', required: true, description: 'User\'s email address' },
      { name: 'system.app_name', type: 'string', required: true, description: 'Application name' },
      { name: 'system.app_url', type: 'url', required: true, description: 'Application URL' },
      { name: 'system.support_email', type: 'email', required: true, description: 'Support email address' },
      { name: 'company.name', type: 'string', required: true, description: 'Company name' },
      { name: 'current_year', type: 'number', required: false, description: 'Current year' },
      { name: 'unsubscribe_url', type: 'url', required: false, description: 'Unsubscribe URL' }
    ],
    category: 'onboarding',
    active: true
  },

  password_reset: {
    name: 'Password Reset',
    description: 'Password reset instructions',
    subject: 'Reset your {{system.app_name}} password',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi {{user.name}},</h2>
            <p>We received a request to reset the password for your {{system.app_name}} account.</p>
            <p style="text-align: center;">
              <a href="{{reset_url}}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in {{expiry_hours}} hours for your security.
            </div>
            <p>If you didn't request this password reset, please ignore this email or contact us at {{system.support_email}} if you have concerns.</p>
            <p>Best regards,<br>The {{system.app_name}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{current_year}} {{company.name}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `
      Password Reset Request

      Hi {{user.name}},

      We received a request to reset the password for your {{system.app_name}} account.

      Reset your password: {{reset_url}}

      SECURITY NOTICE: This link will expire in {{expiry_hours}} hours for your security.

      If you didn't request this password reset, please ignore this email or contact us at {{system.support_email}} if you have concerns.

      Best regards,
      The {{system.app_name}} Team

      ---
      © {{current_year}} {{company.name}}. All rights reserved.
    `,
    variables: [
      { name: 'user.name', type: 'string', required: true, description: 'User\'s display name' },
      { name: 'reset_url', type: 'url', required: true, description: 'Password reset URL' },
      { name: 'expiry_hours', type: 'number', required: true, description: 'Hours until link expires' },
      { name: 'system.app_name', type: 'string', required: true, description: 'Application name' },
      { name: 'system.support_email', type: 'email', required: true, description: 'Support email address' },
      { name: 'company.name', type: 'string', required: true, description: 'Company name' },
      { name: 'current_year', type: 'number', required: false, description: 'Current year' }
    ],
    category: 'security',
    active: true
  },

  notification: {
    name: 'Generic Notification',
    description: 'Generic notification template for various alerts',
    subject: '{{notification.title}}',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{notification.title}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: {{notification.color}}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: {{notification.color}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{notification.title}}</h1>
          </div>
          <div class="content">
            <h2>Hi {{user.name}},</h2>
            <p>{{notification.message}}</p>
            {{#if notification.action_url}}
            <p style="text-align: center;">
              <a href="{{notification.action_url}}" class="button">{{notification.action_text}}</a>
            </p>
            {{/if}}
            <p>Best regards,<br>The {{system.app_name}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{current_year}} {{company.name}}. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `
      {{notification.title}}

      Hi {{user.name}},

      {{notification.message}}

      {{#if notification.action_url}}
      {{notification.action_text}}: {{notification.action_url}}
      {{/if}}

      Best regards,
      The {{system.app_name}} Team

      ---
      © {{current_year}} {{company.name}}. All rights reserved.
      Unsubscribe: {{unsubscribe_url}}
    `,
    variables: [
      { name: 'user.name', type: 'string', required: true, description: 'User\'s display name' },
      { name: 'notification.title', type: 'string', required: true, description: 'Notification title' },
      { name: 'notification.message', type: 'string', required: true, description: 'Notification message' },
      { name: 'notification.color', type: 'string', required: false, default_value: '#007bff', description: 'Theme color' },
      { name: 'notification.action_url', type: 'url', required: false, description: 'Action button URL' },
      { name: 'notification.action_text', type: 'string', required: false, default_value: 'View Details', description: 'Action button text' },
      { name: 'system.app_name', type: 'string', required: true, description: 'Application name' },
      { name: 'company.name', type: 'string', required: true, description: 'Company name' },
      { name: 'current_year', type: 'number', required: false, description: 'Current year' },
      { name: 'unsubscribe_url', type: 'url', required: false, description: 'Unsubscribe URL' }
    ],
    category: 'notification',
    active: true
  }
};

/**
 * Email template service
 */
export class EmailTemplateService {
  private cache = new Map<string, EmailTemplate>();
  private logger = getLogger();

  constructor(
    private cacheEnabled: boolean = true,
    private cacheTtl: number = 5 * 60 * 1000 // 5 minutes
  ) {
    this.initializeBuiltInTemplates();
  }

  /**
   * Gets a template by ID
   */
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      // Check cache first
      if (this.cacheEnabled && this.cache.has(templateId)) {
        return this.cache.get(templateId)!;
      }

      // Query database
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(`Failed to get template: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const templateData: any = data as any
      const template: EmailTemplate = {
        id: templateData.id,
        name: templateData.name,
        description: templateData.description || '',
        subject: templateData.subject,
        html_body: templateData.html_body,
        text_body: templateData.text_body,
        variables: Array.isArray(templateData.variables) ? templateData.variables : [],
        category: templateData.category || 'general',
        active: !!templateData.active,
        created_at: new Date(templateData.created_at),
        updated_at: new Date(templateData.updated_at)
      };

      // Cache template
      if (this.cacheEnabled) {
        this.cache.set(templateId, template);
        setTimeout(() => this.cache.delete(templateId), this.cacheTtl);
      }

      return template;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { templateId });
      return null;
    }
  }

  /**
   * Gets a template by name
   */
  async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', name)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get template by name: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const t: any = data as any
      return {
        id: t.id,
        name: t.name,
        description: t.description || '',
        subject: t.subject,
        html_body: t.html_body,
        text_body: t.text_body,
        variables: Array.isArray(t.variables) ? t.variables : [],
        category: t.category || 'general',
        active: !!t.active,
        created_at: new Date(t.created_at),
        updated_at: new Date(t.updated_at)
      } as EmailTemplate;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { name });
      return null;
    }
  }

  /**
   * Renders a template with the given context
   */
  async renderTemplate(
    templateId: string,
    context: TemplateContext
  ): Promise<TemplateRenderResult> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        return {
          success: false,
          subject: '',
          html_body: '',
          text_body: '',
          errors: [`Template not found: ${templateId}`],
          warnings: [],
          variables_used: []
        };
      }

      return this.renderTemplateContent(template, context);
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { templateId });
      return {
        success: false,
        subject: '',
        html_body: '',
        text_body: '',
        errors: [String(error)],
        warnings: [],
        variables_used: []
      };
    }
  }

  /**
   * Renders template content with context
   */
  renderTemplateContent(
    template: EmailTemplate,
    context: TemplateContext
  ): TemplateRenderResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const variablesUsed: string[] = [];

    try {
      // Validate required variables
      const validation = this.validateContext(template, context);
      if (!validation.valid) {
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }

      // Enhance context with system defaults
      const enhancedContext = this.enhanceContext(context);

      // Render each part
      const subject = this.renderString(template.subject, enhancedContext, variablesUsed);
      const htmlBody = this.renderString(template.html_body, enhancedContext, variablesUsed);
      const textBody = this.renderString(template.text_body, enhancedContext, variablesUsed);

      this.logger.debug('Template rendered successfully', {
        templateId: template.id,
        variablesUsed: variablesUsed.length
      });

      return {
        success: errors.length === 0,
        subject,
        html_body: htmlBody,
        text_body: textBody,
        errors,
        warnings,
        variables_used: Array.from(new Set(variablesUsed))
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        templateId: template.id
      });

      return {
        success: false,
        subject: '',
        html_body: '',
        text_body: '',
        errors: [String(error)],
        warnings,
        variables_used: variablesUsed
      };
    }
  }

  /**
   * Creates an email from template
   */
  async createEmailFromTemplate(
    templateId: string,
    context: TemplateContext,
    recipients: {
      to: string[];
      cc?: string[];
      bcc?: string[];
    }
  ): Promise<CreateEmailMessageData | null> {
    try {
      const renderResult = await this.renderTemplate(templateId, context);

      if (!renderResult.success) {
        this.logger.error('Failed to render template for email', new Error('Template render failed'), {
          templateId,
          errors: renderResult.errors
        });
        return null;
      }

      const fromAddress = context.system?.from_email || 'noreply@ezedit.co';
      const fromName = context.system?.from_name || context.company?.name || 'EZEdit';

      return {
        from: `${fromName} <${fromAddress}>`,
        to: recipients.to,
        cc: recipients.cc,
        bcc: recipients.bcc,
        subject: renderResult.subject,
        html_body: renderResult.html_body,
        text_body: renderResult.text_body,
        template_id: templateId,
        template_data: context
      };
    } catch (error) {
      this.logger.error('Email send failed', error as Error, {
        templateId
      });
      return null;
    }
  }

  /**
   * Lists all available templates
   */
  async listTemplates(category?: string): Promise<EmailTemplate[]> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('active', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list templates: ${error.message}`);
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        subject: row.subject,
        html_body: row.html_body,
        text_body: row.text_body,
        variables: Array.isArray(row.variables) ? row.variables : [],
        category: row.category || 'general',
        active: !!row.active,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
      }));
    } catch (error) {
      this.logger.error('Failed to list email templates', error as Error);
      return [];
    }
  }

  /**
   * Validates template context against template variables
   */
  validateContext(template: EmailTemplate, context: TemplateContext): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingVariables: string[] = [];
    const providedVariables = this.flattenObject(context);

    // Check required variables
    template.variables.forEach(variable => {
      if (variable.required && !(variable.name in providedVariables)) {
        errors.push(`Required variable missing: ${variable.name}`);
        missingVariables.push(variable.name);
      }

      // Type validation
      if (variable.name in providedVariables) {
        const value = providedVariables[variable.name];
        const isValid = this.validateVariableType(value, variable);
        if (!isValid) {
          errors.push(`Invalid type for variable ${variable.name}: expected ${variable.type}`);
        }
      }
    });

    // Check for unused variables
    const templateVariables = new Set(template.variables.map(v => v.name));
    const unusedVariables = Object.keys(providedVariables).filter(
      key => !templateVariables.has(key) && !key.startsWith('system.')
    );

    if (unusedVariables.length > 0) {
      warnings.push(`Unused variables: ${unusedVariables.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missing_variables: missingVariables,
      unused_variables: unusedVariables
    };
  }

  /**
   * Clears the template cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Template cache cleared');
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    size: number;
    enabled: boolean;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      enabled: this.cacheEnabled,
      ttl: this.cacheTtl
    };
  }

  /**
   * Simple string template renderer
   */
  private renderString(template: string, context: any, variablesUsed: string[]): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      variablesUsed.push(trimmedPath);

      const value = this.getNestedValue(context, trimmedPath);
      if (value === undefined || value === null) {
        return match; // Keep placeholder if value not found
      }

      return String(value);
    });
  }

  /**
   * Gets nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Flattens nested object for validation
   */
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  /**
   * Validates variable type
   */
  private validateVariableType(value: any, variable: TemplateVariable): boolean {
    switch (variable.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return true;
    }
  }

  /**
   * Enhances context with system defaults
   */
  private enhanceContext(context: TemplateContext): TemplateContext {
    const enhanced = { ...context };

    // Add system defaults if not provided
    if (!enhanced.system) {
      enhanced.system = { app_name: '', app_url: '', support_email: '' } as any;
    }

    enhanced.system = {
      app_name: 'EZEdit',
      app_url: 'https://ezedit.co',
      support_email: 'support@ezedit.co',
      from_email: 'noreply@ezedit.co',
      from_name: 'EZEdit',
      ...enhanced.system
    };

    // Add company defaults if not provided
    if (!enhanced.company) {
      enhanced.company = { name: '' } as any;
    }

    enhanced.company = {
      name: 'EZEdit',
      ...enhanced.company
    };

    // Add common variables
    enhanced.current_year = new Date().getFullYear();
    enhanced.current_date = new Date().toISOString().split('T')[0];

    return enhanced;
  }

  /**
   * Initializes built-in templates in database
   */
  private async initializeBuiltInTemplates(): Promise<void> {
    try {
      for (const [key, template] of Object.entries(BuiltInTemplates)) {
        const { data: existing } = await supabase
          .from('email_templates')
          .select('id')
          .eq('name', template.name)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('email_templates')
            .insert({
              id: key,
              ...template,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) {
            this.logger.error('Email send failed', error as Error, {
              templateName: template.name
            });
          }
        }
      }

      this.logger.info('Built-in templates initialized');
    } catch (error) {
      this.logger.error('Failed to initialize built-in templates', error as Error);
    }
  }
}

/**
 * Global template service instance
 */
let globalTemplateService: EmailTemplateService | null = null;

/**
 * Gets or creates the global template service instance
 */
export function getEmailTemplateService(): EmailTemplateService {
  if (!globalTemplateService) {
    globalTemplateService = new EmailTemplateService();
  }
  return globalTemplateService;
}

/**
 * Sets a new global template service instance
 */
export function setEmailTemplateService(service: EmailTemplateService): void {
  globalTemplateService = service;
}

export default EmailTemplateService;