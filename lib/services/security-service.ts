/**
 * Security Logging Service for Comprehensive Audit Trail
 * Enterprise-grade security logging and monitoring for authentication system
 */

import { createEnhancedSupabaseClient, withRetry } from '../supabase-enhanced'
import { SecurityLogModel, SecurityLogFactory, SecurityLogAnalysis } from '../models/security-log'
import {
  SecurityEventLog,
  SecurityEventType,
  SecurityLevel,
  AuthRequestMetadata
} from '../types/auth'

/**
 * Security service for logging, monitoring, and analyzing security events
 */
export class SecurityService {
  private supabase = createEnhancedSupabaseClient()
  private enabledEventTypes: Set<SecurityEventType>
  private minimumLogLevel: SecurityLevel

  constructor(config: SecurityServiceConfig = {}) {
    this.enabledEventTypes = new Set(config.enabledEventTypes || [
      'login_attempt', 'login_success', 'login_failure',
      'password_reset_request', 'password_reset_success',
      'email_verification', 'account_locked', 'account_unlocked',
      'mfa_enabled', 'mfa_disabled', 'suspicious_activity',
      'session_created', 'session_expired', 'session_revoked',
      'permission_denied', 'data_access', 'configuration_change',
      'security_policy_violation'
    ])

    this.minimumLogLevel = config.minimumLogLevel || 'low'
  }

  /**
   * Log a security event
   */
  async logEvent(params: LogEventParams): Promise<{ success: boolean; logId?: string; error?: string }> {
    return withRetry(async () => {
      try {
        // Check if event type is enabled
        if (!this.enabledEventTypes.has(params.eventType)) {
          return { success: true } // Silently ignore disabled events
        }

        // Check if event meets minimum log level
        if (!this.meetsMinimumLevel(params.severityLevel)) {
          return { success: true } // Silently ignore low-level events
        }

        // Enrich event with additional context
        const enrichedContext = await this.enrichEventContext(params)

        // Create security log entry
        const securityLog = SecurityLogFactory.create({
          event_type: params.eventType,
          severity_level: params.severityLevel,
          event_description: params.description,
          user_id: params.userId,
          session_id: params.sessionId,
          source_ip: params.sourceIp,
          user_agent: params.userAgent,
          additional_context: enrichedContext,
          correlation_ids: params.correlationIds
        })

        // Store in database
        const { data, error } = await this.supabase
          .from('security_logs')
          .insert(securityLog.toDatabaseRow())
          .select('id')
          .single()

        if (error) {
          console.error('Failed to store security log:', error)
          return {
            success: false,
            error: 'Failed to store security log'
          }
        }

        // Check for high-priority events that need immediate attention
        if (securityLog.requiresImmediateAttention) {
          await this.handleHighPriorityEvent(securityLog)
        }

        // Trigger anomaly detection for certain event types
        if (this.shouldTriggerAnomalyDetection(params.eventType)) {
          await this.triggerAnomalyDetection(params.userId, params.sourceIp)
        }

        return {
          success: true,
          logId: data.id
        }

      } catch (error) {
        console.error('Security logging error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'security-log-event', 2)
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(params: AuthAttemptParams): Promise<{ success: boolean; logId?: string }> {
    const result = await this.logEvent({
      eventType: params.success ? 'login_success' : 'login_failure',
      severityLevel: params.success ? 'low' : 'medium',
      description: params.success
        ? `Successful authentication: ${params.email}`
        : `Failed authentication: ${params.email}${params.failureReason ? ` (${params.failureReason})` : ''}`,
      userId: params.userId,
      sessionId: params.sessionId,
      sourceIp: params.sourceIp,
      userAgent: params.userAgent,
      additionalContext: {
        email: params.email,
        success: params.success,
        failure_reason: params.failureReason,
        login_method: params.loginMethod || 'email_password'
      }
    })

    return result
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(params: SuspiciousActivityParams): Promise<{ success: boolean; logId?: string }> {
    const result = await this.logEvent({
      eventType: 'suspicious_activity',
      severityLevel: params.severityLevel || 'high',
      description: `Suspicious activity detected: ${params.activityType} - ${params.description}`,
      userId: params.userId,
      sessionId: params.sessionId,
      sourceIp: params.sourceIp,
      userAgent: params.userAgent,
      additionalContext: {
        activity_type: params.activityType,
        risk_indicators: params.riskIndicators,
        confidence_score: params.confidenceScore,
        detection_method: params.detectionMethod
      }
    })

    return result
  }

  /**
   * Log session event
   */
  async logSessionEvent(params: SessionEventParams): Promise<{ success: boolean; logId?: string }> {
    const eventTypeMap: Record<string, SecurityEventType> = {
      created: 'session_created',
      expired: 'session_expired',
      revoked: 'session_revoked'
    }

    const severityMap: Record<string, SecurityLevel> = {
      created: 'low',
      expired: 'low',
      revoked: 'medium'
    }

    const result = await this.logEvent({
      eventType: eventTypeMap[params.eventType] || 'session_created',
      severityLevel: severityMap[params.eventType] || 'low',
      description: `Session ${params.eventType}: ${params.sessionId}`,
      userId: params.userId,
      sessionId: params.sessionId,
      sourceIp: params.sourceIp,
      userAgent: params.userAgent,
      additionalContext: {
        session_duration: params.sessionDuration,
        revocation_reason: params.revocationReason
      }
    })

    return result
  }

  /**
   * Log account security event
   */
  async logAccountSecurityEvent(params: AccountSecurityEventParams): Promise<{ success: boolean; logId?: string }> {
    const eventTypeMap: Record<string, SecurityEventType> = {
      locked: 'account_locked',
      unlocked: 'account_unlocked',
      mfa_enabled: 'mfa_enabled',
      mfa_disabled: 'mfa_disabled'
    }

    const severityMap: Record<string, SecurityLevel> = {
      locked: 'high',
      unlocked: 'medium',
      mfa_enabled: 'low',
      mfa_disabled: 'high'
    }

    const result = await this.logEvent({
      eventType: eventTypeMap[params.eventType] || 'configuration_change',
      severityLevel: severityMap[params.eventType] || 'medium',
      description: `Account security change: ${params.eventType} for ${params.email}`,
      userId: params.userId,
      sourceIp: params.sourceIp,
      userAgent: params.userAgent,
      additionalContext: {
        email: params.email,
        change_type: params.eventType,
        previous_state: params.previousState,
        new_state: params.newState,
        reason: params.reason
      }
    })

    return result
  }

  /**
   * Get security logs with filtering and pagination
   */
  async getLogs(params: GetLogsParams): Promise<{
    success: boolean
    logs?: SecurityEventLog[]
    totalCount?: number
    error?: string
  }> {
    return withRetry(async () => {
      try {
        let query = this.supabase
          .from('security_logs')
          .select('*', { count: 'exact' })

        // Apply filters
        if (params.userId) {
          query = query.eq('user_id', params.userId)
        }

        if (params.sessionId) {
          query = query.eq('session_id', params.sessionId)
        }

        if (params.eventTypes && params.eventTypes.length > 0) {
          query = query.in('event_type', params.eventTypes)
        }

        if (params.severityLevel) {
          query = query.gte('severity_level', params.severityLevel)
        }

        if (params.sourceIp) {
          query = query.eq('source_ip', params.sourceIp)
        }

        if (params.startDate) {
          query = query.gte('created_at', params.startDate)
        }

        if (params.endDate) {
          query = query.lte('created_at', params.endDate)
        }

        // Apply pagination
        const offset = (params.page - 1) * params.limit
        query = query
          .order('created_at', { ascending: false })
          .range(offset, offset + params.limit - 1)

        const { data, error, count } = await query

        if (error) {
          return {
            success: false,
            error: `Failed to fetch security logs: ${error.message}`
          }
        }

        return {
          success: true,
          logs: data || [],
          totalCount: count || 0
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'get-security-logs', 2)
  }

  /**
   * Analyze security patterns and anomalies
   */
  async analyzeSecurityPatterns(params: AnalysisParams): Promise<{
    success: boolean
    analysis?: any
    anomalies?: any[]
    error?: string
  }> {
    return withRetry(async () => {
      try {
        // Get logs for analysis period
        const logsResult = await this.getLogs({
          userId: params.userId,
          startDate: params.startDate,
          endDate: params.endDate,
          page: 1,
          limit: 10000 // Get all logs for analysis
        })

        if (!logsResult.success || !logsResult.logs) {
          return {
            success: false,
            error: 'Failed to fetch logs for analysis'
          }
        }

        // Perform pattern analysis
        const analysis = SecurityLogAnalysis.analyzePatterns(logsResult.logs)

        // Detect anomalies
        const anomalies = SecurityLogAnalysis.detectAnomalies(logsResult.logs)

        return {
          success: true,
          analysis,
          anomalies
        }

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, 'analyze-security-patterns', 2)
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(params: ReportParams): Promise<{
    success: boolean
    report?: SecurityReport
    error?: string
  }> {
    try {
      const analysisResult = await this.analyzeSecurityPatterns({
        userId: params.userId,
        startDate: params.startDate,
        endDate: params.endDate
      })

      if (!analysisResult.success) {
        return {
          success: false,
          error: analysisResult.error
        }
      }

      const report: SecurityReport = {
        generated_at: new Date().toISOString(),
        period: {
          start: params.startDate,
          end: params.endDate
        },
        user_id: params.userId,
        analysis: analysisResult.analysis,
        anomalies: analysisResult.anomalies || [],
        recommendations: this.generateSecurityRecommendations(analysisResult.analysis),
        risk_score: this.calculateOverallRiskScore(analysisResult.analysis, analysisResult.anomalies || [])
      }

      return {
        success: true,
        report
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clean up old security logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<{
    success: boolean
    deletedCount?: number
    error?: string
  }> {
    return withRetry(async () => {
      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

        const { data, error } = await this.supabase
          .from('security_logs')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id')

        if (error) {
          return {
            success: false,
            error: `Failed to cleanup logs: ${error.message}`
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
    }, 'cleanup-security-logs', 2)
  }

  /**
   * Helper methods
   */
  private meetsMinimumLevel(level: SecurityLevel): boolean {
    const levelOrder: SecurityLevel[] = ['low', 'medium', 'high', 'critical']
    const eventLevelIndex = levelOrder.indexOf(level)
    const minimumLevelIndex = levelOrder.indexOf(this.minimumLogLevel)
    return eventLevelIndex >= minimumLevelIndex
  }

  private async enrichEventContext(params: LogEventParams): Promise<Record<string, any>> {
    const context = { ...params.additionalContext }

    // Add timestamp
    context.logged_at = new Date().toISOString()

    // Add IP geolocation if available
    if (params.sourceIp) {
      context.ip_info = await this.getIpInfo(params.sourceIp)
    }

    // Add user agent parsing if available
    if (params.userAgent) {
      context.user_agent_info = this.parseUserAgent(params.userAgent)
    }

    return context
  }

  private async getIpInfo(ipAddress: string): Promise<Record<string, any> | null> {
    try {
      // This would typically use a geolocation service
      // For now, return basic info
      return {
        ip: ipAddress,
        lookup_attempted: true
      }
    } catch (error) {
      return null
    }
  }

  private parseUserAgent(userAgent: string): Record<string, any> {
    // Basic user agent parsing
    const info: Record<string, any> = {
      raw: userAgent,
      is_mobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      is_bot: /bot|crawler|spider/i.test(userAgent)
    }

    // Extract browser info
    if (userAgent.includes('Chrome')) {
      info.browser = 'Chrome'
    } else if (userAgent.includes('Firefox')) {
      info.browser = 'Firefox'
    } else if (userAgent.includes('Safari')) {
      info.browser = 'Safari'
    } else if (userAgent.includes('Edge')) {
      info.browser = 'Edge'
    }

    return info
  }

  private async handleHighPriorityEvent(securityLog: SecurityLogModel): Promise<void> {
    try {
      // This would typically trigger alerts, notifications, etc.
      console.warn('High priority security event:', {
        id: securityLog.log.id,
        type: securityLog.log.event_type,
        description: securityLog.log.event_description,
        risk_score: securityLog.riskScore
      })

      // Could trigger email alerts, webhooks, etc.
    } catch (error) {
      console.error('Failed to handle high priority event:', error)
    }
  }

  private shouldTriggerAnomalyDetection(eventType: SecurityEventType): boolean {
    const triggerEvents: SecurityEventType[] = [
      'login_failure',
      'suspicious_activity',
      'account_locked',
      'permission_denied'
    ]

    return triggerEvents.includes(eventType)
  }

  private async triggerAnomalyDetection(userId?: string, sourceIp?: string): Promise<void> {
    try {
      // This would typically run anomaly detection algorithms
      // For now, just log that detection was triggered
      console.log('Anomaly detection triggered:', { userId, sourceIp })
    } catch (error) {
      console.error('Anomaly detection failed:', error)
    }
  }

  private generateSecurityRecommendations(analysis: any): string[] {
    const recommendations: string[] = []

    if (analysis?.failed_logins > 10) {
      recommendations.push('Consider implementing additional rate limiting for failed logins')
    }

    if (analysis?.unique_ips?.size > 50) {
      recommendations.push('Monitor for potential credential sharing or account compromise')
    }

    if (analysis?.critical_events > 0) {
      recommendations.push('Review and address all critical security events immediately')
    }

    return recommendations
  }

  private calculateOverallRiskScore(analysis: any, anomalies: any[]): number {
    let score = 0

    // Base score from analysis
    if (analysis?.risk_score) {
      score += analysis.risk_score
    }

    // Add score for anomalies
    score += anomalies.length * 10

    // Add score for critical events
    if (analysis?.critical_events) {
      score += analysis.critical_events * 20
    }

    return Math.min(100, score)
  }
}

/**
 * Type definitions
 */
export interface SecurityServiceConfig {
  enabledEventTypes?: SecurityEventType[]
  minimumLogLevel?: SecurityLevel
}

export interface LogEventParams {
  eventType: SecurityEventType
  severityLevel: SecurityLevel
  description: string
  userId?: string
  sessionId?: string
  sourceIp?: string
  userAgent?: string
  additionalContext?: Record<string, any>
  correlationIds?: Record<string, string>
}

export interface AuthAttemptParams {
  success: boolean
  email: string
  userId?: string
  sessionId?: string
  sourceIp?: string
  userAgent?: string
  failureReason?: string
  loginMethod?: string
}

export interface SuspiciousActivityParams {
  activityType: string
  description: string
  userId?: string
  sessionId?: string
  sourceIp?: string
  userAgent?: string
  severityLevel?: SecurityLevel
  riskIndicators: string[]
  confidenceScore?: number
  detectionMethod?: string
}

export interface SessionEventParams {
  eventType: 'created' | 'expired' | 'revoked'
  sessionId: string
  userId: string
  sourceIp?: string
  userAgent?: string
  sessionDuration?: number
  revocationReason?: string
}

export interface AccountSecurityEventParams {
  eventType: 'locked' | 'unlocked' | 'mfa_enabled' | 'mfa_disabled'
  userId: string
  email: string
  sourceIp?: string
  userAgent?: string
  previousState?: any
  newState?: any
  reason?: string
}

export interface GetLogsParams {
  userId?: string
  sessionId?: string
  eventTypes?: SecurityEventType[]
  severityLevel?: SecurityLevel
  sourceIp?: string
  startDate?: string
  endDate?: string
  page: number
  limit: number
}

export interface AnalysisParams {
  userId?: string
  startDate: string
  endDate: string
}

export interface ReportParams extends AnalysisParams {
  includeRecommendations?: boolean
}

export interface SecurityReport {
  generated_at: string
  period: {
    start: string
    end: string
  }
  user_id?: string
  analysis: any
  anomalies: any[]
  recommendations: string[]
  risk_score: number
}

/**
 * Create singleton security service instance
 */
export const securityService = new SecurityService()