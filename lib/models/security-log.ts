/**
 * Security Event Log Model with Audit Trail
 * Enterprise-grade security logging for authentication system
 */

import { z } from 'zod'
import { SecurityEventLog, SecurityEventType, SecurityLevel } from '../types/auth'

/**
 * Security Event Log Entity with audit trail and analysis capabilities
 */
export class SecurityLogModel {
  constructor(private data: SecurityEventLog) {
    this.validate()
  }

  /**
   * Validate security log data
   */
  private validate(): void {
    const result = securityLogSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid security log data: ${result.error.message}`)
    }
  }

  /**
   * Get security log data
   */
  get log(): SecurityEventLog {
    return { ...this.data }
  }

  /**
   * Check if this is a critical security event
   */
  get isCritical(): boolean {
    return this.data.severity_level === 'critical'
  }

  /**
   * Check if this is a high-priority security event
   */
  get isHighPriority(): boolean {
    return ['critical', 'high'].includes(this.data.severity_level)
  }

  /**
   * Check if event occurred recently (within last hour)
   */
  get isRecent(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return new Date(this.data.created_at) > oneHourAgo
  }

  /**
   * Get event age in milliseconds
   */
  get eventAge(): number {
    return Date.now() - new Date(this.data.created_at).getTime()
  }

  /**
   * Check if event requires immediate attention
   */
  get requiresImmediateAttention(): boolean {
    return this.isCritical && this.isRecent
  }

  /**
   * Get risk score based on event type and context
   */
  get riskScore(): number {
    let score = this.getBaseRiskScore()

    // Increase score for recent events
    if (this.isRecent) {
      score += 10
    }

    // Increase score based on severity
    switch (this.data.severity_level) {
      case 'critical':
        score += 40
        break
      case 'high':
        score += 25
        break
      case 'medium':
        score += 10
        break
      case 'low':
        score += 0
        break
    }

    // Increase score if user context suggests suspicious activity
    if (this.data.user_id && this.data.additional_context) {
      const context = JSON.parse(this.data.additional_context)
      if (context.failed_attempts && context.failed_attempts > 3) {
        score += 20
      }
      if (context.ip_change) {
        score += 15
      }
      if (context.unusual_location) {
        score += 25
      }
    }

    return Math.min(100, score)
  }

  /**
   * Get base risk score for event type
   */
  private getBaseRiskScore(): number {
    const riskScores: Record<SecurityEventType, number> = {
      login_attempt: 5,
      login_success: 2,
      login_failure: 10,
      password_reset_request: 8,
      password_reset_success: 12,
      email_verification: 3,
      account_locked: 30,
      account_unlocked: 15,
      mfa_enabled: 5,
      mfa_disabled: 20,
      suspicious_activity: 35,
      session_created: 3,
      session_expired: 2,
      session_revoked: 15,
      permission_denied: 25,
      data_access: 8,
      configuration_change: 20,
      security_policy_violation: 40
    }

    return riskScores[this.data.event_type] || 10
  }

  /**
   * Add correlation with another security event
   */
  addCorrelation(relatedEventId: string, correlationType: string): SecurityLogModel {
    const correlations = this.data.correlation_ids
      ? JSON.parse(this.data.correlation_ids)
      : {}

    correlations[correlationType] = relatedEventId

    return new SecurityLogModel({
      ...this.data,
      correlation_ids: JSON.stringify(correlations),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Update event with resolution information
   */
  resolve(resolution: string, resolvedBy?: string): SecurityLogModel {
    const additionalContext = this.data.additional_context
      ? JSON.parse(this.data.additional_context)
      : {}

    additionalContext.resolution = resolution
    additionalContext.resolved_at = new Date().toISOString()
    if (resolvedBy) {
      additionalContext.resolved_by = resolvedBy
    }

    return new SecurityLogModel({
      ...this.data,
      additional_context: JSON.stringify(additionalContext),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Escalate event to higher severity
   */
  escalate(newSeverity: SecurityLevel, reason: string): SecurityLogModel {
    const additionalContext = this.data.additional_context
      ? JSON.parse(this.data.additional_context)
      : {}

    additionalContext.escalation = {
      from: this.data.severity_level,
      to: newSeverity,
      reason,
      escalated_at: new Date().toISOString()
    }

    return new SecurityLogModel({
      ...this.data,
      severity_level: newSeverity,
      additional_context: JSON.stringify(additionalContext),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Get formatted event description
   */
  getFormattedDescription(): string {
    const baseDescription = this.data.event_description

    if (!this.data.additional_context) {
      return baseDescription
    }

    try {
      const context = JSON.parse(this.data.additional_context)
      let description = baseDescription

      // Add IP information if available
      if (context.ip_address) {
        description += ` from IP ${context.ip_address}`
      }

      // Add location information if available
      if (context.location) {
        description += ` (${context.location})`
      }

      // Add user agent information if available
      if (context.user_agent) {
        const shortAgent = context.user_agent.substring(0, 50)
        description += ` using ${shortAgent}${context.user_agent.length > 50 ? '...' : ''}`
      }

      return description
    } catch {
      return baseDescription
    }
  }

  /**
   * Create sanitized version for API responses
   */
  toApiResponse(): SecurityLogApiResponse {
    return {
      id: this.data.id,
      event_type: this.data.event_type,
      severity_level: this.data.severity_level,
      event_description: this.getFormattedDescription(),
      created_at: this.data.created_at,
      source_ip: this.data.source_ip,
      user_id: this.data.user_id,
      is_critical: this.isCritical,
      is_recent: this.isRecent,
      risk_score: this.riskScore,
      event_age: this.eventAge,
      requires_attention: this.requiresImmediateAttention
    }
  }

  /**
   * Create detailed version for security analysis
   */
  toDetailedResponse(): SecurityLogDetailedResponse {
    const apiResponse = this.toApiResponse()

    return {
      ...apiResponse,
      session_id: this.data.session_id,
      additional_context: this.data.additional_context,
      correlation_ids: this.data.correlation_ids,
      updated_at: this.data.updated_at
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): Omit<SecurityEventLog, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }
}

/**
 * Validation schema for Security Event Log
 */
export const securityLogSchema = z.object({
  id: z.string().uuid('Invalid log ID format'),
  user_id: z.string().uuid('Invalid user ID format').nullable(),
  session_id: z.string().uuid('Invalid session ID format').nullable(),
  event_type: z.enum([
    'login_attempt', 'login_success', 'login_failure',
    'password_reset_request', 'password_reset_success',
    'email_verification', 'account_locked', 'account_unlocked',
    'mfa_enabled', 'mfa_disabled', 'suspicious_activity',
    'session_created', 'session_expired', 'session_revoked',
    'permission_denied', 'data_access', 'configuration_change',
    'security_policy_violation'
  ]),
  severity_level: z.enum(['low', 'medium', 'high', 'critical']),
  event_description: z.string().min(1).max(1000),
  source_ip: z.string().ip('Invalid IP address').nullable(),
  user_agent: z.string().max(1000).nullable(),
  created_at: z.string().datetime('Invalid created_at timestamp'),
  updated_at: z.string().datetime('Invalid updated_at timestamp'),
  additional_context: z.string().nullable(),
  correlation_ids: z.string().nullable()
})

/**
 * Factory for creating security event logs
 */
export class SecurityLogFactory {
  /**
   * Create a new security event log
   */
  static create(data: {
    event_type: SecurityEventType
    severity_level: SecurityLevel
    event_description: string
    user_id?: string
    session_id?: string
    source_ip?: string
    user_agent?: string
    additional_context?: Record<string, any>
    correlation_ids?: Record<string, string>
  }): SecurityLogModel {
    const now = new Date().toISOString()

    const logData: SecurityEventLog = {
      id: crypto.randomUUID(),
      user_id: data.user_id || null,
      session_id: data.session_id || null,
      event_type: data.event_type,
      severity_level: data.severity_level,
      event_description: data.event_description,
      source_ip: data.source_ip || null,
      user_agent: data.user_agent || null,
      created_at: now,
      updated_at: now,
      additional_context: data.additional_context
        ? JSON.stringify(data.additional_context)
        : null,
      correlation_ids: data.correlation_ids
        ? JSON.stringify(data.correlation_ids)
        : null
    }

    return new SecurityLogModel(logData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: SecurityEventLog): SecurityLogModel {
    return new SecurityLogModel(dbRow)
  }

  /**
   * Create login attempt log
   */
  static createLoginAttempt(data: {
    user_id?: string
    email: string
    success: boolean
    source_ip?: string
    user_agent?: string
    failure_reason?: string
  }): SecurityLogModel {
    const severity: SecurityLevel = data.success ? 'low' : 'medium'
    const eventType: SecurityEventType = data.success ? 'login_success' : 'login_failure'
    const description = data.success
      ? `Successful login for ${data.email}`
      : `Failed login attempt for ${data.email}${data.failure_reason ? `: ${data.failure_reason}` : ''}`

    const additionalContext: Record<string, any> = {
      email: data.email,
      success: data.success
    }

    if (data.failure_reason) {
      additionalContext.failure_reason = data.failure_reason
    }

    return this.create({
      event_type: eventType,
      severity_level: severity,
      event_description: description,
      user_id: data.user_id,
      source_ip: data.source_ip,
      user_agent: data.user_agent,
      additional_context: additionalContext
    })
  }

  /**
   * Create password reset log
   */
  static createPasswordReset(data: {
    user_id?: string
    email: string
    type: 'request' | 'success'
    source_ip?: string
    user_agent?: string
  }): SecurityLogModel {
    const severity: SecurityLevel = data.type === 'request' ? 'medium' : 'high'
    const eventType: SecurityEventType = data.type === 'request'
      ? 'password_reset_request'
      : 'password_reset_success'
    const description = data.type === 'request'
      ? `Password reset requested for ${data.email}`
      : `Password reset completed for ${data.email}`

    return this.create({
      event_type: eventType,
      severity_level: severity,
      event_description: description,
      user_id: data.user_id,
      source_ip: data.source_ip,
      user_agent: data.user_agent,
      additional_context: { email: data.email, type: data.type }
    })
  }

  /**
   * Create account lockout log
   */
  static createAccountLockout(data: {
    user_id: string
    email: string
    reason: string
    failed_attempts: number
    source_ip?: string
    user_agent?: string
  }): SecurityLogModel {
    return this.create({
      event_type: 'account_locked',
      severity_level: 'high',
      event_description: `Account locked for ${data.email} due to ${data.reason}`,
      user_id: data.user_id,
      source_ip: data.source_ip,
      user_agent: data.user_agent,
      additional_context: {
        email: data.email,
        reason: data.reason,
        failed_attempts: data.failed_attempts
      }
    })
  }

  /**
   * Create suspicious activity log
   */
  static createSuspiciousActivity(data: {
    user_id?: string
    activity_type: string
    description: string
    source_ip?: string
    user_agent?: string
    session_id?: string
    risk_indicators: string[]
  }): SecurityLogModel {
    return this.create({
      event_type: 'suspicious_activity',
      severity_level: 'high',
      event_description: `Suspicious ${data.activity_type}: ${data.description}`,
      user_id: data.user_id,
      session_id: data.session_id,
      source_ip: data.source_ip,
      user_agent: data.user_agent,
      additional_context: {
        activity_type: data.activity_type,
        risk_indicators: data.risk_indicators
      }
    })
  }
}

/**
 * Security log analysis utilities
 */
export class SecurityLogAnalysis {
  /**
   * Analyze logs for patterns
   */
  static analyzePatterns(logs: SecurityEventLog[]): SecurityAnalysisResult {
    const result: SecurityAnalysisResult = {
      total_events: logs.length,
      critical_events: 0,
      high_priority_events: 0,
      failed_logins: 0,
      successful_logins: 0,
      password_resets: 0,
      account_lockouts: 0,
      suspicious_activities: 0,
      unique_ips: new Set(),
      time_range: {
        start: '',
        end: ''
      },
      risk_score: 0,
      recommendations: []
    }

    if (logs.length === 0) {
      return result
    }

    // Sort logs by timestamp
    const sortedLogs = logs.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    result.time_range.start = sortedLogs[0].created_at
    result.time_range.end = sortedLogs[sortedLogs.length - 1].created_at

    // Analyze each log
    logs.forEach(log => {
      const logModel = new SecurityLogModel(log)

      // Count by severity
      if (logModel.isCritical) result.critical_events++
      if (logModel.isHighPriority) result.high_priority_events++

      // Count by event type
      switch (log.event_type) {
        case 'login_failure':
          result.failed_logins++
          break
        case 'login_success':
          result.successful_logins++
          break
        case 'password_reset_request':
        case 'password_reset_success':
          result.password_resets++
          break
        case 'account_locked':
          result.account_lockouts++
          break
        case 'suspicious_activity':
          result.suspicious_activities++
          break
      }

      // Track unique IPs
      if (log.source_ip) {
        result.unique_ips.add(log.source_ip)
      }

      // Add to overall risk score
      result.risk_score += logModel.riskScore
    })

    // Calculate average risk score
    result.risk_score = Math.round(result.risk_score / logs.length)

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result)

    return result
  }

  /**
   * Generate security recommendations
   */
  private static generateRecommendations(analysis: SecurityAnalysisResult): string[] {
    const recommendations: string[] = []

    if (analysis.failed_logins > analysis.successful_logins * 2) {
      recommendations.push('High number of failed logins detected. Consider implementing additional rate limiting.')
    }

    if (analysis.account_lockouts > 0) {
      recommendations.push('Account lockouts occurred. Review authentication policies and user education.')
    }

    if (analysis.suspicious_activities > 0) {
      recommendations.push('Suspicious activities detected. Investigate and consider additional monitoring.')
    }

    if (analysis.unique_ips.size > 100) {
      recommendations.push('High number of unique IP addresses. Consider implementing geolocation restrictions.')
    }

    if (analysis.risk_score > 50) {
      recommendations.push('High overall risk score. Implement additional security measures.')
    }

    if (analysis.password_resets > analysis.successful_logins * 0.1) {
      recommendations.push('High password reset rate. Consider user education on password security.')
    }

    return recommendations
  }

  /**
   * Detect anomalies in log patterns
   */
  static detectAnomalies(logs: SecurityEventLog[]): SecurityAnomaly[] {
    const anomalies: SecurityAnomaly[] = []

    // Group logs by user and IP
    const userActivity = new Map<string, SecurityEventLog[]>()
    const ipActivity = new Map<string, SecurityEventLog[]>()

    logs.forEach(log => {
      if (log.user_id) {
        if (!userActivity.has(log.user_id)) {
          userActivity.set(log.user_id, [])
        }
        userActivity.get(log.user_id)!.push(log)
      }

      if (log.source_ip) {
        if (!ipActivity.has(log.source_ip)) {
          ipActivity.set(log.source_ip, [])
        }
        ipActivity.get(log.source_ip)!.push(log)
      }
    })

    // Check for rapid failed logins from same IP
    ipActivity.forEach((ipLogs, ip) => {
      const recentFailures = ipLogs.filter(log =>
        log.event_type === 'login_failure' &&
        new Date(log.created_at).getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
      )

      if (recentFailures.length >= 5) {
        anomalies.push({
          type: 'rapid_failed_logins',
          severity: 'high',
          description: `${recentFailures.length} failed login attempts from IP ${ip} in last 5 minutes`,
          affected_entity: ip,
          detection_time: new Date().toISOString()
        })
      }
    })

    // Check for unusual user activity patterns
    userActivity.forEach((userLogs, userId) => {
      const uniqueIPs = new Set(userLogs.map(log => log.source_ip).filter(Boolean))

      if (uniqueIPs.size > 3) {
        anomalies.push({
          type: 'multiple_ip_login',
          severity: 'medium',
          description: `User logged in from ${uniqueIPs.size} different IP addresses`,
          affected_entity: userId,
          detection_time: new Date().toISOString()
        })
      }
    })

    return anomalies
  }
}

/**
 * Type definitions
 */
interface SecurityLogApiResponse {
  id: string
  event_type: SecurityEventType
  severity_level: SecurityLevel
  event_description: string
  created_at: string
  source_ip: string | null
  user_id: string | null
  is_critical: boolean
  is_recent: boolean
  risk_score: number
  event_age: number
  requires_attention: boolean
}

interface SecurityLogDetailedResponse extends SecurityLogApiResponse {
  session_id: string | null
  additional_context: string | null
  correlation_ids: string | null
  updated_at: string
}

interface SecurityAnalysisResult {
  total_events: number
  critical_events: number
  high_priority_events: number
  failed_logins: number
  successful_logins: number
  password_resets: number
  account_lockouts: number
  suspicious_activities: number
  unique_ips: Set<string>
  time_range: {
    start: string
    end: string
  }
  risk_score: number
  recommendations: string[]
}

interface SecurityAnomaly {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affected_entity: string
  detection_time: string
}