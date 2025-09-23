/**
 * Email Service Integration for Verification and Password Reset
 * Enterprise-grade email service for authentication system
 */

import { withRetry } from '../supabase-enhanced'
import { EmailVerificationModel } from '../models/email-verification'
import { ResetTokenModel } from '../models/reset-token'
import { SecurityLogFactory } from '../models/security-log'

/**
 * Email service for sending authentication-related emails
 */
export class EmailService {
  private apiKey: string
  private fromAddress: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || ''
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@ezedit.co'
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ezeditapp.fly.dev'

    if (!this.apiKey) {
      console.warn('RESEND_API_KEY not configured - email functionality disabled')
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    verification: EmailVerificationModel,
    options: EmailOptions = {}
  ): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    return withRetry(async () => {
      try {
        const verificationData = verification.verification
        const verificationUrl = this.buildVerificationUrl(verificationData.verification_token, verificationData.email)

        const emailContent = this.buildVerificationEmailContent({
          email: verificationData.email,
          verificationUrl,
          token: verificationData.verification_token,
          expiresAt: verificationData.expires_at
        })

        const result = await this.sendEmail({
          to: verificationData.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          template: 'email-verification',
          metadata: {
            user_id: verificationData.user_id,
            verification_id: verificationData.id,
            type: 'email_verification'
          }
        })

        if (result.success) {
          await this.logEmailEvent({
            event_type: 'email_verification',
            severity_level: 'low',
            event_description: `Verification email sent to ${verificationData.email}`,
            user_id: verificationData.user_id,
            additional_context: {
              email: verificationData.email,
              verification_id: verificationData.id,
              message_id: result.messageId
            }
          })
        }

        return result

      } catch (error) {
        await this.logEmailEvent({
          event_type: 'email_verification',
          severity_level: 'high',
          event_description: `Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          user_id: verification.verification.user_id,
          additional_context: {
            email: verification.verification.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })

        return {
          success: false,
          error: 'Failed to send verification email'
        }
      }
    }, 'send-verification-email', 3)
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    resetToken: ResetTokenModel,
    options: EmailOptions = {}
  ): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    return withRetry(async () => {
      try {
        const tokenData = resetToken.token
        const resetUrl = this.buildPasswordResetUrl(tokenData.reset_token)

        const emailContent = this.buildPasswordResetEmailContent({
          resetUrl,
          token: tokenData.reset_token,
          expiresAt: tokenData.expires_at,
          attemptsRemaining: tokenData.attempts_remaining
        })

        // Get user email from token context (would need to be passed in real implementation)
        const userEmail = await this.getUserEmailById(tokenData.user_id)
        if (!userEmail) {
          return {
            success: false,
            error: 'User email not found'
          }
        }

        const result = await this.sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          template: 'password-reset',
          metadata: {
            user_id: tokenData.user_id,
            reset_token_id: tokenData.id,
            type: 'password_reset'
          }
        })

        if (result.success) {
          await this.logEmailEvent({
            event_type: 'password_reset_request',
            severity_level: 'medium',
            event_description: `Password reset email sent to ${userEmail}`,
            user_id: tokenData.user_id,
            additional_context: {
              email: userEmail,
              reset_token_id: tokenData.id,
              message_id: result.messageId
            }
          })
        }

        return result

      } catch (error) {
        await this.logEmailEvent({
          event_type: 'password_reset_request',
          severity_level: 'high',
          event_description: `Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          user_id: resetToken.token.user_id,
          additional_context: {
            reset_token_id: resetToken.token.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })

        return {
          success: false,
          error: 'Failed to send password reset email'
        }
      }
    }, 'send-password-reset-email', 3)
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(
    userEmail: string,
    userId: string,
    options: EmailOptions = {}
  ): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    return withRetry(async () => {
      try {
        const emailContent = this.buildWelcomeEmailContent({
          email: userEmail,
          dashboardUrl: `${this.baseUrl}/dashboard`,
          supportUrl: `${this.baseUrl}/support`
        })

        const result = await this.sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          template: 'welcome',
          metadata: {
            user_id: userId,
            type: 'welcome'
          }
        })

        if (result.success) {
          await this.logEmailEvent({
            event_type: 'email_verification',
            severity_level: 'low',
            event_description: `Welcome email sent to ${userEmail}`,
            user_id: userId,
            additional_context: {
              email: userEmail,
              message_id: result.messageId
            }
          })
        }

        return result

      } catch (error) {
        await this.logEmailEvent({
          event_type: 'email_verification',
          severity_level: 'medium',
          event_description: `Failed to send welcome email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          user_id: userId,
          additional_context: {
            email: userEmail,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })

        return {
          success: false,
          error: 'Failed to send welcome email'
        }
      }
    }, 'send-welcome-email', 2)
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(
    userEmail: string,
    userId: string,
    alertType: SecurityAlertType,
    details: SecurityAlertDetails
  ): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    return withRetry(async () => {
      try {
        const emailContent = this.buildSecurityAlertEmailContent({
          alertType,
          details,
          email: userEmail,
          securityUrl: `${this.baseUrl}/account/security`
        })

        const result = await this.sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          template: 'security-alert',
          priority: 'high',
          metadata: {
            user_id: userId,
            type: 'security_alert',
            alert_type: alertType
          }
        })

        if (result.success) {
          await this.logEmailEvent({
            event_type: 'suspicious_activity',
            severity_level: 'high',
            event_description: `Security alert email sent to ${userEmail}: ${alertType}`,
            user_id: userId,
            additional_context: {
              email: userEmail,
              alert_type: alertType,
              alert_details: details,
              message_id: result.messageId
            }
          })
        }

        return result

      } catch (error) {
        await this.logEmailEvent({
          event_type: 'suspicious_activity',
          severity_level: 'critical',
          event_description: `Failed to send security alert email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          user_id: userId,
          additional_context: {
            email: userEmail,
            alert_type: alertType,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })

        return {
          success: false,
          error: 'Failed to send security alert email'
        }
      }
    }, 'send-security-alert-email', 3)
  }

  /**
   * Core email sending method using Resend API
   */
  private async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
          tags: [
            { name: 'template', value: params.template },
            { name: 'type', value: params.metadata?.type || 'unknown' }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Resend API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.id
      }

    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Build verification URL
   */
  private buildVerificationUrl(token: string, email: string): string {
    const url = new URL('/auth/verify-email', this.baseUrl)
    url.searchParams.set('token', token)
    url.searchParams.set('email', email)
    return url.toString()
  }

  /**
   * Build password reset URL
   */
  private buildPasswordResetUrl(token: string): string {
    const url = new URL('/auth/reset-password/confirm', this.baseUrl)
    url.searchParams.set('token', token)
    return url.toString()
  }

  /**
   * Build email verification email content
   */
  private buildVerificationEmailContent(params: {
    email: string
    verificationUrl: string
    token: string
    expiresAt: string
  }): EmailContent {
    const expiresDate = new Date(params.expiresAt)
    const expiresHours = Math.round((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60))

    const subject = 'Verify your EzEdit account'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">EzEdit</h1>
          </div>

          <h2>Verify your email address</h2>

          <p>Hello,</p>

          <p>Thank you for signing up for EzEdit! To complete your registration, please verify your email address by clicking the button below:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.verificationUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>

          <p>If the button doesn't work, you can also verify your email by entering this code on the verification page:</p>

          <div style="text-align: center; margin: 20px 0;">
            <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px; padding: 10px; background-color: #f3f4f6; border-radius: 5px;">${params.token}</code>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${params.verificationUrl}</p>

          <p><strong>This verification link will expire in ${expiresHours} hours.</strong></p>

          <p>If you didn't create an account with EzEdit, you can safely ignore this email.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="font-size: 14px; color: #6b7280;">
            This email was sent to ${params.email}. If you have any questions, please contact our support team.
          </p>
        </body>
      </html>
    `

    const text = `
      Verify your EzEdit account

      Hello,

      Thank you for signing up for EzEdit! To complete your registration, please verify your email address.

      Verification code: ${params.token}

      Or visit this link: ${params.verificationUrl}

      This verification link will expire in ${expiresHours} hours.

      If you didn't create an account with EzEdit, you can safely ignore this email.

      This email was sent to ${params.email}.
    `

    return { subject, html, text }
  }

  /**
   * Build password reset email content
   */
  private buildPasswordResetEmailContent(params: {
    resetUrl: string
    token: string
    expiresAt: string
    attemptsRemaining: number
  }): EmailContent {
    const expiresDate = new Date(params.expiresAt)
    const expiresHours = Math.round((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60))

    const subject = 'Reset your EzEdit password'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">EzEdit</h1>
          </div>

          <h2>Reset your password</h2>

          <p>Hello,</p>

          <p>We received a request to reset the password for your EzEdit account. Click the button below to choose a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.resetUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${params.resetUrl}</p>

          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">⚠️ Security Notice:</p>
            <ul style="margin: 10px 0;">
              <li>This reset link will expire in ${expiresHours} hours</li>
              <li>You have ${params.attemptsRemaining} attempts remaining</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
          </div>

          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="font-size: 14px; color: #6b7280;">
            For security reasons, this email was automatically generated. If you have any questions, please contact our support team.
          </p>
        </body>
      </html>
    `

    const text = `
      Reset your EzEdit password

      Hello,

      We received a request to reset the password for your EzEdit account.

      Reset your password by visiting this link: ${params.resetUrl}

      Security Notice:
      - This reset link will expire in ${expiresHours} hours
      - You have ${params.attemptsRemaining} attempts remaining
      - If you didn't request this reset, please ignore this email

      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    `

    return { subject, html, text }
  }

  /**
   * Build welcome email content
   */
  private buildWelcomeEmailContent(params: {
    email: string
    dashboardUrl: string
    supportUrl: string
  }): EmailContent {
    const subject = 'Welcome to EzEdit!'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to EzEdit</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">EzEdit</h1>
          </div>

          <h2>Welcome to EzEdit! 🎉</h2>

          <p>Hello,</p>

          <p>Your email has been successfully verified and your EzEdit account is now active! We're excited to have you join our community of content creators and website managers.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.dashboardUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>

          <h3>What's next?</h3>
          <ul>
            <li>Connect your first website or FTP server</li>
            <li>Start editing files with our powerful editor</li>
            <li>Explore our contract comparison tools</li>
            <li>Set up your profile and preferences</li>
          </ul>

          <h3>Need help getting started?</h3>
          <p>Our support team is here to help you make the most of EzEdit:</p>
          <ul>
            <li><a href="${params.supportUrl}" style="color: #2563eb;">Visit our Help Center</a></li>
            <li>Check out our quick start guide</li>
            <li>Watch our tutorial videos</li>
          </ul>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="font-size: 14px; color: #6b7280;">
            This email was sent to ${params.email}. If you have any questions, please don't hesitate to contact our support team.
          </p>
        </body>
      </html>
    `

    const text = `
      Welcome to EzEdit!

      Hello,

      Your email has been successfully verified and your EzEdit account is now active! We're excited to have you join our community of content creators and website managers.

      Go to your dashboard: ${params.dashboardUrl}

      What's next?
      - Connect your first website or FTP server
      - Start editing files with our powerful editor
      - Explore our contract comparison tools
      - Set up your profile and preferences

      Need help getting started?
      Visit our Help Center: ${params.supportUrl}

      This email was sent to ${params.email}.
    `

    return { subject, html, text }
  }

  /**
   * Build security alert email content
   */
  private buildSecurityAlertEmailContent(params: {
    alertType: SecurityAlertType
    details: SecurityAlertDetails
    email: string
    securityUrl: string
  }): EmailContent {
    const alertMessages = {
      account_locked: 'Your account has been temporarily locked',
      suspicious_login: 'Suspicious login attempt detected',
      password_changed: 'Your password has been changed',
      mfa_disabled: 'Two-factor authentication has been disabled',
      multiple_failed_logins: 'Multiple failed login attempts detected'
    }

    const subject = `Security Alert: ${alertMessages[params.alertType]}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">EzEdit</h1>
          </div>

          <div style="background-color: #fef2f2; border: 1px solid #dc2626; border-radius: 5px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #dc2626; margin-top: 0;">🚨 Security Alert</h2>
            <p style="font-weight: bold; margin-bottom: 0;">${alertMessages[params.alertType]}</p>
          </div>

          <h3>Alert Details:</h3>
          <ul>
            <li><strong>Time:</strong> ${params.details.timestamp}</li>
            <li><strong>IP Address:</strong> ${params.details.ipAddress || 'Unknown'}</li>
            <li><strong>Location:</strong> ${params.details.location || 'Unknown'}</li>
            <li><strong>Device:</strong> ${params.details.userAgent || 'Unknown'}</li>
          </ul>

          <div style="background-color: #f3f4f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h4>What should you do?</h4>
            <ul>
              <li>If this was you, no action is needed</li>
              <li>If this wasn't you, change your password immediately</li>
              <li>Review your account security settings</li>
              <li>Enable two-factor authentication if not already active</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.securityUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Review Security Settings
            </a>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="font-size: 14px; color: #6b7280;">
            This security alert was sent to ${params.email}. If you have concerns about your account security, please contact our support team immediately.
          </p>
        </body>
      </html>
    `

    const text = `
      Security Alert: ${alertMessages[params.alertType]}

      SECURITY ALERT for your EzEdit account

      ${alertMessages[params.alertType]}

      Alert Details:
      - Time: ${params.details.timestamp}
      - IP Address: ${params.details.ipAddress || 'Unknown'}
      - Location: ${params.details.location || 'Unknown'}
      - Device: ${params.details.userAgent || 'Unknown'}

      What should you do?
      - If this was you, no action is needed
      - If this wasn't you, change your password immediately
      - Review your account security settings
      - Enable two-factor authentication if not already active

      Review your security settings: ${params.securityUrl}

      This security alert was sent to ${params.email}.
    `

    return { subject, html, text }
  }

  /**
   * Get user email by ID (would typically query database)
   */
  private async getUserEmailById(userId: string): Promise<string | null> {
    // This would typically query the database
    // For now, return null to indicate email lookup needed
    return null
  }

  /**
   * Log email-related security events
   */
  private async logEmailEvent(event: {
    event_type: string
    severity_level: string
    event_description: string
    user_id?: string
    additional_context: any
  }): Promise<void> {
    try {
      // This would typically use the security logging service
      console.log('Email event:', event)
    } catch (error) {
      console.error('Failed to log email event:', error)
    }
  }
}

/**
 * Type definitions
 */
export interface EmailOptions {
  priority?: 'low' | 'normal' | 'high'
  template?: string
  metadata?: Record<string, any>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
  template: string
  priority?: 'low' | 'normal' | 'high'
  metadata?: Record<string, any>
}

interface EmailContent {
  subject: string
  html: string
  text: string
}

export type SecurityAlertType =
  | 'account_locked'
  | 'suspicious_login'
  | 'password_changed'
  | 'mfa_disabled'
  | 'multiple_failed_logins'

export interface SecurityAlertDetails {
  timestamp: string
  ipAddress?: string
  location?: string
  userAgent?: string
  additionalInfo?: Record<string, any>
}

/**
 * Create singleton email service instance
 */
export const emailService = new EmailService()