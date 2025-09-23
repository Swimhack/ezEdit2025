/**
 * User Account Model with Validation Rules
 * Enterprise-grade user account management for authentication system
 */

import { z } from 'zod'
import { UserAccount, VerificationStatus, emailSchema, passwordSchema } from '../types/auth'

/**
 * User Account Entity with validation and business logic
 */
export class UserAccountModel {
  constructor(private data: UserAccount) {
    this.validate()
  }

  /**
   * Validate user account data
   */
  private validate(): void {
    const result = userAccountSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid user account data: ${result.error.message}`)
    }
  }

  /**
   * Get user account data
   */
  get account(): UserAccount {
    return { ...this.data }
  }

  /**
   * Check if account is verified
   */
  get isVerified(): boolean {
    return this.data.verification_status === 'verified'
  }

  /**
   * Check if account is locked
   */
  get isLocked(): boolean {
    return !!(
      this.data.account_locked_until &&
      new Date(this.data.account_locked_until) > new Date()
    )
  }

  /**
   * Check if MFA is enabled
   */
  get hasMfaEnabled(): boolean {
    return this.data.mfa_enabled
  }

  /**
   * Get login attempts count
   */
  get loginAttempts(): number {
    return this.data.login_attempts
  }

  /**
   * Check if account can sign in
   */
  canSignIn(): { allowed: boolean; reason?: string } {
    if (this.isLocked) {
      return {
        allowed: false,
        reason: `Account is locked until ${this.data.account_locked_until}`
      }
    }

    if (!this.isVerified) {
      return {
        allowed: false,
        reason: 'Email address must be verified before signing in'
      }
    }

    return { allowed: true }
  }

  /**
   * Increment login attempts
   */
  incrementLoginAttempts(): UserAccountModel {
    const newAttempts = this.data.login_attempts + 1
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS

    return new UserAccountModel({
      ...this.data,
      login_attempts: newAttempts,
      account_locked_until: shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
        : this.data.account_locked_until,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Reset login attempts (on successful login)
   */
  resetLoginAttempts(): UserAccountModel {
    return new UserAccountModel({
      ...this.data,
      login_attempts: 0,
      account_locked_until: null,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Update verification status
   */
  updateVerificationStatus(status: VerificationStatus): UserAccountModel {
    return new UserAccountModel({
      ...this.data,
      verification_status: status,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Enable MFA
   */
  enableMfa(secret: string): UserAccountModel {
    return new UserAccountModel({
      ...this.data,
      mfa_enabled: true,
      mfa_secret: secret,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Disable MFA
   */
  disableMfa(): UserAccountModel {
    return new UserAccountModel({
      ...this.data,
      mfa_enabled: false,
      mfa_secret: null,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Create a sanitized version for API responses (no sensitive data)
   */
  toApiResponse(): Pick<UserAccount, 'id' | 'email' | 'verification_status' | 'created_at' | 'last_login_at' | 'mfa_enabled'> {
    return {
      id: this.data.id,
      email: this.data.email,
      verification_status: this.data.verification_status,
      created_at: this.data.created_at,
      last_login_at: this.data.last_login_at,
      mfa_enabled: this.data.mfa_enabled
    }
  }

  /**
   * Create for database storage (with sensitive data)
   */
  toDatabaseRow(): Omit<UserAccount, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }
}

/**
 * Validation schema for User Account
 */
export const userAccountSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: emailSchema,
  verification_status: z.enum(['unverified', 'verified', 'pending']),
  created_at: z.string().datetime('Invalid created_at timestamp'),
  updated_at: z.string().datetime('Invalid updated_at timestamp'),
  last_login_at: z.string().datetime('Invalid last_login_at timestamp').nullable(),
  login_attempts: z.number().int().min(0).max(10),
  account_locked_until: z.string().datetime('Invalid lock timestamp').nullable(),
  mfa_enabled: z.boolean(),
  mfa_secret: z.string().nullable()
})

/**
 * Factory for creating new user accounts
 */
export class UserAccountFactory {
  /**
   * Create a new user account with default values
   */
  static create(data: {
    email: string
    id?: string
  }): UserAccountModel {
    const now = new Date().toISOString()
    const accountData: UserAccount = {
      id: data.id || crypto.randomUUID(),
      email: data.email.toLowerCase().trim(),
      verification_status: 'unverified',
      created_at: now,
      updated_at: now,
      last_login_at: null,
      login_attempts: 0,
      account_locked_until: null,
      mfa_enabled: false,
      mfa_secret: null
    }

    return new UserAccountModel(accountData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: UserAccount): UserAccountModel {
    return new UserAccountModel(dbRow)
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const result = emailSchema.safeParse(email)
    return {
      valid: result.success,
      error: result.success ? undefined : result.error.errors[0].message
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { valid: boolean; error?: string; score: number } {
    const result = passwordSchema.safeParse(password)

    // Calculate password strength score (0-100)
    let score = 0
    if (password.length >= 8) score += 25
    if (password.length >= 12) score += 10
    if (/[a-z]/.test(password)) score += 15
    if (/[A-Z]/.test(password)) score += 15
    if (/\d/.test(password)) score += 15
    if (/[^a-zA-Z\d]/.test(password)) score += 20

    return {
      valid: result.success,
      error: result.success ? undefined : result.error.errors[0].message,
      score
    }
  }
}

/**
 * Constants for account management
 */
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
export const PASSWORD_MIN_SCORE = 75 // Minimum password strength score

/**
 * Account status utilities
 */
export class AccountStatusUtils {
  /**
   * Check if account lockout has expired
   */
  static isLockoutExpired(lockedUntil: string | null): boolean {
    if (!lockedUntil) return true
    return new Date(lockedUntil) <= new Date()
  }

  /**
   * Calculate time remaining for lockout
   */
  static getLockoutTimeRemaining(lockedUntil: string | null): number {
    if (!lockedUntil) return 0
    const remaining = new Date(lockedUntil).getTime() - Date.now()
    return Math.max(0, remaining)
  }

  /**
   * Format lockout time for user display
   */
  static formatLockoutTime(lockedUntil: string | null): string {
    const remaining = this.getLockoutTimeRemaining(lockedUntil)
    if (remaining === 0) return 'Account is not locked'

    const minutes = Math.ceil(remaining / (60 * 1000))
    return `Account locked for ${minutes} more minute(s)`
  }

  /**
   * Check if verification is expired
   */
  static isVerificationExpired(createdAt: string, expiryHours: number = 24): boolean {
    const created = new Date(createdAt)
    const expiry = new Date(created.getTime() + expiryHours * 60 * 60 * 1000)
    return new Date() > expiry
  }
}

/**
 * User account validation rules for different contexts
 */
export const ValidationRules = {
  /**
   * Rules for user registration
   */
  registration: {
    email: emailSchema,
    password: passwordSchema.refine(
      (password) => UserAccountFactory.validatePassword(password).score >= PASSWORD_MIN_SCORE,
      'Password is not strong enough'
    )
  },

  /**
   * Rules for profile updates
   */
  profileUpdate: {
    email: emailSchema.optional()
  },

  /**
   * Rules for admin operations
   */
  adminUpdate: {
    verification_status: z.enum(['unverified', 'verified', 'pending']).optional(),
    mfa_enabled: z.boolean().optional(),
    login_attempts: z.number().int().min(0).max(10).optional()
  }
} as const