/**
 * Viewer Analytics Model with Validation Rules
 * Enterprise-grade analytics tracking for investor pitch deck presentations
 */

import { z } from 'zod'
import {
  ViewerAnalytics,
  AnalyticsEvent,
  analyticsEventSchema
} from '../types/pitch-deck'

/**
 * Viewer Analytics Entity with validation and business logic
 */
export class ViewerAnalyticsModel {
  constructor(private data: ViewerAnalytics) {
    this.validate()
  }

  /**
   * Validate analytics event data
   */
  private validate(): void {
    const result = analyticsEventSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid analytics event data: ${result.error.message}`)
    }
  }

  /**
   * Get analytics event data
   */
  get event(): ViewerAnalytics {
    return { ...this.data }
  }

  /**
   * Get event type
   */
  get type(): AnalyticsEvent {
    return this.data.event
  }

  /**
   * Get session ID
   */
  get sessionId(): string | undefined {
    return this.data.sessionId
  }

  /**
   * Get section ID (if applicable)
   */
  get sectionId(): string | undefined {
    return this.data.sectionId
  }

  /**
   * Get event timestamp
   */
  get timestamp(): Date {
    return new Date(this.data.timestamp)
  }

  /**
   * Get duration in seconds (if applicable)
   */
  get durationSeconds(): number | undefined {
    return this.data.duration ? Math.round(this.data.duration / 1000) : undefined
  }

  /**
   * Check if event has device metadata
   */
  get hasDeviceInfo(): boolean {
    return !!(this.data.metadata?.device)
  }

  /**
   * Check if event has referrer information
   */
  get hasReferrer(): boolean {
    return !!(this.data.metadata?.referrer)
  }

  /**
   * Get formatted timestamp
   */
  get formattedTimestamp(): string {
    return this.timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Check if event indicates high engagement
   */
  isHighEngagement(): boolean {
    switch (this.data.event) {
      case 'section_view':
        // Views longer than 30 seconds indicate engagement
        return this.data.duration ? this.data.duration > 30000 : false

      case 'time_spent':
        // Total time over 2 minutes indicates engagement
        return this.data.duration ? this.data.duration > 120000 : false

      case 'contact_form':
      case 'asset_download':
        // These are always high engagement
        return true

      case 'navigation':
        // Navigation doesn't indicate high engagement by itself
        return false

      default:
        return false
    }
  }

  /**
   * Get engagement score (0-100)
   */
  getEngagementScore(): number {
    let score = 10 // Base score for any interaction

    switch (this.data.event) {
      case 'section_view':
        if (this.data.duration) {
          // 1 point per second, max 60 points
          score += Math.min(60, Math.round(this.data.duration / 1000))
        }
        break

      case 'time_spent':
        if (this.data.duration) {
          // 0.5 points per second, max 80 points
          score += Math.min(80, Math.round(this.data.duration / 2000))
        }
        break

      case 'navigation':
        score += 5 // Small boost for navigation
        break

      case 'contact_form':
        score = 100 // Maximum engagement
        break

      case 'asset_download':
        score = 90 // Very high engagement
        break
    }

    return Math.min(100, score)
  }

  /**
   * Check if event is mobile
   */
  isMobile(): boolean {
    const device = this.data.metadata?.device?.toLowerCase()
    return !!(device && (device.includes('mobile') || device.includes('tablet')))
  }

  /**
   * Get device category
   */
  getDeviceCategory(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const device = this.data.metadata?.device?.toLowerCase()

    if (!device) return 'unknown'
    if (device.includes('tablet')) return 'tablet'
    if (device.includes('mobile')) return 'mobile'
    return 'desktop'
  }

  /**
   * Create a sanitized version for API responses
   */
  toApiResponse(): ViewerAnalytics {
    return {
      sessionId: this.data.sessionId,
      event: this.data.event,
      sectionId: this.data.sectionId,
      timestamp: this.data.timestamp,
      duration: this.data.duration,
      metadata: this.data.metadata
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): ViewerAnalytics {
    return { ...this.data }
  }

  /**
   * Get summary for analytics dashboard
   */
  getSummary(): {
    event: string
    sectionId?: string
    duration?: number
    deviceCategory: string
    engagementScore: number
    timestamp: string
    isHighEngagement: boolean
  } {
    return {
      event: this.data.event,
      sectionId: this.data.sectionId,
      duration: this.durationSeconds,
      deviceCategory: this.getDeviceCategory(),
      engagementScore: this.getEngagementScore(),
      timestamp: this.formattedTimestamp,
      isHighEngagement: this.isHighEngagement()
    }
  }
}

/**
 * Factory for creating new analytics events
 */
export class ViewerAnalyticsFactory {
  /**
   * Create a new analytics event
   */
  static create(data: {
    sessionId?: string
    event: AnalyticsEvent
    sectionId?: string
    duration?: number
    device?: string
    referrer?: string
  }): ViewerAnalyticsModel {
    const eventData: ViewerAnalytics = {
      sessionId: data.sessionId,
      event: data.event,
      sectionId: data.sectionId,
      timestamp: new Date().toISOString(),
      duration: data.duration,
      metadata: {
        device: data.device,
        referrer: data.referrer
      }
    }

    return new ViewerAnalyticsModel(eventData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: ViewerAnalytics): ViewerAnalyticsModel {
    return new ViewerAnalyticsModel(dbRow)
  }

  /**
   * Create section view event
   */
  static createSectionView(data: {
    sessionId?: string
    sectionId: string
    duration?: number
    device?: string
  }): ViewerAnalyticsModel {
    return this.create({
      sessionId: data.sessionId,
      event: 'section_view',
      sectionId: data.sectionId,
      duration: data.duration,
      device: data.device
    })
  }

  /**
   * Create navigation event
   */
  static createNavigation(data: {
    sessionId?: string
    sectionId?: string
    device?: string
  }): ViewerAnalyticsModel {
    return this.create({
      sessionId: data.sessionId,
      event: 'navigation',
      sectionId: data.sectionId,
      device: data.device
    })
  }

  /**
   * Create contact form event
   */
  static createContactForm(data: {
    sessionId?: string
    device?: string
  }): ViewerAnalyticsModel {
    return this.create({
      sessionId: data.sessionId,
      event: 'contact_form',
      device: data.device
    })
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return `sess_${crypto.randomUUID()}`
  }

  /**
   * Validate event data
   */
  static validateEvent(event: AnalyticsEvent): { valid: boolean; error?: string } {
    const validEvents: AnalyticsEvent[] = [
      'section_view',
      'time_spent',
      'navigation',
      'contact_form',
      'asset_download'
    ]

    if (!validEvents.includes(event)) {
      return { valid: false, error: 'Invalid event type' }
    }

    return { valid: true }
  }

  /**
   * Detect device from user agent
   */
  static detectDevice(userAgent: string): string {
    const ua = userAgent.toLowerCase()

    if (ua.includes('mobile')) return 'mobile'
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet'
    if (ua.includes('desktop')) return 'desktop'

    // Try to detect specific devices
    if (ua.includes('iphone')) return 'mobile'
    if (ua.includes('android')) {
      return ua.includes('mobile') ? 'mobile' : 'tablet'
    }

    return 'desktop' // Default assumption
  }
}

/**
 * Constants for analytics
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
export const LONG_VIEW_THRESHOLD_MS = 30 * 1000 // 30 seconds
export const HIGH_ENGAGEMENT_THRESHOLD = 70

/**
 * Analytics utilities
 */
export class AnalyticsUtils {
  /**
   * Group events by session
   */
  static groupBySession(events: ViewerAnalyticsModel[]): Record<string, ViewerAnalyticsModel[]> {
    return events.reduce((groups, event) => {
      const sessionId = event.sessionId || 'unknown'
      if (!groups[sessionId]) groups[sessionId] = []
      groups[sessionId].push(event)
      return groups
    }, {} as Record<string, ViewerAnalyticsModel[]>)
  }

  /**
   * Calculate session statistics
   */
  static getSessionStats(events: ViewerAnalyticsModel[]): {
    totalSessions: number
    totalEvents: number
    averageEventsPerSession: number
    highEngagementSessions: number
    topSections: Array<{ sectionId: string; views: number }>
    deviceBreakdown: Record<string, number>
  } {
    const sessionGroups = this.groupBySession(events)
    const sessions = Object.keys(sessionGroups)

    const stats = {
      totalSessions: sessions.length,
      totalEvents: events.length,
      averageEventsPerSession: sessions.length > 0 ? Math.round(events.length / sessions.length) : 0,
      highEngagementSessions: 0,
      topSections: [] as Array<{ sectionId: string; views: number }>,
      deviceBreakdown: {} as Record<string, number>
    }

    if (events.length === 0) return stats

    // Calculate high engagement sessions
    sessions.forEach(sessionId => {
      const sessionEvents = sessionGroups[sessionId]
      const avgEngagement = sessionEvents.reduce((sum, event) =>
        sum + event.getEngagementScore(), 0) / sessionEvents.length

      if (avgEngagement >= HIGH_ENGAGEMENT_THRESHOLD) {
        stats.highEngagementSessions++
      }
    })

    // Calculate top sections
    const sectionCounts: Record<string, number> = {}
    events.forEach(event => {
      if (event.sectionId && event.type === 'section_view') {
        sectionCounts[event.sectionId] = (sectionCounts[event.sectionId] || 0) + 1
      }
    })

    stats.topSections = Object.entries(sectionCounts)
      .map(([sectionId, views]) => ({ sectionId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Calculate device breakdown
    events.forEach(event => {
      const device = event.getDeviceCategory()
      stats.deviceBreakdown[device] = (stats.deviceBreakdown[device] || 0) + 1
    })

    return stats
  }

  /**
   * Get engagement metrics
   */
  static getEngagementMetrics(events: ViewerAnalyticsModel[]): {
    averageEngagementScore: number
    highEngagementEvents: number
    totalViewTime: number
    averageViewTime: number
    conversionEvents: number
  } {
    if (events.length === 0) {
      return {
        averageEngagementScore: 0,
        highEngagementEvents: 0,
        totalViewTime: 0,
        averageViewTime: 0,
        conversionEvents: 0
      }
    }

    const totalEngagement = events.reduce((sum, event) =>
      sum + event.getEngagementScore(), 0)
    const averageEngagementScore = Math.round(totalEngagement / events.length)

    const highEngagementEvents = events.filter(event =>
      event.getEngagementScore() >= HIGH_ENGAGEMENT_THRESHOLD).length

    const totalViewTime = events.reduce((sum, event) =>
      sum + (event.event.duration || 0), 0)
    const averageViewTime = Math.round(totalViewTime / events.length)

    const conversionEvents = events.filter(event =>
      event.type === 'contact_form' || event.type === 'asset_download').length

    return {
      averageEngagementScore,
      highEngagementEvents,
      totalViewTime: Math.round(totalViewTime / 1000), // Convert to seconds
      averageViewTime: Math.round(averageViewTime / 1000), // Convert to seconds
      conversionEvents
    }
  }

  /**
   * Generate analytics report
   */
  static generateReport(events: ViewerAnalyticsModel[]): {
    summary: ReturnType<typeof AnalyticsUtils.getSessionStats>
    engagement: ReturnType<typeof AnalyticsUtils.getEngagementMetrics>
    timeline: Array<{ date: string; events: number; engagement: number }>
  } {
    const summary = this.getSessionStats(events)
    const engagement = this.getEngagementMetrics(events)

    // Group events by date for timeline
    const dateGroups: Record<string, ViewerAnalyticsModel[]> = {}
    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0]
      if (!dateGroups[date]) dateGroups[date] = []
      dateGroups[date].push(event)
    })

    const timeline = Object.entries(dateGroups)
      .map(([date, dayEvents]) => {
        const avgEngagement = dayEvents.length > 0
          ? Math.round(dayEvents.reduce((sum, event) => sum + event.getEngagementScore(), 0) / dayEvents.length)
          : 0

        return {
          date,
          events: dayEvents.length,
          engagement: avgEngagement
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      summary,
      engagement,
      timeline
    }
  }

  /**
   * Check if session is active
   */
  static isSessionActive(lastActivity: string): boolean {
    const lastActivityTime = new Date(lastActivity)
    const now = new Date()
    const diffMs = now.getTime() - lastActivityTime.getTime()

    return diffMs < SESSION_TIMEOUT_MS
  }

  /**
   * Format duration for display
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.round(milliseconds / 1000)

    if (seconds < 60) {
      return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}m ${remainingSeconds}s`
  }
}