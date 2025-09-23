/**
 * Password Reset Token Model with Expiration
 * Enterprise-grade password reset token management for authentication system
 */

import { z } from 'zod'
import { PasswordResetToken, TokenStatus } from '../types/auth'

/**
 * Password Reset Token Entity with expiration and security tracking
 */
export class ResetTokenModel {
  constructor(private data: PasswordResetToken) {
    this.validate()
  }

  /**
   * Validate reset token data
   */
  private validate(): void {
    const result = resetTokenSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid reset token data: ${result.error.message}`)
    }
  }

  /**
   * Get reset token data
   */
  get token(): PasswordResetToken {
    return { ...this.data }
  }

  /**
   * Check if token is valid and can be used
   */
  get isValid(): boolean {
    return this.data.status === 'active' && !this.isExpired && this.data.attempts_remaining > 0
  }

  /**
   * Check if token is expired
   */
  get isExpired(): boolean {
    return new Date(this.data.expires_at) <= new Date()
  }

  /**
   * Check if token is used
   */
  get isUsed(): boolean {
    return this.data.status === 'used'
  }

  /**
   * Check if token is revoked
   */
  get isRevoked(): boolean {
    return this.data.status === 'revoked'
  }

  /**
   * Check if token should be cleaned up
   */
  get shouldCleanup(): boolean {
    return this.isExpired || this.isUsed || this.isRevoked
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
   * Get security score based on usage pattern
   */
  get securityScore(): number {
    let score = 100

    // Reduce score for multiple attempts
    const attemptsPenalty = (TOKEN_MAX_ATTEMPTS - this.data.attempts_remaining) * 10
    score -= attemptsPenalty

    // Reduce score if token is old
    const ageHours = this.tokenAge / (60 * 60 * 1000)
    if (ageHours > 12) {
      score -= 20
    }

    // Reduce score if used from different IP
    if (this.data.used_ip && this.data.created_ip !== this.data.used_ip) {
      score -= 15
    }

    // Reduce score if rate limited
    if (this.data.rate_limited_until) {
      score -= 25
    }

    return Math.max(0, score)
  }

  /**
   * Attempt to use the token
   */
  attemptUse(ipAddress?: string): ResetTokenModel {
    if (!this.isValid) {
      throw new Error('Token is not valid for use')
    }

    const now = new Date().toISOString()

    return new ResetTokenModel({
      ...this.data,
      attempts_remaining: this.data.attempts_remaining - 1,
      last_attempted_at: now,
      used_ip: ipAddress || this.data.used_ip,
      updated_at: now
    })
  }

  /**
   * Mark token as successfully used
   */
  markUsed(ipAddress?: string): ResetTokenModel {
    const now = new Date().toISOString()

    return new ResetTokenModel({
      ...this.data,
      status: 'used',
      used_at: now,
      used_ip: ipAddress || this.data.used_ip,
      updated_at: now
    })
  }

  /**
   * Revoke the token
   */
  revoke(reason: string = 'manual_revocation'): ResetTokenModel {
    const now = new Date().toISOString()

    return new ResetTokenModel({
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
  applyRateLimit(durationMs: number = RATE_LIMIT_DURATION_MS): ResetTokenModel {
    const rateLimitUntil = new Date(Date.now() + durationMs).toISOString()

    return new ResetTokenModel({
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
   * Validate token against provided token string
   */
  validateToken(providedToken: string): { valid: boolean; error?: string } {
    if (!providedToken) {
      return { valid: false, error: 'Token is required' }
    }

    if (providedToken !== this.data.reset_token) {
      return { valid: false, error: 'Invalid token' }
    }

    if (!this.isValid) {
      if (this.isExpired) {
        return { valid: false, error: 'Token has expired' }
      }
      if (this.isUsed) {
        return { valid: false, error: 'Token has already been used' }
      }
      if (this.isRevoked) {
        return { valid: false, error: 'Token has been revoked' }
      }
      if (this.data.attempts_remaining <= 0) {
        return { valid: false, error: 'Token has exceeded maximum attempts' }
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
   * Create sanitized version for API responses
   */
  toApiResponse(): ResetTokenApiResponse {
    return {
      id: this.data.id,
      user_id: this.data.user_id,
      status: this.data.status,
      created_at: this.data.created_at,
      expires_at: this.data.expires_at,
      attempts_remaining: this.data.attempts_remaining,
      is_valid: this.isValid,
      is_expired: this.isExpired,
      time_until_expiration: this.timeUntilExpiration,
      is_rate_limited: this.isRateLimited(),
      rate_limit_remaining: this.getRateLimitRemaining(),
      security_score: this.securityScore
    }
  }

  /**
   * Create detailed version for internal use
   */
  toDetailedResponse(): ResetTokenDetailedResponse {
    const apiResponse = this.toApiResponse()

    return {
      ...apiResponse,
      reset_token: this.data.reset_token,
      created_ip: this.data.created_ip,
      used_ip: this.data.used_ip,
      last_attempted_at: this.data.last_attempted_at,
      used_at: this.data.used_at,
      revoked_at: this.data.revoked_at,
      revocation_reason: this.data.revocation_reason,
      rate_limited_until: this.data.rate_limited_until,
      updated_at: this.data.updated_at
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): Omit<PasswordResetToken, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }
}

/**
 * Validation schema for Password Reset Token
 */
export const resetTokenSchema = z.object({
  id: z.string().uuid('Invalid token ID format'),
  user_id: z.string().uuid('Invalid user ID format'),
  reset_token: z.string().min(32, 'Reset token too short'),
  status: z.enum(['active', 'used', 'expired', 'revoked']),
  created_at: z.string().datetime('Invalid created_at timestamp'),
  updated_at: z.string().datetime('Invalid updated_at timestamp'),
  expires_at: z.string().datetime('Invalid expires_at timestamp'),
  attempts_remaining: z.number().int().min(0).max(TOKEN_MAX_ATTEMPTS),
  created_ip: z.string().ip('Invalid IP address').nullable(),
  used_ip: z.string().ip('Invalid IP address').nullable(),
  last_attempted_at: z.string().datetime('Invalid last_attempted_at timestamp').nullable(),
  used_at: z.string().datetime('Invalid used_at timestamp').nullable(),
  revoked_at: z.string().datetime('Invalid revoked_at timestamp').nullable(),
  revocation_reason: z.string().max(255).nullable(),
  rate_limited_until: z.string().datetime('Invalid rate_limited_until timestamp').nullable()
})

/**
 * Factory for creating and managing password reset tokens
 */
export class ResetTokenFactory {
  /**
   * Create a new password reset token
   */
  static create(data: {
    user_id: string
    email: string
    ip_address?: string
    duration_ms?: number
  }): ResetTokenModel {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + (data.duration_ms || TOKEN_EXPIRY_MS)).toISOString()

    const tokenData: PasswordResetToken = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      reset_token: this.generateSecureToken(),
      status: 'active',
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
      attempts_remaining: TOKEN_MAX_ATTEMPTS,
      created_ip: data.ip_address || null,
      used_ip: null,
      last_attempted_at: null,
      used_at: null,
      revoked_at: null,
      revocation_reason: null,
      rate_limited_until: null
    }

    return new ResetTokenModel(tokenData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: PasswordResetToken): ResetTokenModel {
    return new ResetTokenModel(dbRow)
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
   * Generate a user-friendly token (shorter, easier to type)
   */
  static generateUserFriendlyToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)

    for (let i = 0; i < bytes.length; i++) {
      result += chars[bytes[i] % chars.length]
    }

    return result
  }

  /**
   * Validate token format
   */
  static validateTokenFormat(token: string): { valid: boolean; error?: string } {
    if (!token) {
      return { valid: false, error: 'Token is required' }
    }

    // Check for secure token format (64 hex characters)
    if (/^[a-f0-9]{64}$/.test(token)) {
      return { valid: true }
    }

    // Check for user-friendly token format (8 alphanumeric characters)
    if (/^[A-Z0-9]{8}$/.test(token)) {
      return { valid: true }
    }

    return { valid: false, error: 'Invalid token format' }
  }

  /**
   * Hash token for secure storage
   */
  static hashToken(token: string): string {
    // Simple hash for token comparison (in production, use proper crypto.subtle)
    let hash = 0
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }
}

/**
 * Reset token management utilities
 */
export class ResetTokenUtils {
  /**
   * Clean up expired or used tokens
   */
  static getTokensForCleanup(tokens: PasswordResetToken[]): string[] {
    return tokens
      .filter(token => {
        const tokenModel = new ResetTokenModel(token)
        return tokenModel.shouldCleanup
      })
      .map(token => token.id)
  }

  /**
   * Check if user has too many active tokens
   */
  static checkTokenLimits(userTokens: PasswordResetToken[]): {
    withinLimits: boolean
    activeCount: number
    error?: string
  } {
    const activeTokens = userTokens.filter(token => {
      const tokenModel = new ResetTokenModel(token)
      return tokenModel.isValid
    })

    const withinLimits = activeTokens.length < MAX_TOKENS_PER_USER

    return {
      withinLimits,
      activeCount: activeTokens.length,
      error: withinLimits ? undefined : `User has ${activeTokens.length} active tokens (max: ${MAX_TOKENS_PER_USER})`
    }
  }

  /**
   * Get rate limiting status for user
   */
  static getRateLimitStatus(userTokens: PasswordResetToken[]): {
    isRateLimited: boolean
    remainingTime: number
    reason?: string
  } {
    const recentTokens = userTokens.filter(token => {
      const tokenModel = new ResetTokenModel(token)
      return tokenModel.isRecent
    })

    if (recentTokens.length >= MAX_TOKENS_PER_HOUR) {
      const oldestRecent = recentTokens.reduce((oldest, token) =>
        new Date(token.created_at) < new Date(oldest.created_at) ? token : oldest
      )

      const remainingTime = 60 * 60 * 1000 - (Date.now() - new Date(oldestRecent.created_at).getTime())

      return {
        isRateLimited: true,
        remainingTime: Math.max(0, remainingTime),
        reason: `Too many reset requests. ${recentTokens.length} requests in last hour (max: ${MAX_TOKENS_PER_HOUR})`
      }
    }

    // Check for rate limited tokens
    const rateLimitedToken = userTokens.find(token => {
      const tokenModel = new ResetTokenModel(token)
      return tokenModel.isRateLimited()
    })

    if (rateLimitedToken) {
      const tokenModel = new ResetTokenModel(rateLimitedToken)
      return {
        isRateLimited: true,
        remainingTime: tokenModel.getRateLimitRemaining(),
        reason: 'Previous token is rate limited'
      }
    }

    return {
      isRateLimited: false,
      remainingTime: 0
    }
  }

  /**
   * Calculate security metrics for tokens
   */
  static calculateSecurityMetrics(tokens: PasswordResetToken[]): ResetTokenSecurityMetrics {
    const totalTokens = tokens.length
    const activeTokens = tokens.filter(token => new ResetTokenModel(token).isValid).length
    const expiredTokens = tokens.filter(token => new ResetTokenModel(token).isExpired).length
    const usedTokens = tokens.filter(token => new ResetTokenModel(token).isUsed).length
    const revokedTokens = tokens.filter(token => new ResetTokenModel(token).isRevoked).length

    const averageSecurityScore = totalTokens > 0
      ? tokens.reduce((sum, token) => sum + new ResetTokenModel(token).securityScore, 0) / totalTokens
      : 100

    const suspiciousTokens = tokens.filter(token => {
      const tokenModel = new ResetTokenModel(token)
      return tokenModel.securityScore < 50
    }).length

    return {
      total_tokens: totalTokens,
      active_tokens: activeTokens,
      expired_tokens: expiredTokens,
      used_tokens: usedTokens,
      revoked_tokens: revokedTokens,
      average_security_score: Math.round(averageSecurityScore),
      suspicious_tokens: suspiciousTokens,
      success_rate: usedTokens > 0 ? Math.round((usedTokens / totalTokens) * 100) : 0
    }
  }
}

/**
 * Constants for token management
 */
export const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
export const TOKEN_MAX_ATTEMPTS = 3
export const MAX_TOKENS_PER_USER = 5
export const MAX_TOKENS_PER_HOUR = 3
export const RATE_LIMIT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Type definitions
 */
interface ResetTokenApiResponse {
  id: string
  user_id: string
  status: TokenStatus
  created_at: string
  expires_at: string
  attempts_remaining: number
  is_valid: boolean
  is_expired: boolean
  time_until_expiration: number
  is_rate_limited: boolean
  rate_limit_remaining: number
  security_score: number
}

interface ResetTokenDetailedResponse extends ResetTokenApiResponse {
  reset_token: string
  created_ip: string | null
  used_ip: string | null
  last_attempted_at: string | null
  used_at: string | null
  revoked_at: string | null
  revocation_reason: string | null
  rate_limited_until: string | null
  updated_at: string
}

interface ResetTokenSecurityMetrics {
  total_tokens: number
  active_tokens: number
  expired_tokens: number
  used_tokens: number
  revoked_tokens: number
  average_security_score: number
  suspicious_tokens: number
  success_rate: number
}