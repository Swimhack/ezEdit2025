/**
 * Email Verification Model with Token Management
 * Enterprise-grade email verification token management for authentication system
 */

import { z } from 'zod'
import { EmailVerificationToken, EmailVerificationStatus } from '../types/auth'

/**
 * Constants for email verification management
 */
export const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
export const VERIFICATION_MAX_ATTEMPTS = 5
export const MAX_VERIFICATIONS_PER_USER = 3
export const MAX_VERIFICATIONS_PER_HOUR = 5
export const MAX_RESEND_ATTEMPTS = 3
export const RESEND_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
export const VERIFICATION_RATE_LIMIT_MS = 15 * 60 * 1000 // 15 minutes
export const VERIFICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export const CLEANUP_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours






/**
 * Email Verification Token Entity with expiration and security tracking
 */
export class EmailVerificationModel {
  constructor(private data: EmailVerificationToken) {
    this.validate()
  }

  /**
   * Validate email verification data
   */
  private validate(): void {
    const result = emailVerificationSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid email verification data: ${result.error.message}`)
    }
  }

  /**
   * Get email verification data
   */
  get verification(): EmailVerificationToken {
    return { ...this.data }
  }

  /**
   * Check if token is valid and can be used
   */
  get isValid(): boolean {
    return this.data.status === 'pending' && !this.isExpired && this.data.attempts_remaining > 0
  }

  /**
   * Check if token is expired
   */
  get isExpired(): boolean {
    return new Date(this.data.expires_at) <= new Date()
  }

  /**
   * Check if verification is completed
   */
  get isVerified(): boolean {
    return this.data.status === 'verified'
  }

  /**
   * Check if verification failed
   */
  get isFailed(): boolean {
    return this.data.status === 'failed'
  }

  /**
   * Check if verification was revoked
   */
  get isRevoked(): boolean {
    return this.data.status === 'revoked'
  }

  /**
   * Check if token should be cleaned up
   */
  get shouldCleanup(): boolean {
    return this.isExpired || this.isFailed || this.isRevoked ||
           (this.isVerified && this.getTimeSinceVerification() > VERIFICATION_RETENTION_MS)
  }

  /**
   * Get time until expiration in milliseconds
   */
  get timeUntilExpiration(): number {
    return Math.max(0, new Date(this.data.expires_at).getTime() - Date.now())
  }

  /**
   * Get token age in milliseconds
   */
  get tokenAge(): number {
    return Date.now() - new Date(this.data.created_at).getTime()
  }

  /**
   * Check if token was created recently (within last hour)
   */
  get isRecent(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return new Date(this.data.created_at) > oneHourAgo
  }

  /**
   * Get time since verification in milliseconds (0 if not verified)
   */
  getTimeSinceVerification(): number {
    if (!this.data.verified_at) return 0
    return Date.now() - new Date(this.data.verified_at).getTime()
  }

  /**
   * Get security score based on usage pattern
   */
  get securityScore(): number {
    let score = 100

    // Reduce score for multiple attempts
    const attemptsPenalty = (VERIFICATION_MAX_ATTEMPTS - this.data.attempts_remaining) * 15
    score -= attemptsPenalty

    // Reduce score if token is old
    const ageHours = this.tokenAge / (60 * 60 * 1000)
    if (ageHours > 12) {
      score -= 20
    }

    // Reduce score if verified from different IP
    if (this.data.verified_ip && this.data.created_ip !== this.data.verified_ip) {
      score -= 10
    }

    // Reduce score if rate limited
    if (this.data.rate_limited_until) {
      score -= 25
    }

    // Increase score if verified quickly
    if (this.isVerified && this.getTimeSinceVerification() < 60 * 60 * 1000) {
      score += 10
    }

    return Math.max(0, score)
  }

  /**
   * Attempt to use the verification token
   */
  attemptVerification(providedToken: string, ipAddress?: string): {
    success: boolean
    model?: EmailVerificationModel
    error?: string
  } {
    const validation = this.validateToken(providedToken)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    const now = new Date().toISOString()

    const updatedModel = new EmailVerificationModel({
      ...this.data,
      attempts_remaining: this.data.attempts_remaining - 1,
      last_attempted_at: now,
      verified_ip: ipAddress || this.data.verified_ip,
      updated_at: now
    })

    return {
      success: true,
      model: updatedModel
    }
  }

  /**
   * Mark verification as successful
   */
  markVerified(ipAddress?: string): EmailVerificationModel {
    const now = new Date().toISOString()

    return new EmailVerificationModel({
      ...this.data,
      status: 'verified',
      verified_at: now,
      verified_ip: ipAddress || this.data.verified_ip,
      updated_at: now
    })
  }

  /**
   * Mark verification as failed
   */
  markFailed(reason: string = 'verification_failed'): EmailVerificationModel {
    const now = new Date().toISOString()

    return new EmailVerificationModel({
      ...this.data,
      status: 'failed',
      failed_at: now,
      failure_reason: reason,
      updated_at: now
    })
  }

  /**
   * Revoke the verification token
   */
  revoke(reason: string = 'manual_revocation'): EmailVerificationModel {
    const now = new Date().toISOString()

    return new EmailVerificationModel({
      ...this.data,
      status: 'revoked',
      revoked_at: now,
      revocation_reason: reason,
      updated_at: now
    })
  }

  /**
   * Apply rate limiting
   */
  applyRateLimit(durationMs: number = VERIFICATION_RATE_LIMIT_MS): EmailVerificationModel {
    const rateLimitUntil = new Date(Date.now() + durationMs).toISOString()

    return new EmailVerificationModel({
      ...this.data,
      rate_limited_until: rateLimitUntil,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Check if currently rate limited
   */
  isRateLimited(): boolean {
    if (!this.data.rate_limited_until) return false
    return new Date(this.data.rate_limited_until) > new Date()
  }

  /**
   * Get remaining rate limit time in milliseconds
   */
  getRateLimitRemaining(): number {
    if (!this.data.rate_limited_until) return 0
    return Math.max(0, new Date(this.data.rate_limited_until).getTime() - Date.now())
  }

  /**
   * Resend verification (create new token)
   */
  resend(newToken: string, extendExpiry: boolean = true): EmailVerificationModel {
    const now = new Date().toISOString()
    const expiresAt = extendExpiry
      ? new Date(Date.now() + VERIFICATION_EXPIRY_MS).toISOString()
      : this.data.expires_at

    return new EmailVerificationModel({
      ...this.data,
      verification_token: newToken,
      expires_at: expiresAt,
      attempts_remaining: VERIFICATION_MAX_ATTEMPTS,
      resent_count: (this.data.resent_count || 0) + 1,
      last_resent_at: now,
      updated_at: now
    })
  }

  /**
   * Validate token against provided token string
   */
  validateToken(providedToken: string): { valid: boolean; error?: string } {
    if (!providedToken) {
      return { valid: false, error: 'Verification token is required' }
    }

    if (providedToken !== this.data.verification_token) {
      return { valid: false, error: 'Invalid verification token' }
    }

    if (!this.isValid) {
      if (this.isExpired) {
        return { valid: false, error: 'Verification token has expired' }
      }
      if (this.isVerified) {
        return { valid: false, error: 'Email is already verified' }
      }
      if (this.isFailed || this.isRevoked) {
        return { valid: false, error: 'Verification token is no longer valid' }
      }
      if (this.data.attempts_remaining <= 0) {
        return { valid: false, error: 'Too many verification attempts' }
      }
    }

    if (this.isRateLimited()) {
      const remainingMs = this.getRateLimitRemaining()
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000))
      return { valid: false, error: `Rate limited. Try again in ${remainingMinutes} minute(s)` }
    }

    return { valid: true }
  }

  /**
   * Check if resend is allowed
   */
  canResend(): { allowed: boolean; error?: string; waitTime?: number } {
    if (this.isVerified) {
      return { allowed: false, error: 'Email is already verified' }
    }

    if (this.isFailed || this.isRevoked) {
      return { allowed: false, error: 'Verification is no longer active' }
    }

    const resentCount = this.data.resent_count || 0
    if (resentCount >= MAX_RESEND_ATTEMPTS) {
      return { allowed: false, error: `Maximum resend attempts reached (${MAX_RESEND_ATTEMPTS})` }
    }

    if (this.data.last_resent_at) {
      const timeSinceResend = Date.now() - new Date(this.data.last_resent_at).getTime()
      if (timeSinceResend < RESEND_COOLDOWN_MS) {
        const waitTime = RESEND_COOLDOWN_MS - timeSinceResend
        const waitMinutes = Math.ceil(waitTime / (60 * 1000))
        return {
          allowed: false,
          error: `Please wait ${waitMinutes} minute(s) before requesting another verification email`,
          waitTime
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Create sanitized version for API responses
   */
  toApiResponse(): EmailVerificationApiResponse {
    return {
      id: this.data.id,
      user_id: this.data.user_id,
      email: this.data.email,
      status: this.data.status,
      created_at: this.data.created_at,
      expires_at: this.data.expires_at,
      attempts_remaining: this.data.attempts_remaining,
      resent_count: this.data.resent_count || 0,
      is_valid: this.isValid,
      is_expired: this.isExpired,
      is_verified: this.isVerified,
      time_until_expiration: this.timeUntilExpiration,
      can_resend: this.canResend().allowed,
      is_rate_limited: this.isRateLimited(),
      rate_limit_remaining: this.getRateLimitRemaining(),
      security_score: this.securityScore
    }
  }

  /**
   * Create detailed version for internal use
   */
  toDetailedResponse(): EmailVerificationDetailedResponse {
    const apiResponse = this.toApiResponse()

    return {
      ...apiResponse,
      verification_token: this.data.verification_token,
      created_ip: this.data.created_ip,
      verified_ip: this.data.verified_ip,
      last_attempted_at: this.data.last_attempted_at,
      verified_at: this.data.verified_at,
      failed_at: this.data.failed_at,
      failure_reason: this.data.failure_reason,
      revoked_at: this.data.revoked_at,
      revocation_reason: this.data.revocation_reason,
      last_resent_at: this.data.last_resent_at,
      rate_limited_until: this.data.rate_limited_until,
      updated_at: this.data.updated_at
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): Omit<EmailVerificationToken, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }
}

/**
 * Validation schema for Email Verification Token
 */
export const emailVerificationSchema = z.object({
  id: z.string().uuid('Invalid verification ID format'),
  user_id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email format'),
  verification_token: z.string().min(6, 'Verification token too short'),
  status: z.enum(['pending', 'verified', 'failed', 'expired', 'revoked']),
  created_at: z.string().datetime('Invalid created_at timestamp'),
  updated_at: z.string().datetime('Invalid updated_at timestamp'),
  expires_at: z.string().datetime('Invalid expires_at timestamp'),
  attempts_remaining: z.number().int().min(0).max(VERIFICATION_MAX_ATTEMPTS),
  created_ip: z.string().ip('Invalid IP address').nullable(),
  verified_ip: z.string().ip('Invalid IP address').nullable(),
  last_attempted_at: z.string().datetime('Invalid last_attempted_at timestamp').nullable(),
  verified_at: z.string().datetime('Invalid verified_at timestamp').nullable(),
  failed_at: z.string().datetime('Invalid failed_at timestamp').nullable(),
  failure_reason: z.string().max(255).nullable(),
  revoked_at: z.string().datetime('Invalid revoked_at timestamp').nullable(),
  revocation_reason: z.string().max(255).nullable(),
  resent_count: z.number().int().min(0).max(MAX_RESEND_ATTEMPTS).nullable(),
  last_resent_at: z.string().datetime('Invalid last_resent_at timestamp').nullable(),
  rate_limited_until: z.string().datetime('Invalid rate_limited_until timestamp').nullable()
})

/**
 * Factory for creating and managing email verification tokens
 */
export class EmailVerificationFactory {
  /**
   * Create a new email verification token
   */
  static create(data: {
    user_id: string
    email: string
    ip_address?: string
    duration_ms?: number
    token_type?: 'secure' | 'friendly'
  }): EmailVerificationModel {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + (data.duration_ms || VERIFICATION_EXPIRY_MS)).toISOString()

    const verificationData: EmailVerificationToken = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      email: data.email.toLowerCase().trim(),
      verification_token: data.token_type === 'friendly'
        ? this.generateFriendlyToken()
        : this.generateSecureToken(),
      status: 'pending',
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
      attempts_remaining: VERIFICATION_MAX_ATTEMPTS,
      created_ip: data.ip_address || null,
      verified_ip: null,
      last_attempted_at: null,
      verified_at: null,
      failed_at: null,
      failure_reason: null,
      revoked_at: null,
      revocation_reason: null,
      resent_count: 0,
      last_resent_at: null,
      rate_limited_until: null
    }

    return new EmailVerificationModel(verificationData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: EmailVerificationToken): EmailVerificationModel {
    return new EmailVerificationModel(dbRow)
  }

  /**
   * Generate a cryptographically secure token
   */
  static generateSecureToken(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Generate a user-friendly token (6-digit numeric)
   */
  static generateFriendlyToken(): string {
    const bytes = new Uint8Array(3)
    crypto.getRandomValues(bytes)
    const number = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]
    return (number % 900000 + 100000).toString() // 6-digit number starting from 100000
  }

  /**
   * Generate email verification URL
   */
  static generateVerificationUrl(
    baseUrl: string,
    token: string,
    email?: string
  ): string {
    const url = new URL('/auth/verify-email', baseUrl)
    url.searchParams.set('token', token)
    if (email) {
      url.searchParams.set('email', email)
    }
    return url.toString()
  }

  /**
   * Validate token format
   */
  static validateTokenFormat(token: string): { valid: boolean; error?: string } {
    if (!token) {
      return { valid: false, error: 'Verification token is required' }
    }

    // Check for secure token format (64 hex characters)
    if (/^[a-f0-9]{64}$/.test(token)) {
      return { valid: true }
    }

    // Check for friendly token format (6 digits)
    if (/^[0-9]{6}$/.test(token)) {
      return { valid: true }
    }

    return { valid: false, error: 'Invalid verification token format' }
  }
}

/**
 * Email verification management utilities
 */
export class EmailVerificationUtils {
  /**
   * Clean up expired or completed verifications
   */
  static getVerificationsForCleanup(verifications: EmailVerificationToken[]): string[] {
    return verifications
      .filter(verification => {
        const verificationModel = new EmailVerificationModel(verification)
        return verificationModel.shouldCleanup
      })
      .map(verification => verification.id)
  }

  /**
   * Check if user has too many pending verifications
   */
  static checkVerificationLimits(userVerifications: EmailVerificationToken[]): {
    withinLimits: boolean
    pendingCount: number
    error?: string
  } {
    const pendingVerifications = userVerifications.filter(verification => {
      const verificationModel = new EmailVerificationModel(verification)
      return verificationModel.isValid
    })

    const withinLimits = pendingVerifications.length < MAX_VERIFICATIONS_PER_USER

    return {
      withinLimits,
      pendingCount: pendingVerifications.length,
      error: withinLimits ? undefined :
        `User has ${pendingVerifications.length} pending verifications (max: ${MAX_VERIFICATIONS_PER_USER})`
    }
  }

  /**
   * Get rate limiting status for email address
   */
  static getEmailRateLimitStatus(emailVerifications: EmailVerificationToken[]): {
    isRateLimited: boolean
    remainingTime: number
    reason?: string
  } {
    const recentVerifications = emailVerifications.filter(verification => {
      const verificationModel = new EmailVerificationModel(verification)
      return verificationModel.isRecent
    })

    if (recentVerifications.length >= MAX_VERIFICATIONS_PER_HOUR) {
      const oldestRecent = recentVerifications.reduce((oldest, verification) =>
        new Date(verification.created_at) < new Date(oldest.created_at) ? verification : oldest
      )

      const remainingTime = 60 * 60 * 1000 - (Date.now() - new Date(oldestRecent.created_at).getTime())

      return {
        isRateLimited: true,
        remainingTime: Math.max(0, remainingTime),
        reason: `Too many verification requests. ${recentVerifications.length} requests in last hour (max: ${MAX_VERIFICATIONS_PER_HOUR})`
      }
    }

    return {
      isRateLimited: false,
      remainingTime: 0
    }
  }

  /**
   * Calculate verification metrics
   */
  static calculateVerificationMetrics(verifications: EmailVerificationToken[]): EmailVerificationMetrics {
    const totalVerifications = verifications.length
    const pendingVerifications = verifications.filter(v => new EmailVerificationModel(v).isValid).length
    const verifiedCount = verifications.filter(v => new EmailVerificationModel(v).isVerified).length
    const expiredCount = verifications.filter(v => new EmailVerificationModel(v).isExpired).length
    const failedCount = verifications.filter(v => new EmailVerificationModel(v).isFailed).length

    const averageSecurityScore = totalVerifications > 0
      ? verifications.reduce((sum, v) => sum + new EmailVerificationModel(v).securityScore, 0) / totalVerifications
      : 100

    const averageVerificationTime = verifications
      .filter(v => v.verified_at)
      .reduce((sum, v) => {
        const created = new Date(v.created_at).getTime()
        const verified = new Date(v.verified_at!).getTime()
        return sum + (verified - created)
      }, 0) / Math.max(1, verifiedCount)

    return {
      total_verifications: totalVerifications,
      pending_verifications: pendingVerifications,
      verified_count: verifiedCount,
      expired_count: expiredCount,
      failed_count: failedCount,
      success_rate: totalVerifications > 0 ? Math.round((verifiedCount / totalVerifications) * 100) : 0,
      average_security_score: Math.round(averageSecurityScore),
      average_verification_time_ms: Math.round(averageVerificationTime)
    }
  }
}


/**
 * Type definitions
 */
interface EmailVerificationApiResponse {
  id: string
  user_id: string
  email: string
  status: EmailVerificationStatus | 'revoked'
  created_at: string
  expires_at: string
  attempts_remaining: number
  resent_count: number
  is_valid: boolean
  is_expired: boolean
  is_verified: boolean
  time_until_expiration: number
  can_resend: boolean
  is_rate_limited: boolean
  rate_limit_remaining: number
  security_score: number
}

interface EmailVerificationDetailedResponse extends EmailVerificationApiResponse {
  verification_token: string
  created_ip: string | null
  verified_ip: string | null
  last_attempted_at: string | null
  verified_at: string | null
  failed_at: string | null
  failure_reason: string | null
  revoked_at: string | null
  revocation_reason: string | null
  last_resent_at: string | null
  rate_limited_until: string | null
  updated_at: string
}

interface EmailVerificationMetrics {
  total_verifications: number
  pending_verifications: number
  verified_count: number
  expired_count: number
  failed_count: number
  success_rate: number
  average_security_score: number
  average_verification_time_ms: number
}
