/**
 * Authentication Session Model with Security Tracking
 * Enterprise-grade session management for authentication system
 */

import { z } from 'zod'
import { AuthenticationSession, SessionStatus } from '../types/auth'

/**
 * Authentication Session Entity with security tracking and business logic
 */
export class AuthSessionModel {
  constructor(private data: AuthenticationSession) {
    this.validate()
  }

  /**
   * Validate session data
   */
  private validate(): void {
    const result = authSessionSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid session data: ${result.error.message}`)
    }
  }

  /**
   * Get session data
   */
  get session(): AuthenticationSession {
    return { ...this.data }
  }

  /**
   * Check if session is active
   */
  get isActive(): boolean {
    return this.data.status === 'active' && !this.isExpired
  }

  /**
   * Check if session is expired
   */
  get isExpired(): boolean {
    return new Date(this.data.expires_at) <= new Date()
  }

  /**
   * Check if session should be refreshed
   */
  get shouldRefresh(): boolean {
    const refreshThreshold = new Date(Date.now() + REFRESH_THRESHOLD_MS)
    return new Date(this.data.expires_at) <= refreshThreshold
  }

  /**
   * Get time until expiration in milliseconds
   */
  get timeUntilExpiration(): number {
    return Math.max(0, new Date(this.data.expires_at).getTime() - Date.now())
  }

  /**
   * Check if MFA is required for this session
   */
  get requiresMfa(): boolean {
    return this.data.mfa_verified_at === null && this.data.user_agent_hash !== null
  }

  /**
   * Get session duration in milliseconds
   */
  get sessionDuration(): number {
    const createdAt = new Date(this.data.created_at).getTime()
    const expiresAt = new Date(this.data.expires_at).getTime()
    return expiresAt - createdAt
  }

  /**
   * Update session activity
   */
  updateActivity(ipAddress?: string): AuthSessionModel {
    const updates: Partial<AuthenticationSession> = {
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (ipAddress && ipAddress !== this.data.ip_address) {
      updates.ip_address = ipAddress
      updates.ip_changed_at = new Date().toISOString()
    }

    return new AuthSessionModel({
      ...this.data,
      ...updates
    })
  }

  /**
   * Refresh session expiration
   */
  refreshExpiration(extensionMs: number = SESSION_DURATION_MS): AuthSessionModel {
    const newExpiresAt = new Date(Date.now() + extensionMs).toISOString()

    return new AuthSessionModel({
      ...this.data,
      expires_at: newExpiresAt,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Mark MFA as verified
   */
  verifyMfa(): AuthSessionModel {
    return new AuthSessionModel({
      ...this.data,
      mfa_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Revoke session
   */
  revoke(reason: string = 'manual_revocation'): AuthSessionModel {
    return new AuthSessionModel({
      ...this.data,
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revocation_reason: reason,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Mark session as expired
   */
  expire(): AuthSessionModel {
    return new AuthSessionModel({
      ...this.data,
      status: 'expired',
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Update device information
   */
  updateDevice(userAgent: string, deviceFingerprint?: string): AuthSessionModel {
    const userAgentHash = SessionSecurity.hashUserAgent(userAgent)

    return new AuthSessionModel({
      ...this.data,
      user_agent_hash: userAgentHash,
      device_fingerprint: deviceFingerprint || null,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Check for security anomalies
   */
  getSecurityAnalysis(): SecurityAnalysis {
    const anomalies: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // Check for IP address changes
    if (this.data.ip_changed_at) {
      const ipChangeTime = new Date(this.data.ip_changed_at).getTime()
      const createdTime = new Date(this.data.created_at).getTime()
      if (ipChangeTime - createdTime < 300000) { // IP changed within 5 minutes
        anomalies.push('rapid_ip_change')
        riskLevel = 'medium'
      }
    }

    // Check session duration
    const currentDuration = Date.now() - new Date(this.data.created_at).getTime()
    if (currentDuration > MAX_SESSION_DURATION_MS) {
      anomalies.push('extended_session')
      riskLevel = 'medium'
    }

    // Check for unusual activity patterns
    if (this.data.last_activity_at) {
      const lastActivity = new Date(this.data.last_activity_at).getTime()
      const timeSinceActivity = Date.now() - lastActivity
      if (timeSinceActivity < 1000) { // Very frequent requests
        anomalies.push('high_frequency_activity')
        riskLevel = 'high'
      }
    }

    // Check device consistency
    if (!this.data.device_fingerprint && this.data.user_agent_hash) {
      anomalies.push('missing_device_fingerprint')
      riskLevel = 'medium'
    }

    return {
      riskLevel,
      anomalies,
      sessionAge: Date.now() - new Date(this.data.created_at).getTime(),
      recommendedAction: this.getRecommendedAction(riskLevel, anomalies)
    }
  }

  /**
   * Get recommended security action
   */
  private getRecommendedAction(riskLevel: string, anomalies: string[]): string {
    if (riskLevel === 'high') {
      return 'immediate_revocation'
    }

    if (riskLevel === 'medium') {
      if (anomalies.includes('rapid_ip_change')) {
        return 'require_mfa_reverification'
      }
      if (anomalies.includes('extended_session')) {
        return 'force_refresh'
      }
      return 'enhanced_monitoring'
    }

    return 'continue_monitoring'
  }

  /**
   * Create sanitized version for API responses
   */
  toApiResponse(): SessionApiResponse {
    return {
      id: this.data.id,
      user_id: this.data.user_id,
      status: this.data.status,
      created_at: this.data.created_at,
      expires_at: this.data.expires_at,
      last_activity_at: this.data.last_activity_at,
      is_active: this.isActive,
      is_expired: this.isExpired,
      should_refresh: this.shouldRefresh,
      time_until_expiration: this.timeUntilExpiration,
      requires_mfa: this.requiresMfa
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): Omit<AuthenticationSession, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }
}

/**
 * Validation schema for Authentication Session
 */
export const authSessionSchema = z.object({
  id: z.string().uuid('Invalid session ID format'),
  user_id: z.string().uuid('Invalid user ID format'),
  session_token: z.string().min(32, 'Session token too short'),
  status: z.enum(['active', 'expired', 'revoked']),
  created_at: z.string().datetime('Invalid created_at timestamp'),
  updated_at: z.string().datetime('Invalid updated_at timestamp'),
  expires_at: z.string().datetime('Invalid expires_at timestamp'),
  last_activity_at: z.string().datetime('Invalid last_activity_at timestamp').nullable(),
  revoked_at: z.string().datetime('Invalid revoked_at timestamp').nullable(),
  revocation_reason: z.string().max(255).nullable(),
  ip_address: z.string().ip('Invalid IP address').nullable(),
  ip_changed_at: z.string().datetime('Invalid ip_changed_at timestamp').nullable(),
  user_agent_hash: z.string().max(64).nullable(),
  device_fingerprint: z.string().max(255).nullable(),
  mfa_verified_at: z.string().datetime('Invalid mfa_verified_at timestamp').nullable()
})

/**
 * Factory for creating and managing authentication sessions
 */
export class AuthSessionFactory {
  /**
   * Create a new session
   */
  static create(data: {
    user_id: string
    session_token: string
    ip_address?: string
    user_agent?: string
    device_fingerprint?: string
    duration_ms?: number
  }): AuthSessionModel {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + (data.duration_ms || SESSION_DURATION_MS)).toISOString()

    const sessionData: AuthenticationSession = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      session_token: data.session_token,
      status: 'active',
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
      last_activity_at: now,
      revoked_at: null,
      revocation_reason: null,
      ip_address: data.ip_address || null,
      ip_changed_at: null,
      user_agent_hash: data.user_agent ? SessionSecurity.hashUserAgent(data.user_agent) : null,
      device_fingerprint: data.device_fingerprint || null,
      mfa_verified_at: null
    }

    return new AuthSessionModel(sessionData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: AuthenticationSession): AuthSessionModel {
    return new AuthSessionModel(dbRow)
  }

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Validate session token format
   */
  static validateSessionToken(token: string): { valid: boolean; error?: string } {
    if (!token) {
      return { valid: false, error: 'Session token is required' }
    }

    if (token.length !== 64) {
      return { valid: false, error: 'Session token must be 64 characters' }
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return { valid: false, error: 'Session token must be hexadecimal' }
    }

    return { valid: true }
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  /**
   * Hash user agent for comparison
   */
  static hashUserAgent(userAgent: string): string {
    // Simple hash for user agent comparison
    let hash = 0
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(data: {
    userAgent: string
    screen?: { width: number; height: number }
    timezone?: string
    language?: string
  }): string {
    const components = [
      data.userAgent,
      data.screen ? `${data.screen.width}x${data.screen.height}` : '',
      data.timezone || '',
      data.language || ''
    ]

    const fingerprint = components.join('|')
    return this.hashUserAgent(fingerprint)
  }

  /**
   * Check if IP address change is suspicious
   */
  static isSuspiciousIpChange(
    oldIp: string | null,
    newIp: string,
    timeElapsed: number
  ): boolean {
    if (!oldIp) return false

    // Same IP is not suspicious
    if (oldIp === newIp) return false

    // IP change within 1 minute is suspicious
    if (timeElapsed < 60000) return true

    // Check if IPs are in same subnet (simplified check)
    const oldParts = oldIp.split('.')
    const newParts = newIp.split('.')

    if (oldParts.length === 4 && newParts.length === 4) {
      // Same /24 subnet is less suspicious
      if (oldParts.slice(0, 3).join('.') === newParts.slice(0, 3).join('.')) {
        return false
      }
    }

    return true
  }
}

/**
 * Constants for session management
 */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
export const REFRESH_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour before expiration
export const MAX_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Session utilities for cleanup and monitoring
 */
export class SessionUtils {
  /**
   * Check if session needs cleanup
   */
  static needsCleanup(session: AuthenticationSession): boolean {
    const now = Date.now()
    const expiresAt = new Date(session.expires_at).getTime()
    const lastActivity = session.last_activity_at
      ? new Date(session.last_activity_at).getTime()
      : new Date(session.created_at).getTime()

    // Clean up if expired or inactive for too long
    return expiresAt < now || (now - lastActivity) > MAX_SESSION_DURATION_MS
  }

  /**
   * Get sessions requiring cleanup
   */
  static getSessionsForCleanup(sessions: AuthenticationSession[]): string[] {
    return sessions
      .filter(session => this.needsCleanup(session))
      .map(session => session.id)
  }

  /**
   * Calculate session health score
   */
  static calculateHealthScore(session: AuthenticationSession): number {
    let score = 100

    const now = Date.now()
    const createdAt = new Date(session.created_at).getTime()
    const sessionAge = now - createdAt

    // Reduce score based on age
    if (sessionAge > 48 * 60 * 60 * 1000) { // > 48 hours
      score -= 20
    }

    // Reduce score for IP changes
    if (session.ip_changed_at) {
      score -= 15
    }

    // Reduce score if no recent activity
    if (session.last_activity_at) {
      const lastActivity = new Date(session.last_activity_at).getTime()
      const timeSinceActivity = now - lastActivity
      if (timeSinceActivity > 8 * 60 * 60 * 1000) { // > 8 hours
        score -= 25
      }
    }

    // Reduce score if MFA not verified
    if (!session.mfa_verified_at && session.user_agent_hash) {
      score -= 30
    }

    return Math.max(0, score)
  }
}

/**
 * Type definitions
 */
interface SecurityAnalysis {
  riskLevel: 'low' | 'medium' | 'high'
  anomalies: string[]
  sessionAge: number
  recommendedAction: string
}

interface SessionApiResponse {
  id: string
  user_id: string
  status: SessionStatus
  created_at: string
  expires_at: string
  last_activity_at: string | null
  is_active: boolean
  is_expired: boolean
  should_refresh: boolean
  time_until_expiration: number
  requires_mfa: boolean
}