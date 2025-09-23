/**
 * Session Management Service with Proper Cleanup
 * Enterprise-grade session management for authentication system
 */

import { createEnhancedSupabaseClient, withRetry } from '../supabase-enhanced'
import { AuthSessionModel, AuthSessionFactory, SessionUtils } from '../models/auth-session'
import { SecurityService } from './security-service'
import {
  AuthenticationSession,
  SessionStatus,
  AuthRequestMetadata
} from '../types/auth'

/**
 * Session management service handling session lifecycle and cleanup
 */
export class SessionService {
  private supabase = createEnhancedSupabaseClient()
  private securityService: SecurityService
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(securityService: SecurityService) {
    this.securityService = securityService
    this.startCleanupScheduler()
  }

  /**
   * Create a new session
   */
  async createSession(params: CreateSessionParams): Promise<{
    success: boolean
    session?: AuthSessionModel
    error?: string
  }> {
    return withRetry(async () => {
      try {
        // Check for existing active sessions
        const existingSessions = await this.getUserActiveSessions(params.userId)

        // Apply session limits
        if (existingSessions.length >= MAX_SESSIONS_PER_USER) {
          // Revoke oldest session
          const oldestSession = existingSessions
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

          if (oldestSession) {
            await this.revokeSession(oldestSession.id, 'session_limit_exceeded', params.metadata)
          }
        }

        // Generate session token
        const sessionToken = AuthSessionFactory.generateSessionToken()

        // Create session model
        const session = AuthSessionFactory.create({
          user_id: params.userId,
          session_token: sessionToken,
          ip_address: params.metadata?.ipAddress,
          user_agent: params.metadata?.userAgent,
          device_fingerprint: params.deviceFingerprint,
          duration_ms: params.durationMs || SESSION_DURATION_MS
        })

        // Store in database
        const { data, error } = await this.supabase
          .from('auth_sessions')
          .insert(session.toDatabaseRow())
          .select('*')
          .single()

        if (error) {
          await this.securityService.logSessionEvent({
            eventType: 'created',
            sessionId: session.session.id,
            userId: params.userId,
            sourceIp: params.metadata?.ipAddress,
            userAgent: params.metadata?.userAgent
          })

          return {
            success: false,
            error: `Failed to create session: ${error.message}`
          }
        }

        const createdSession = AuthSessionFactory.fromDatabase(data)

        // Log session creation
        await this.securityService.logSessionEvent({
          eventType: 'created',
          sessionId: createdSession.session.id,
          userId: params.userId,
          sourceIp: params.metadata?.ipAddress,
          userAgent: params.metadata?.userAgent
        })

        return {
          success: true,
          session: createdSession
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'create-session', 2)
  }

  /**
   * Get session by token
   */
  async getSession(sessionToken: string): Promise<{
    success: boolean
    session?: AuthSessionModel
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const { data, error } = await this.supabase
          .from('auth_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .single()

        if (error || !data) {
          return {
            success: false,
            error: 'Session not found'
          }
        }

        const session = AuthSessionFactory.fromDatabase(data)

        // Check if session is valid
        if (!session.isActive) {
          return {
            success: false,
            error: session.isExpired ? 'Session expired' : 'Session not active'
          }
        }

        return {
          success: true,
          session
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'get-session', 2)
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(
    sessionToken: string,
    metadata: AuthRequestMetadata
  ): Promise<{
    success: boolean
    session?: AuthSessionModel
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const sessionResult = await this.getSession(sessionToken)
        if (!sessionResult.success || !sessionResult.session) {
          return sessionResult
        }

        const session = sessionResult.session
        const updatedSession = session.updateActivity(metadata.ipAddress)

        // Check for suspicious IP changes
        if (metadata.ipAddress && session.session.ip_address !== metadata.ipAddress) {
          const isIpChangeSuspicious = this.isIpChangeSuspicious(
            session.session.ip_address,
            metadata.ipAddress,
            Date.now() - new Date(session.session.created_at).getTime()
          )

          if (isIpChangeSuspicious) {
            await this.securityService.logSuspiciousActivity({
              activityType: 'ip_address_change',
              description: `Session IP changed from ${session.session.ip_address} to ${metadata.ipAddress}`,
              userId: session.session.user_id,
              sessionId: session.session.id,
              sourceIp: metadata.ipAddress,
              userAgent: metadata.userAgent,
              severityLevel: 'medium',
              riskIndicators: ['rapid_ip_change', 'session_hijacking_risk']
            })
          }
        }

        // Update in database
        const { error } = await this.supabase
          .from('auth_sessions')
          .update(updatedSession.toDatabaseRow())
          .eq('id', session.session.id)

        if (error) {
          return {
            success: false,
            error: `Failed to update session: ${error.message}`
          }
        }

        return {
          success: true,
          session: updatedSession
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'update-session-activity', 2)
  }

  /**
   * Refresh session expiration
   */
  async refreshSession(
    sessionToken: string,
    extensionMs?: number
  ): Promise<{
    success: boolean
    session?: AuthSessionModel
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const sessionResult = await this.getSession(sessionToken)
        if (!sessionResult.success || !sessionResult.session) {
          return sessionResult
        }

        const session = sessionResult.session

        // Check if session should be refreshed
        if (!session.shouldRefresh && !extensionMs) {
          return {
            success: true,
            session
          }
        }

        const refreshedSession = session.refreshExpiration(extensionMs)

        // Update in database
        const { error } = await this.supabase
          .from('auth_sessions')
          .update(refreshedSession.toDatabaseRow())
          .eq('id', session.session.id)

        if (error) {
          return {
            success: false,
            error: `Failed to refresh session: ${error.message}`
          }
        }

        return {
          success: true,
          session: refreshedSession
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'refresh-session', 2)
  }

  /**
   * Revoke session
   */
  async revokeSession(
    sessionId: string,
    reason: string = 'manual_revocation',
    metadata?: AuthRequestMetadata
  ): Promise<{
    success: boolean
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const { data, error: fetchError } = await this.supabase
          .from('auth_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (fetchError || !data) {
          return {
            success: false,
            error: 'Session not found'
          }
        }

        const session = AuthSessionFactory.fromDatabase(data)
        const revokedSession = session.revoke(reason)

        // Update in database
        const { error } = await this.supabase
          .from('auth_sessions')
          .update(revokedSession.toDatabaseRow())
          .eq('id', sessionId)

        if (error) {
          return {
            success: false,
            error: `Failed to revoke session: ${error.message}`
          }
        }

        // Log session revocation
        await this.securityService.logSessionEvent({
          eventType: 'revoked',
          sessionId: sessionId,
          userId: session.session.user_id,
          sourceIp: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          revocationReason: reason
        })

        return {
          success: true
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'revoke-session', 2)
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(
    userId: string,
    reason: string = 'security_measure',
    excludeSessionId?: string
  ): Promise<{
    success: boolean
    revokedCount?: number
    error?: string
  }> {
    return withRetry(async () => {
      try {
        let query = this.supabase
          .from('auth_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')

        if (excludeSessionId) {
          query = query.neq('id', excludeSessionId)
        }

        const { data: sessions, error: fetchError } = await query

        if (fetchError) {
          return {
            success: false,
            error: `Failed to fetch user sessions: ${fetchError.message}`
          }
        }

        if (!sessions || sessions.length === 0) {
          return {
            success: true,
            revokedCount: 0
          }
        }

        // Revoke all sessions
        const revokedSessions = sessions.map(sessionData => {
          const session = AuthSessionFactory.fromDatabase(sessionData)
          return session.revoke(reason)
        })

        const updates = revokedSessions.map(session => ({
          id: session.session.id,
          ...session.toDatabaseRow()
        }))

        const { error: updateError } = await this.supabase
          .from('auth_sessions')
          .upsert(updates)

        if (updateError) {
          return {
            success: false,
            error: `Failed to revoke sessions: ${updateError.message}`
          }
        }

        // Log bulk revocation
        await this.securityService.logAccountSecurityEvent({
          eventType: 'unlocked', // Using as general security event
          userId: userId,
          email: '', // Would need to fetch user email
          reason: `Bulk session revocation: ${reason}`
        })

        return {
          success: true,
          revokedCount: sessions.length
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'revoke-all-user-sessions', 2)
  }

  /**
   * Get user active sessions
   */
  async getUserActiveSessions(userId: string): Promise<AuthenticationSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('auth_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch user sessions:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }
  }

  /**
   * Get session analytics for user
   */
  async getUserSessionAnalytics(userId: string, days: number = 30): Promise<{
    success: boolean
    analytics?: SessionAnalytics
    error?: string
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: sessions, error } = await this.supabase
        .from('auth_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (error) {
        return {
          success: false,
          error: `Failed to fetch session analytics: ${error.message}`
        }
      }

      const analytics = this.calculateSessionAnalytics(sessions || [])

      return {
        success: true,
        analytics
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<{
    success: boolean
    cleanedCount?: number
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const now = new Date().toISOString()

        // Get expired sessions
        const { data: expiredSessions, error: fetchError } = await this.supabase
          .from('auth_sessions')
          .select('*')
          .eq('status', 'active')
          .lt('expires_at', now)

        if (fetchError) {
          return {
            success: false,
            error: `Failed to fetch expired sessions: ${fetchError.message}`
          }
        }

        if (!expiredSessions || expiredSessions.length === 0) {
          return {
            success: true,
            cleanedCount: 0
          }
        }

        // Mark sessions as expired
        const expiredSessionUpdates = expiredSessions.map(sessionData => {
          const session = AuthSessionFactory.fromDatabase(sessionData)
          const expiredSession = session.expire()
          return {
            id: session.session.id,
            ...expiredSession.toDatabaseRow()
          }
        })

        const { error: updateError } = await this.supabase
          .from('auth_sessions')
          .upsert(expiredSessionUpdates)

        if (updateError) {
          return {
            success: false,
            error: `Failed to update expired sessions: ${updateError.message}`
          }
        }

        // Log cleanup
        for (const sessionData of expiredSessions) {
          await this.securityService.logSessionEvent({
            eventType: 'expired',
            sessionId: sessionData.id,
            userId: sessionData.user_id,
            sessionDuration: Date.now() - new Date(sessionData.created_at).getTime()
          })
        }

        return {
          success: true,
          cleanedCount: expiredSessions.length
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'cleanup-expired-sessions', 2)
  }

  /**
   * Delete old sessions (beyond retention period)
   */
  async deleteOldSessions(retentionDays: number = 90): Promise<{
    success: boolean
    deletedCount?: number
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

        const { data, error } = await this.supabase
          .from('auth_sessions')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id')

        if (error) {
          return {
            success: false,
            error: `Failed to delete old sessions: ${error.message}`
          }
        }

        return {
          success: true,
          deletedCount: data?.length || 0
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'delete-old-sessions', 2)
  }

  /**
   * Start automatic cleanup scheduler
   */
  private startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions()
        await this.deleteOldSessions()
      } catch (error) {
        console.error('Session cleanup failed:', error)
      }
    }, CLEANUP_INTERVAL_MS)
  }

  /**
   * Stop cleanup scheduler
   */
  stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Helper methods
   */
  private isIpChangeSuspicious(
    oldIp: string | null,
    newIp: string,
    sessionAge: number
  ): boolean {
    if (!oldIp || oldIp === newIp) {
      return false
    }

    // Rapid IP change is suspicious
    if (sessionAge < 5 * 60 * 1000) { // Less than 5 minutes
      return true
    }

    // Check if IPs are in different geographic regions (simplified)
    const oldParts = oldIp.split('.')
    const newParts = newIp.split('.')

    if (oldParts.length === 4 && newParts.length === 4) {
      // Different /16 networks might indicate geographic change
      if (oldParts.slice(0, 2).join('.') !== newParts.slice(0, 2).join('.')) {
        return true
      }
    }

    return false
  }

  private calculateSessionAnalytics(sessions: AuthenticationSession[]): SessionAnalytics {
    const totalSessions = sessions.length
    const activeSessions = sessions.filter(s => s.status === 'active').length
    const expiredSessions = sessions.filter(s => s.status === 'expired').length
    const revokedSessions = sessions.filter(s => s.status === 'revoked').length

    const averageDuration = sessions.length > 0
      ? sessions.reduce((sum, session) => {
          const start = new Date(session.created_at).getTime()
          const end = session.revoked_at
            ? new Date(session.revoked_at).getTime()
            : session.status === 'expired'
            ? new Date(session.expires_at).getTime()
            : Date.now()
          return sum + (end - start)
        }, 0) / sessions.length
      : 0

    const uniqueIps = new Set(sessions.map(s => s.ip_address).filter(Boolean)).size

    return {
      total_sessions: totalSessions,
      active_sessions: activeSessions,
      expired_sessions: expiredSessions,
      revoked_sessions: revokedSessions,
      average_duration_ms: Math.round(averageDuration),
      unique_ip_addresses: uniqueIps,
      concurrent_sessions: activeSessions
    }
  }
}

/**
 * Constants
 */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
export const MAX_SESSIONS_PER_USER = 10
export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Type definitions
 */
export interface CreateSessionParams {
  userId: string
  metadata?: AuthRequestMetadata
  deviceFingerprint?: string
  durationMs?: number
}

export interface SessionAnalytics {
  total_sessions: number
  active_sessions: number
  expired_sessions: number
  revoked_sessions: number
  average_duration_ms: number
  unique_ip_addresses: number
  concurrent_sessions: number
}

/**
 * Create session service instance
 */
export function createSessionService(securityService: SecurityService): SessionService {
  return new SessionService(securityService)
}