import { render } from '@react-email/render';
import { resend } from './resend';
import { EmailNotification, EmailNotificationModel, NotificationType, EmailPriority, EmailCategory, DeliveryStatus } from './models/EmailNotification';
import { NotificationTemplateModel } from './models/NotificationTemplate';
import { EmailDeliveryLogModel, DeliveryEvent } from './models/EmailDeliveryLog';
import { EmailQueueModel } from './models/EmailQueue';
import React from 'react';

// Import templates
import WelcomeEmail from './templates/welcome';
import PasswordResetEmail from './templates/password-reset';
import EmailVerificationEmail from './templates/email-verification';
import AdminAlertEmail from './templates/admin-alert';

export interface SendEmailOptions {
  to: string;
  subject?: string;
  templateId: string;
  templateData: Record<string, any>;
  priority?: EmailPriority;
  category?: EmailCategory;
  userId?: string;
  correlationId?: string;
}

export interface EmailResult {
  success: boolean;
  notificationId?: string;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static templateComponents: Record<string, React.ComponentType<any>> = {
    'welcome': WelcomeEmail,
    'password-reset': PasswordResetEmail,
    'email-verification': EmailVerificationEmail,
    'admin-alert': AdminAlertEmail,
  };

  static async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // Validate template exists
      const template = NotificationTemplateModel.getById(options.templateId);
      if (!template) {
        return { success: false, error: `Template not found: ${options.templateId}` };
      }

      // Validate template data
      const validationErrors = NotificationTemplateModel.validateTemplateData(
        options.templateId,
        options.templateData
      );
      if (validationErrors.length > 0) {
        return { success: false, error: `Template validation failed: ${validationErrors.join(', ')}` };
      }

      // Create notification record
      const notification = EmailNotificationModel.create({
        recipientEmail: options.to,
        subject: options.subject || NotificationTemplateModel.renderSubject(options.templateId, options.templateData),
        templateId: options.templateId,
        templateData: options.templateData,
        type: template.type,
        priority: options.priority || template.priority,
        category: options.category || template.category,
        userId: options.userId,
        correlationId: options.correlationId,
        createdBy: 'system'
      });

      // Validate notification
      const notificationErrors = EmailNotificationModel.validate(notification);
      if (notificationErrors.length > 0) {
        return { success: false, error: `Notification validation failed: ${notificationErrors.join(', ')}` };
      }

      // Add to queue
      EmailQueueModel.create({
        notificationId: notification.id,
        priority: notification.priority,
        scheduledFor: new Date()
      });

      // Log queued event
      EmailDeliveryLogModel.create({
        notificationId: notification.id,
        userId: notification.userId,
        event: DeliveryEvent.QUEUED,
        status: 'queued',
        recipientEmail: notification.recipientEmail,
        subject: notification.subject,
        templateId: notification.templateId,
        messageId: notification.id,
        provider: 'resend',
        emailSize: 0,
        processingTime: 0
      });

      return {
        success: true,
        notificationId: notification.id,
        messageId: notification.id
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async renderTemplate(templateId: string, data: Record<string, any>): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    const template = NotificationTemplateModel.getById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const TemplateComponent = this.templateComponents[templateId];
    if (!TemplateComponent) {
      throw new Error(`Template component not found: ${templateId}`);
    }

    // Merge default data with provided data
    const templateData = { ...template.defaultData, ...data };

    // Create React element
    const element = React.createElement(TemplateComponent, templateData);

    // Render HTML and text versions
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject = NotificationTemplateModel.renderSubject(templateId, templateData);

    return { html, text, subject };
  }

  static async testTemplate(templateId: string, data: Record<string, any>): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    return this.renderTemplate(templateId, data);
  }

  static async getEmailStatus(notificationId: string): Promise<{
    id: string;
    status: string;
    recipientEmail: string;
    subject: string;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    events: Array<{
      type: string;
      timestamp: Date;
      details?: any;
    }>;
  } | null> {
    const logs = EmailDeliveryLogModel.getByNotificationId(notificationId);
    if (logs.length === 0) {
      return null;
    }

    const latestLog = logs[logs.length - 1];
    const sentLog = logs.find(log => log.event === DeliveryEvent.SENT);
    const deliveredLog = logs.find(log => log.event === DeliveryEvent.DELIVERED);
    const openedLog = logs.find(log => log.event === DeliveryEvent.OPENED);

    return {
      id: notificationId,
      status: latestLog.event,
      recipientEmail: latestLog.recipientEmail,
      subject: latestLog.subject,
      sentAt: sentLog?.timestamp,
      deliveredAt: deliveredLog?.timestamp,
      openedAt: openedLog?.timestamp,
      events: logs.map(log => ({
        type: log.event,
        timestamp: log.timestamp,
        details: log.errorDetails || log.providerResponse
      }))
    };
  }

  static getQueueStats() {
    return EmailQueueModel.getQueueStats();
  }

  static getDeliveryMetrics(start: Date, end: Date) {
    return EmailDeliveryLogModel.getMetrics(start, end);
  }

  static async processContactForm(data: any) {
    // Legacy method for existing contact form functionality
    console.log('Processing contact form via email service:', data);
    return { success: true, id: 'contact-' + Date.now() };
  }
}