/**
 * Authentication Service with Retry Logic and Network Resilience
 * Enterprise-grade authentication service coordinating all auth operations
 */

import { createEnhancedSupabaseClient, withRetry } from '../supabase-enhanced'
import { UserAccountModel, UserAccountFactory } from '../models/user-account'
import { AuthSessionModel, AuthSessionFactory } from '../models/auth-session'
import { SecurityLogModel, SecurityLogFactory } from '../models/security-log'
import { ResetTokenModel, ResetTokenFactory } from '../models/reset-token'
import { EmailVerificationModel, EmailVerificationFactory } from '../models/email-verification'
import {
  AuthResult,
  SignupRequest,
  SigninRequest,
  UserAccount,
  AuthenticationSession,
  SecurityEventInput,
  PasswordResetToken,
  EmailVerificationToken,
  AuthError
} from '../types/auth'

/**
 * Core authentication service handling all auth operations
 */
export class AuthService {
  private supabase = createEnhancedSupabaseClient()

  /**
   * Register a new user account
   */
  async signup(request: SignupRequest, metadata: AuthRequestMetadata): Promise<AuthResult> {
    return withRetry(async () => {
      try {
        // Validate input
        const validation = this.validateSignupRequest(request)
        if (!validation.valid) {
          await this.logSecurityEvent({
            event_type: 'login_attempt',
            severity_level: 'medium',
            event_description: `Invalid signup attempt: ${validation.error}`,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, validation_error: validation.error }
          })

          return {
            success: false,
            error: {
              error: 'INVALID_REQUEST',
              message: validation.error!,
              details: { field: validation.field }
            }
          }
        }

        // Check if user already exists
        const existingUser = await this.getUserByEmail(request.email)
        if (existingUser) {
          await this.logSecurityEvent({
            event_type: 'login_attempt',
            severity_level: 'medium',
            event_description: `Signup attempt for existing email: ${request.email}`,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, reason: 'email_exists' }
          })

          return {
            success: false,
            error: {
              error: 'EMAIL_EXISTS',
              message: 'An account with this email already exists',
              details: { field: 'email' }
            }
          }
        }

        // Create user account with Supabase Auth
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
          email: request.email,
          password: request.password,
          options: {
            data: {
              email: request.email
            }
          }
        })

        if (authError) {
          await this.logSecurityEvent({
            event_type: 'login_failure',
            severity_level: 'high',
            event_description: `Supabase signup error: ${authError.message}`,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, supabase_error: authError.message }
          })

          return {
            success: false,
            error: this.mapSupabaseError(authError)
          }
        }

        if (!authData.user) {
          return {
            success: false,
            error: {
              error: 'SIGNUP_FAILED',
              message: 'Failed to create user account',
              details: {}
            }
          }
        }

        // Create user account model
        const userAccount = UserAccountFactory.create({
          id: authData.user.id,
          email: request.email
        })

        // Store user account in database
        const { error: dbError } = await this.supabase
          .from('user_accounts')
          .insert(userAccount.toDatabaseRow())

        if (dbError) {
          // Clean up Supabase user if database insert fails
          await this.supabase.auth.admin.deleteUser(authData.user.id)

          await this.logSecurityEvent({
            event_type: 'login_failure',
            severity_level: 'critical',
            event_description: `Database error during signup: ${dbError.message}`,
            user_id: authData.user.id,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, db_error: dbError.message }
          })

          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to create user profile',
              details: {}
            }
          }
        }

        // Create email verification token
        const verificationToken = EmailVerificationFactory.create({
          user_id: authData.user.id,
          email: request.email,
          ip_address: metadata.ipAddress,
          token_type: 'friendly'
        })

        // Store verification token
        const { error: verificationError } = await this.supabase
          .from('email_verifications')
          .insert(verificationToken.toDatabaseRow())

        if (verificationError) {
          console.warn('Failed to create email verification token:', verificationError)
        }

        // Log successful signup
        await this.logSecurityEvent({
          event_type: 'login_success',
          severity_level: 'low',
          event_description: `Successful user registration: ${request.email}`,
          user_id: authData.user.id,
          source_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
          additional_context: { email: request.email, verification_sent: !verificationError }
        })

        return {
          success: true,
          data: {
            user: userAccount.toApiResponse(),
            session: authData.session ? {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
              expires_at: authData.session.expires_at || 0,
              user: authData.session.user
            } : null,
            verification_required: true,
            verification_token: verificationToken.verification.verification_token
          }
        }

      } catch (error) {
        await this.logSecurityEvent({
          event_type: 'login_failure',
          severity_level: 'critical',
          event_description: `Unexpected signup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
          additional_context: { email: request.email, error_type: 'unexpected' }
        })

        return {
          success: false,
          error: {
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred during signup',
            details: {}
          }
        }
      }
    }, 'auth-signup', 3)
  }

  /**
   * Sign in an existing user
   */
  async signin(request: SigninRequest, metadata: AuthRequestMetadata): Promise<AuthResult> {
    return withRetry(async () => {
      try {
        // Validate input
        const validation = this.validateSigninRequest(request)
        if (!validation.valid) {
          await this.logSecurityEvent({
            event_type: 'login_attempt',
            severity_level: 'medium',
            event_description: `Invalid signin attempt: ${validation.error}`,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, validation_error: validation.error }
          })

          return {
            success: false,
            error: {
              error: 'INVALID_REQUEST',
              message: validation.error!,
              details: { field: validation.field }
            }
          }
        }

        // Get user account
        const userAccount = await this.getUserByEmail(request.email)
        if (!userAccount) {
          await this.logSecurityEvent({
            event_type: 'login_failure',
            severity_level: 'medium',
            event_description: `Signin attempt for non-existent email: ${request.email}`,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, reason: 'user_not_found' }
          })

          return {
            success: false,
            error: {
              error: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
              details: {}
            }
          }
        }

        // Check if account can sign in
        const accountModel = UserAccountFactory.fromDatabase(userAccount)
        const canSignIn = accountModel.canSignIn()
        if (!canSignIn.allowed) {
          await this.logSecurityEvent({
            event_type: 'login_failure',
            severity_level: 'high',
            event_description: `Signin blocked: ${canSignIn.reason}`,
            user_id: userAccount.id,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: request.email, block_reason: canSignIn.reason }
          })

          return {
            success: false,
            error: {
              error: 'ACCOUNT_BLOCKED',
              message: canSignIn.reason || 'Account is temporarily blocked',
              details: { reason: canSignIn.reason }
            }
          }
        }

        // Attempt authentication with Supabase
        const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
          email: request.email,
          password: request.password
        })

        if (authError) {
          // Increment login attempts
          const updatedAccount = accountModel.incrementLoginAttempts()
          await this.updateUserAccount(updatedAccount)

          // Check if account should be locked
          if (updatedAccount.isLocked) {
            await this.logSecurityEvent({
              event_type: 'account_locked',
              severity_level: 'high',
              event_description: `Account locked due to failed login attempts: ${request.email}`,
              user_id: userAccount.id,
              source_ip: metadata.ipAddress,
              user_agent: metadata.userAgent,
              additional_context: {
                email: request.email,
                failed_attempts: updatedAccount.loginAttempts,
                locked_until: updatedAccount.account.account_locked_until
              }
            })
          }

          await this.logSecurityEvent({
            event_type: 'login_failure',
            severity_level: 'medium',
            event_description: `Failed signin attempt: ${authError.message}`,
            user_id: userAccount.id,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: {
              email: request.email,
              supabase_error: authError.message,
              attempts_remaining: updatedAccount.account.login_attempts
            }
          })

          return {
            success: false,
            error: this.mapSupabaseError(authError)
          }
        }

        if (!authData.user || !authData.session) {
          return {
            success: false,
            error: {
              error: 'SIGNIN_FAILED',
              message: 'Authentication failed',
              details: {}
            }
          }
        }

        // Reset login attempts on successful signin
        const successAccount = accountModel.resetLoginAttempts()
        await this.updateUserAccount(successAccount)

        // Create session record
        const sessionToken = AuthSessionFactory.generateSessionToken()
        const session = AuthSessionFactory.create({
          user_id: authData.user.id,
          session_token: sessionToken,
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          duration_ms: 24 * 60 * 60 * 1000 // 24 hours
        })

        // Store session
        const { error: sessionError } = await this.supabase
          .from('auth_sessions')
          .insert(session.toDatabaseRow())

        if (sessionError) {
          console.warn('Failed to create session record:', sessionError)
        }

        // Log successful signin
        await this.logSecurityEvent({
          event_type: 'login_success',
          severity_level: 'low',
          event_description: `Successful user signin: ${request.email}`,
          user_id: authData.user.id,
          session_id: session.session.id,
          source_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
          additional_context: { email: request.email, session_created: !sessionError }
        })

        return {
          success: true,
          data: {
            user: successAccount.toApiResponse(),
            session: {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
              expires_at: authData.session.expires_at || 0,
              user: authData.session.user
            },
            verification_required: !successAccount.isVerified
          }
        }

      } catch (error) {
        await this.logSecurityEvent({
          event_type: 'login_failure',
          severity_level: 'critical',
          event_description: `Unexpected signin error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
          additional_context: { email: request.email, error_type: 'unexpected' }
        })

        return {
          success: false,
          error: {
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred during signin',
            details: {}
          }
        }
      }
    }, 'auth-signin', 3)
  }

  /**
   * Sign out a user
   */
  async signout(sessionToken: string, metadata: AuthRequestMetadata): Promise<{ success: boolean; error?: AuthError }> {
    return withRetry(async () => {
      try {
        // Get session
        const session = await this.getSessionByToken(sessionToken)
        if (session) {
          const sessionModel = AuthSessionFactory.fromDatabase(session)

          // Revoke session
          const revokedSession = sessionModel.revoke('user_signout')
          await this.updateSession(revokedSession)

          // Log signout
          await this.logSecurityEvent({
            event_type: 'session_revoked',
            severity_level: 'low',
            event_description: 'User initiated signout',
            user_id: session.user_id,
            session_id: session.id,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { reason: 'user_signout' }
          })
        }

        // Sign out from Supabase
        const { error } = await this.supabase.auth.signOut()
        if (error) {
          console.warn('Supabase signout error:', error)
        }

        return { success: true }

      } catch (error) {
        console.error('Signout error:', error)
        return {
          success: false,
          error: {
            error: 'SIGNOUT_FAILED',
            message: 'Failed to sign out',
            details: {}
          }
        }
      }
    }, 'auth-signout', 2)
  }

  /**
   * Initiate password reset
   */
  async requestPasswordReset(email: string, metadata: AuthRequestMetadata): Promise<{ success: boolean; error?: AuthError }> {
    return withRetry(async () => {
      try {
        // Validate email format
        const validation = UserAccountFactory.validateEmail(email)
        if (!validation.valid) {
          return {
            success: false,
            error: {
              error: 'INVALID_EMAIL',
              message: validation.error!,
              details: { field: 'email' }
            }
          }
        }

        // Get user (but don't reveal if they exist or not)
        const userAccount = await this.getUserByEmail(email)

        if (userAccount) {
          // Check rate limiting
          const userTokens = await this.getUserResetTokens(userAccount.id)
          const rateLimitStatus = ResetTokenFactory.getRateLimitStatus ?
            ResetTokenFactory.getRateLimitStatus(userTokens) :
            { isRateLimited: false, remainingTime: 0 }

          if (rateLimitStatus.isRateLimited) {
            await this.logSecurityEvent({
              event_type: 'password_reset_request',
              severity_level: 'medium',
              event_description: `Rate limited password reset request: ${email}`,
              user_id: userAccount.id,
              source_ip: metadata.ipAddress,
              user_agent: metadata.userAgent,
              additional_context: { email, reason: 'rate_limited', remaining_time: rateLimitStatus.remainingTime }
            })

            return {
              success: false,
              error: {
                error: 'RATE_LIMITED',
                message: rateLimitStatus.reason || 'Too many reset requests',
                details: { retryAfter: Math.ceil(rateLimitStatus.remainingTime / 1000) }
              }
            }
          }

          // Create reset token
          const resetToken = ResetTokenFactory.create({
            user_id: userAccount.id,
            email: email,
            ip_address: metadata.ipAddress
          })

          // Store reset token
          const { error: tokenError } = await this.supabase
            .from('password_reset_tokens')
            .insert(resetToken.toDatabaseRow())

          if (!tokenError) {
            // TODO: Send reset email with token.token.reset_token

            await this.logSecurityEvent({
              event_type: 'password_reset_request',
              severity_level: 'medium',
              event_description: `Password reset requested: ${email}`,
              user_id: userAccount.id,
              source_ip: metadata.ipAddress,
              user_agent: metadata.userAgent,
              additional_context: { email, token_id: resetToken.token.id }
            })
          }
        }

        // Always return success to prevent email enumeration
        return { success: true }

      } catch (error) {
        console.error('Password reset request error:', error)
        return {
          success: false,
          error: {
            error: 'INTERNAL_ERROR',
            message: 'Failed to process password reset request',
            details: {}
          }
        }
      }
    }, 'password-reset-request', 2)
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, metadata: AuthRequestMetadata): Promise<{ success: boolean; error?: AuthError }> {
    return withRetry(async () => {
      try {
        // Get verification token
        const { data: verificationData, error: queryError } = await this.supabase
          .from('email_verifications')
          .select('*')
          .eq('verification_token', token)
          .single()

        if (queryError || !verificationData) {
          await this.logSecurityEvent({
            event_type: 'email_verification',
            severity_level: 'medium',
            event_description: 'Invalid email verification token attempted',
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { token: token.substring(0, 8) + '...', reason: 'token_not_found' }
          })

          return {
            success: false,
            error: {
              error: 'TOKEN_INVALID',
              message: 'Invalid or expired verification token',
              details: { field: 'token' }
            }
          }
        }

        const verificationModel = EmailVerificationFactory.fromDatabase(verificationData)

        // Attempt verification
        const result = verificationModel.attemptVerification(token, metadata.ipAddress)
        if (!result.success) {
          // Update attempts
          if (result.model) {
            await this.updateEmailVerification(result.model)
          }

          await this.logSecurityEvent({
            event_type: 'email_verification',
            severity_level: 'medium',
            event_description: `Failed email verification: ${result.error}`,
            user_id: verificationData.user_id,
            source_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
            additional_context: { email: verificationData.email, reason: result.error }
          })

          return {
            success: false,
            error: {
              error: 'TOKEN_INVALID',
              message: result.error!,
              details: { field: 'token' }
            }
          }
        }

        // Mark as verified
        const verifiedModel = result.model!.markVerified(metadata.ipAddress)
        await this.updateEmailVerification(verifiedModel)

        // Update user account verification status
        const userAccount = await this.getUserById(verificationData.user_id)
        if (userAccount) {
          const accountModel = UserAccountFactory.fromDatabase(userAccount)
          const verifiedAccount = accountModel.updateVerificationStatus('verified')
          await this.updateUserAccount(verifiedAccount)
        }

        await this.logSecurityEvent({
          event_type: 'email_verification',
          severity_level: 'low',
          event_description: `Successful email verification: ${verificationData.email}`,
          user_id: verificationData.user_id,
          source_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
          additional_context: { email: verificationData.email }
        })

        return { success: true }

      } catch (error) {
        console.error('Email verification error:', error)
        return {
          success: false,
          error: {
            error: 'INTERNAL_ERROR',
            message: 'Failed to verify email',
            details: {}
          }
        }
      }
    }, 'email-verification', 2)
  }

  /**
   * Helper methods
   */
  private async getUserByEmail(email: string): Promise<UserAccount | null> {
    const { data, error } = await this.supabase
      .from('user_accounts')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    return error ? null : data
  }

  private async getUserById(id: string): Promise<UserAccount | null> {
    const { data, error } = await this.supabase
      .from('user_accounts')
      .select('*')
      .eq('id', id)
      .single()

    return error ? null : data
  }

  private async getSessionByToken(token: string): Promise<AuthenticationSession | null> {
    const { data, error } = await this.supabase
      .from('auth_sessions')
      .select('*')
      .eq('session_token', token)
      .single()

    return error ? null : data
  }

  private async getUserResetTokens(userId: string): Promise<PasswordResetToken[]> {
    const { data, error } = await this.supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error ? [] : data
  }

  private async updateUserAccount(accountModel: UserAccountModel): Promise<void> {
    await this.supabase
      .from('user_accounts')
      .update(accountModel.toDatabaseRow())
      .eq('id', accountModel.account.id)
  }

  private async updateSession(sessionModel: AuthSessionModel): Promise<void> {
    await this.supabase
      .from('auth_sessions')
      .update(sessionModel.toDatabaseRow())
      .eq('id', sessionModel.session.id)
  }

  private async updateEmailVerification(verificationModel: EmailVerificationModel): Promise<void> {
    await this.supabase
      .from('email_verifications')
      .update(verificationModel.toDatabaseRow())
      .eq('id', verificationModel.verification.id)
  }

  private async logSecurityEvent(event: Omit<SecurityEventInput, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const securityLog = SecurityLogFactory.create({
        event_type: event.event_type,
        severity_level: event.severity_level,
        event_description: event.event_description,
        user_id: event.user_id,
        session_id: event.session_id,
        source_ip: event.source_ip,
        user_agent: event.user_agent,
        additional_context: event.additional_context
      })

      await this.supabase
        .from('security_logs')
        .insert(securityLog.toDatabaseRow())

    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  private validateSignupRequest(request: SignupRequest): ValidationResult {
    if (!request.email) {
      return { valid: false, error: 'Email is required', field: 'email' }
    }

    if (!request.password) {
      return { valid: false, error: 'Password is required', field: 'password' }
    }

    const emailValidation = UserAccountFactory.validateEmail(request.email)
    if (!emailValidation.valid) {
      return { valid: false, error: emailValidation.error!, field: 'email' }
    }

    const passwordValidation = UserAccountFactory.validatePassword(request.password)
    if (!passwordValidation.valid) {
      return { valid: false, error: passwordValidation.error!, field: 'password' }
    }

    return { valid: true }
  }

  private validateSigninRequest(request: SigninRequest): ValidationResult {
    if (!request.email) {
      return { valid: false, error: 'Email is required', field: 'email' }
    }

    if (!request.password) {
      return { valid: false, error: 'Password is required', field: 'password' }
    }

    const emailValidation = UserAccountFactory.validateEmail(request.email)
    if (!emailValidation.valid) {
      return { valid: false, error: emailValidation.error!, field: 'email' }
    }

    return { valid: true }
  }

  private mapSupabaseError(error: any): AuthError {
    switch (error.message) {
      case 'Invalid login credentials':
        return {
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          details: {}
        }
      case 'Email not confirmed':
        return {
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before signing in',
          details: {}
        }
      case 'Too many requests':
        return {
          error: 'RATE_LIMITED',
          message: 'Too many login attempts. Please try again later',
          details: { retryAfter: 300 }
        }
      default:
        return {
          error: 'AUTH_ERROR',
          message: error.message || 'Authentication failed',
          details: {}
        }
    }
  }
}

/**
 * Type definitions
 */
export interface AuthRequestMetadata {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

interface ValidationResult {
  valid: boolean
  error?: string
  field?: string
}

/**
 * Create singleton auth service instance
 */
export const authService = new AuthService()
