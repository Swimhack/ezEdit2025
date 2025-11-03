/**
 * Pitch Deck Service with Comprehensive Content Management
 * Enterprise-grade investor presentation service coordinating all pitch deck operations
 */

import { createEnhancedSupabaseClient, withRetry } from '../supabase-enhanced'
import { PitchSectionModel, PitchSectionFactory } from '../models/pitch-section'
import { ContactSubmissionModel, ContactSubmissionFactory } from '../models/contact-submission'
import { ViewerAnalyticsModel, ViewerAnalyticsFactory } from '../models/viewer-analytics'
import {
  PitchSection,
  PitchSectionContent,
  ContactSubmission,
  ViewerAnalytics,
  PresentationConfig,
  AnalyticsEvent,
  InvestorType,
  LayoutType,
  DEFAULT_THEME,
  DEFAULT_NAVIGATION,
  DEFAULT_ANALYTICS,
  PitchDeckApiResponse,
  ErrorResponse
} from '../types/pitch-deck'

/**
 * Request metadata for operations
 */
interface RequestMetadata {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  userId?: string
}

/**
 * Service result types
 */
interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: ErrorResponse
  metadata?: object
}

/**
 * Core pitch deck service handling all presentation operations
 */
export class PitchDeckService {
  private supabase = createEnhancedSupabaseClient()

  // ========================================
  // PITCH SECTION OPERATIONS
  // ========================================

  /**
   * Get all pitch deck sections
   */
  async getSections(options: {
    includeHidden?: boolean
    orderBy?: 'order' | 'title' | 'updated'
  } = {}): Promise<ServiceResult<PitchSection[]>> {
    return withRetry(async () => {
      try {
        let query = this.supabase
          .from('pitch_sections')
          .select('*')

        // Filter hidden sections if requested
        if (!options.includeHidden) {
          query = query.eq('is_visible', true)
        }

        // Apply ordering
        switch (options.orderBy) {
          case 'title':
            query = query.order('title')
            break
          case 'updated':
            query = query.order('updated_at', { ascending: false })
            break
          default:
            query = query.order('order')
        }

        const { data, error } = await query

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to retrieve pitch sections',
              details: { code: error.code }
            }
          }
        }

        // Convert to models
        const sections = (data || []).map(section =>
          PitchSectionFactory.fromDatabase(section).toApiResponse()
        )

        return {
          success: true,
          data: sections,
          metadata: {
            total_sections: sections.length,
            visible_sections: sections.filter(s => s.isVisible).length,
            last_updated: sections.length > 0
              ? Math.max(...sections.map(s => new Date(s.metadata?.lastUpdated || 0).getTime()))
              : new Date().toISOString()
          }
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error retrieving sections'
          }
        }
      }
    })
  }

  /**
   * Get specific pitch section by ID
   */
  async getSection(sectionId: string): Promise<ServiceResult<PitchSection>> {
    return withRetry(async () => {
      try {
        const { data, error } = await this.supabase
          .from('pitch_sections')
          .select('*')
          .eq('id', sectionId)
          .single()

        if (error || !data) {
          return {
            success: false,
            error: {
              error: 'NOT_FOUND',
              message: `Pitch section '${sectionId}' not found`
            }
          }
        }

        const section = PitchSectionFactory.fromDatabase(data)

        return {
          success: true,
          data: section.toApiResponse()
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error retrieving section'
          }
        }
      }
    })
  }

  /**
   * Create new pitch section
   */
  async createSection(data: {
    id: string
    title: string
    order: number
    layout?: LayoutType
    author?: string
  }, metadata: RequestMetadata = {}): Promise<ServiceResult<PitchSection>> {
    return withRetry(async () => {
      try {
        // Validate section ID
        const idValidation = PitchSectionFactory.validateId(data.id)
        if (!idValidation.valid) {
          return {
            success: false,
            error: {
              error: 'VALIDATION_ERROR',
              message: idValidation.error!,
              details: { field: 'id' }
            }
          }
        }

        // Check if section already exists
        const existingCheck = await this.getSection(data.id)
        if (existingCheck.success) {
          return {
            success: false,
            error: {
              error: 'CONFLICT',
              message: `Section with ID '${data.id}' already exists`
            }
          }
        }

        // Create section model
        const section = PitchSectionFactory.create(data)

        // Save to database
        const { error } = await this.supabase
          .from('pitch_sections')
          .insert(section.toDatabaseRow())

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to create pitch section',
              details: { code: error.code }
            }
          }
        }

        return {
          success: true,
          data: section.toApiResponse()
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error creating section'
          }
        }
      }
    })
  }

  /**
   * Update pitch section content
   */
  async updateSection(
    sectionId: string,
    updates: Partial<PitchSectionContent>,
    metadata: RequestMetadata = {}
  ): Promise<ServiceResult<PitchSection>> {
    return withRetry(async () => {
      try {
        // Get existing section
        const existingResult = await this.getSection(sectionId)
        if (!existingResult.success || !existingResult.data) {
          return existingResult
        }

        // Create updated section
        const existingSection = PitchSectionFactory.fromDatabase(existingResult.data)
        const updatedSection = existingSection.updateContent(updates)

        // Save to database
        const { error } = await this.supabase
          .from('pitch_sections')
          .update(updatedSection.toDatabaseRow())
          .eq('id', sectionId)

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to update pitch section',
              details: { code: error.code }
            }
          }
        }

        return {
          success: true,
          data: updatedSection.toApiResponse()
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error updating section'
          }
        }
      }
    })
  }

  /**
   * Delete pitch section
   */
  async deleteSection(sectionId: string): Promise<ServiceResult<void>> {
    return withRetry(async () => {
      try {
        const { error } = await this.supabase
          .from('pitch_sections')
          .delete()
          .eq('id', sectionId)

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to delete pitch section',
              details: { code: error.code }
            }
          }
        }

        return { success: true }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error deleting section'
          }
        }
      }
    })
  }

  // ========================================
  // PRESENTATION CONFIGURATION
  // ========================================

  /**
   * Get presentation configuration
   */
  async getConfiguration(): Promise<ServiceResult<PresentationConfig>> {
    return withRetry(async () => {
      try {
        const { data, error } = await this.supabase
          .from('presentation_config')
          .select('*')
          .single()

        if (error || !data) {
          // Return default configuration if none exists
          const defaultConfig: PresentationConfig = {
            theme: DEFAULT_THEME,
            navigation: DEFAULT_NAVIGATION,
            analytics: DEFAULT_ANALYTICS,
            seo: {
              title: 'EzEdit Investor Presentation',
              description: 'Comprehensive investor pitch deck for EzEdit\'s file editing platform',
              keywords: ['file editing', 'website management', 'saas', 'developer tools']
            }
          }

          return {
            success: true,
            data: defaultConfig
          }
        }

        return {
          success: true,
          data: data as PresentationConfig
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error retrieving configuration'
          }
        }
      }
    })
  }

  // ========================================
  // ANALYTICS OPERATIONS
  // ========================================

  /**
   * Track analytics event
   */
  async trackEvent(
    eventData: {
      sessionId?: string
      event: AnalyticsEvent
      sectionId?: string
      duration?: number
    },
    metadata: RequestMetadata = {}
  ): Promise<ServiceResult<{ message: string }>> {
    return withRetry(async () => {
      try {
        // Create analytics event
        const analyticsEvent = ViewerAnalyticsFactory.create({
          sessionId: eventData.sessionId,
          event: eventData.event,
          sectionId: eventData.sectionId,
          duration: eventData.duration,
          device: ViewerAnalyticsFactory.detectDevice(metadata.userAgent || ''),
          referrer: metadata.ipAddress
        })

        // Save to database
        const { error } = await this.supabase
          .from('viewer_analytics')
          .insert(analyticsEvent.toDatabaseRow())

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to track analytics event',
              details: { code: error.code }
            }
          }
        }

        return {
          success: true,
          data: { message: 'Event tracked successfully' }
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error tracking event'
          }
        }
      }
    })
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(options: {
    sessionId?: string
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<ServiceResult<any>> {
    return withRetry(async () => {
      try {
        let query = this.supabase
          .from('viewer_analytics')
          .select('*')

        // Apply filters
        if (options.sessionId) {
          query = query.eq('session_id', options.sessionId)
        }

        if (options.dateFrom) {
          query = query.gte('timestamp', options.dateFrom)
        }

        if (options.dateTo) {
          query = query.lte('timestamp', options.dateTo)
        }

        const { data, error } = await query

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to retrieve analytics data',
              details: { code: error.code }
            }
          }
        }

        // Convert to models and generate report
        const events = (data || []).map(event =>
          ViewerAnalyticsFactory.fromDatabase(event)
        )

        // Generate analytics report
        const report = {
          totalEvents: events.length,
          uniqueSessions: new Set(events.map(e => e.sessionId).filter(Boolean)).size,
          averageEngagement: events.length > 0
            ? Math.round(events.reduce((sum, e) => sum + e.getEngagementScore(), 0) / events.length)
            : 0,
          topSections: this.getTopSections(events),
          deviceBreakdown: this.getDeviceBreakdown(events)
        }

        return {
          success: true,
          data: report
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error retrieving analytics'
          }
        }
      }
    })
  }

  // ========================================
  // CONTACT FORM OPERATIONS
  // ========================================

  /**
   * Submit contact form
   */
  async submitContactForm(
    formData: {
      name: string
      email: string
      company?: string
      investorType?: InvestorType
      message?: string
      interestedSections?: string[]
    },
    metadata: RequestMetadata = {}
  ): Promise<ServiceResult<{ submission_id: string; follow_up_timeline: string }>> {
    return withRetry(async () => {
      try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
            (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
          return {
            success: false,
            error: {
              error: 'CONFIGURATION_ERROR',
              message: 'Contact form is not configured. Please contact support directly.',
              details: { issue: 'Missing Supabase environment variables' }
            }
          }
        }
        // Validate required fields
        if (!formData.name || !formData.email) {
          return {
            success: false,
            error: {
              error: 'VALIDATION_ERROR',
              message: 'Name and email are required',
              details: { field: !formData.name ? 'name' : 'email' }
            }
          }
        }

        // Validate email format
        const emailValidation = ContactSubmissionFactory.validateEmail(formData.email)
        if (!emailValidation.valid) {
          return {
            success: false,
            error: {
              error: 'VALIDATION_ERROR',
              message: emailValidation.error!,
              details: { field: 'email' }
            }
          }
        }

        // Check for spam
        const spamCheck = ContactSubmissionFactory.isSpam({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })

        if (spamCheck.isSpam) {
          return {
            success: false,
            error: {
              error: 'VALIDATION_ERROR',
              message: 'Submission appears to be spam',
              details: { reasons: spamCheck.reasons }
            }
          }
        }

        // Create contact submission
        const submission = ContactSubmissionFactory.create(formData)

        // Save to database
        const dbRow = submission.toDatabaseRow()
        console.log('Attempting to insert contact submission:', {
          table: 'contact_submissions',
          data: { ...dbRow, email: dbRow.email ? `${dbRow.email.substring(0, 3)}***` : 'undefined' } // Log email partially for debugging
        })
        
        const { data: insertedData, error } = await this.supabase
          .from('contact_submissions')
          .insert(dbRow)
          .select()

        if (error) {
          console.error('Database error inserting contact submission:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          
          // Check if table doesn't exist (PGRST116 = relation does not exist)
          if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
            return {
              success: false,
              error: {
                error: 'DATABASE_ERROR',
                message: 'Contact form database table not found. Please run the database migration.',
                details: { 
                  code: error.code, 
                  message: error.message,
                  hint: 'Run migration: supabase/migrations/004_contact_submissions.sql'
                }
              }
            }
          }
          
          // Check for JWT/auth errors
          if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('permission')) {
            return {
              success: false,
              error: {
                error: 'DATABASE_ERROR',
                message: 'Database authentication failed. Please check Supabase configuration.',
                details: { code: error.code, message: error.message }
              }
            }
          }
          
          // Generic database error
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to submit contact form. Please try again or contact support directly.',
              details: { code: error.code, message: error.message }
            }
          }
        }
        
        console.log('Successfully inserted contact submission:', insertedData?.[0]?.id)

        // Track contact form event
        await this.trackEvent({
          sessionId: metadata.sessionId,
          event: 'contact_form'
        }, metadata)

        const insertedId = insertedData?.[0]?.id || submission.id
        
        return {
          success: true,
          data: {
            submission_id: insertedId!,
            follow_up_timeline: 'within 24 hours'
          }
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error submitting contact form'
          }
        }
      }
    })
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Initialize default pitch sections
   */
  async initializeDefaultSections(author?: string): Promise<ServiceResult<PitchSection[]>> {
    return withRetry(async () => {
      try {
        const defaultSections = PitchSectionFactory.createDefaultSections(author)
        const sectionsData = defaultSections.map(section => section.toDatabaseRow())

        const { error } = await this.supabase
          .from('pitch_sections')
          .insert(sectionsData)

        if (error) {
          return {
            success: false,
            error: {
              error: 'DATABASE_ERROR',
              message: 'Failed to initialize default sections',
              details: { code: error.code }
            }
          }
        }

        return {
          success: true,
          data: defaultSections.map(section => section.toApiResponse())
        }

      } catch (error) {
        return {
          success: false,
          error: {
            error: 'SERVICE_ERROR',
            message: 'Internal error initializing sections'
          }
        }
      }
    })
  }

  /**
   * Get top sections from analytics events
   */
  private getTopSections(events: ViewerAnalyticsModel[]): Array<{ sectionId: string; views: number }> {
    const sectionCounts: Record<string, number> = {}

    events.forEach(event => {
      if (event.sectionId && event.type === 'section_view') {
        sectionCounts[event.sectionId] = (sectionCounts[event.sectionId] || 0) + 1
      }
    })

    return Object.entries(sectionCounts)
      .map(([sectionId, views]) => ({ sectionId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
  }

  /**
   * Get device breakdown from analytics events
   */
  private getDeviceBreakdown(events: ViewerAnalyticsModel[]): Record<string, number> {
    const deviceCounts: Record<string, number> = {}

    events.forEach(event => {
      const device = event.getDeviceCategory()
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })

    return deviceCounts
  }
}

/**
 * Static pitch deck content management utilities
 */
export class PitchDeckContentManager {
  /**
   * Generate sample content for a section
   */
  static generateSampleContent(sectionId: string): PitchSectionContent {
    const sampleContent: Record<string, PitchSectionContent> = {
      'problem': {
        headline: 'The File Editing Challenge',
        subheadline: 'Website management is complex and time-consuming for developers and businesses',
        blocks: [
          {
            id: 'problem-text',
            type: 'text',
            content: {
              text: 'Current website editing tools are either too simple for developers or too complex for non-technical users.'
            }
          }
        ],
        layout: 'hero'
      },
      'solution': {
        headline: 'EzEdit: Seamless File Management',
        subheadline: 'Professional-grade editing with enterprise security and collaboration',
        blocks: [
          {
            id: 'solution-features',
            type: 'text',
            content: {
              text: 'Direct FTP/SFTP integration, real-time collaboration, and intuitive interface for all skill levels.'
            }
          }
        ],
        layout: 'two_column'
      },
      'market': {
        headline: 'Massive Market Opportunity',
        subheadline: 'The global website management market is growing at 15% CAGR',
        blocks: [
          {
            id: 'market-size',
            type: 'text',
            content: {
              text: '$12B market size growing to $24B by 2028 driven by digital transformation.'
            }
          }
        ],
        layout: 'centered'
      }
    }

    return sampleContent[sectionId] || {
      headline: 'Section Title',
      blocks: [],
      layout: 'centered'
    }
  }

  /**
   * Validate complete pitch deck
   */
  static validatePitchDeck(sections: PitchSection[]): {
    valid: boolean
    warnings: string[]
    errors: string[]
  } {
    const sectionModels = sections.map(section =>
      PitchSectionFactory.fromDatabase(section)
    )

    return PitchSectionFactory.validatePitchDeck ?
      PitchSectionFactory.validatePitchDeck(sectionModels) :
      { valid: true, warnings: [], errors: [] }
  }
}