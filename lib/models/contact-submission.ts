/**
 * Contact Submission Model with Validation Rules
 * Enterprise-grade investor contact form management
 */

import { z } from 'zod'
import {
  ContactSubmission,
  InvestorType,
  contactSubmissionSchema
} from '../types/pitch-deck'

/**
 * Contact Submission Entity with validation and business logic
 */
export class ContactSubmissionModel {
  constructor(private data: ContactSubmission) {
    this.validate()
  }

  /**
   * Validate contact submission data
   */
  private validate(): void {
    const result = contactSubmissionSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid contact submission data: ${result.error.message}`)
    }
  }

  /**
   * Get contact submission data
   */
  get submission(): ContactSubmission {
    return { ...this.data }
  }

  /**
   * Get submission ID
   */
  get id(): string | undefined {
    return this.data.id
  }

  /**
   * Check if submission has company information
   */
  get hasCompanyInfo(): boolean {
    return !!(this.data.company && this.data.company.trim().length > 0)
  }

  /**
   * Check if submission has investor type
   */
  get hasInvestorType(): boolean {
    return !!this.data.investorType
  }

  /**
   * Check if submission has message
   */
  get hasMessage(): boolean {
    return !!(this.data.message && this.data.message.trim().length > 0)
  }

  /**
   * Check if submission has section interests
   */
  get hasSectionInterests(): boolean {
    return !!(this.data.interestedSections && this.data.interestedSections.length > 0)
  }

  /**
   * Get submission completeness score (0-100)
   */
  get completenessScore(): number {
    let score = 50 // Base score for required fields (name, email)

    if (this.hasCompanyInfo) score += 15
    if (this.hasInvestorType) score += 15
    if (this.hasMessage) score += 15
    if (this.hasSectionInterests) score += 5

    return Math.min(100, score)
  }

  /**
   * Get formatted submission date
   */
  get formattedSubmissionDate(): string {
    if (!this.data.submittedAt) return 'Unknown'

    const date = new Date(this.data.submittedAt)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Check if submission needs follow-up
   */
  needsFollowUp(): { needs: boolean; reason?: string } {
    // High-quality submissions need follow-up
    if (this.completenessScore >= 75) {
      return { needs: true, reason: 'High-quality submission' }
    }

    // VC or strategic investors always need follow-up
    if (this.data.investorType === 'vc' || this.data.investorType === 'strategic') {
      return { needs: true, reason: 'High-value investor type' }
    }

    // Submissions with detailed messages need follow-up
    if (this.hasMessage && this.data.message!.length > 100) {
      return { needs: true, reason: 'Detailed inquiry' }
    }

    return { needs: false }
  }

  /**
   * Update follow-up status
   */
  updateFollowupStatus(status: string): ContactSubmissionModel {
    return new ContactSubmissionModel({
      ...this.data,
      followupStatus: status
    })
  }

  /**
   * Add interested section
   */
  addInterestedSection(sectionId: string): ContactSubmissionModel {
    const currentSections = this.data.interestedSections || []

    if (currentSections.includes(sectionId)) {
      return this // Section already added
    }

    return new ContactSubmissionModel({
      ...this.data,
      interestedSections: [...currentSections, sectionId]
    })
  }

  /**
   * Remove interested section
   */
  removeInterestedSection(sectionId: string): ContactSubmissionModel {
    const currentSections = this.data.interestedSections || []
    const newSections = currentSections.filter(id => id !== sectionId)

    return new ContactSubmissionModel({
      ...this.data,
      interestedSections: newSections
    })
  }

  /**
   * Create a sanitized version for API responses
   */
  toApiResponse(): ContactSubmission {
    return {
      id: this.data.id,
      name: this.data.name,
      email: this.data.email,
      company: this.data.company,
      investorType: this.data.investorType,
      message: this.data.message,
      interestedSections: this.data.interestedSections,
      submittedAt: this.data.submittedAt,
      followupStatus: this.data.followupStatus
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): Omit<ContactSubmission, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }

  /**
   * Get summary for admin listing
   */
  getSummary(): {
    id?: string
    name: string
    email: string
    company?: string
    investorType?: string
    completenessScore: number
    submittedAt?: string
    needsFollowUp: boolean
  } {
    const followUp = this.needsFollowUp()

    return {
      id: this.data.id,
      name: this.data.name,
      email: this.data.email,
      company: this.data.company,
      investorType: this.data.investorType,
      completenessScore: this.completenessScore,
      submittedAt: this.data.submittedAt,
      needsFollowUp: followUp.needs
    }
  }

  /**
   * Get contact details for CRM export
   */
  toCrmFormat(): {
    name: string
    email: string
    company: string
    type: string
    source: string
    notes: string
    interests: string
    priority: 'high' | 'medium' | 'low'
  } {
    const followUp = this.needsFollowUp()
    let priority: 'high' | 'medium' | 'low' = 'low'

    if (this.completenessScore >= 85) priority = 'high'
    else if (this.completenessScore >= 65) priority = 'medium'

    return {
      name: this.data.name,
      email: this.data.email,
      company: this.data.company || 'Not provided',
      type: this.data.investorType || 'Not specified',
      source: 'Investor Pitch Deck',
      notes: this.data.message || 'No additional message',
      interests: this.data.interestedSections?.join(', ') || 'General interest',
      priority
    }
  }
}

/**
 * Factory for creating new contact submissions
 */
export class ContactSubmissionFactory {
  /**
   * Create a new contact submission with default values
   */
  static create(data: {
    name: string
    email: string
    company?: string
    investorType?: InvestorType
    message?: string
    interestedSections?: string[]
  }): ContactSubmissionModel {
    const submissionData: ContactSubmission = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      company: data.company?.trim(),
      investorType: data.investorType,
      message: data.message?.trim(),
      interestedSections: data.interestedSections || [],
      submittedAt: new Date().toISOString(),
      followupStatus: 'pending'
    }

    return new ContactSubmissionModel(submissionData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: ContactSubmission): ContactSubmissionModel {
    return new ContactSubmissionModel(dbRow)
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    try {
      const emailSchema = z.string().email()
      emailSchema.parse(email)
      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Invalid email format' }
    }
  }

  /**
   * Validate name format
   */
  static validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Name is required' }
    }

    if (name.trim().length > 100) {
      return { valid: false, error: 'Name must be 100 characters or less' }
    }

    // Check for suspicious patterns
    if (/[<>{}[\]\\]/.test(name)) {
      return { valid: false, error: 'Name contains invalid characters' }
    }

    return { valid: true }
  }

  /**
   * Sanitize message content
   */
  static sanitizeMessage(message: string): string {
    if (!message) return ''

    return message
      .trim()
      .replace(/[<>{}[\]\\]/g, '') // Remove potentially dangerous characters
      .substring(0, 2000) // Enforce length limit
  }

  /**
   * Detect spam submissions
   */
  static isSpam(data: {
    name: string
    email: string
    message?: string
  }): { isSpam: boolean; reasons: string[] } {
    const reasons: string[] = []

    // Check for obvious spam patterns
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'click here']
    const text = `${data.name} ${data.email} ${data.message || ''}`.toLowerCase()

    spamKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        reasons.push(`Contains spam keyword: ${keyword}`)
      }
    })

    // Check for suspicious email patterns
    if (data.email.includes('+') && data.email.split('+').length > 2) {
      reasons.push('Suspicious email format')
    }

    // Check for excessive links in message
    if (data.message) {
      const linkCount = (data.message.match(/https?:\/\//g) || []).length
      if (linkCount > 2) {
        reasons.push('Too many links in message')
      }
    }

    // Check for repeated characters
    if (/(.)\1{5,}/.test(text)) {
      reasons.push('Repeated characters detected')
    }

    return {
      isSpam: reasons.length > 0,
      reasons
    }
  }
}

/**
 * Constants for contact management
 */
export const MAX_MESSAGE_LENGTH = 2000
export const MAX_NAME_LENGTH = 100
export const MAX_COMPANY_LENGTH = 100
export const FOLLOWUP_TIMELINE = '24 hours'

/**
 * Contact submission utilities
 */
export class ContactSubmissionUtils {
  /**
   * Sort submissions by priority
   */
  static sortByPriority(submissions: ContactSubmissionModel[]): ContactSubmissionModel[] {
    return submissions.sort((a, b) => {
      const aFollowUp = a.needsFollowUp()
      const bFollowUp = b.needsFollowUp()

      // High-priority submissions first
      if (aFollowUp.needs && !bFollowUp.needs) return -1
      if (!aFollowUp.needs && bFollowUp.needs) return 1

      // Then by completeness score
      return b.completenessScore - a.completenessScore
    })
  }

  /**
   * Group submissions by investor type
   */
  static groupByInvestorType(submissions: ContactSubmissionModel[]): Record<string, ContactSubmissionModel[]> {
    return submissions.reduce((groups, submission) => {
      const type = submission.submission.investorType || 'unspecified'
      if (!groups[type]) groups[type] = []
      groups[type].push(submission)
      return groups
    }, {} as Record<string, ContactSubmissionModel[]>)
  }

  /**
   * Get submission statistics
   */
  static getStatistics(submissions: ContactSubmissionModel[]): {
    total: number
    byType: Record<string, number>
    needsFollowUp: number
    averageCompleteness: number
    topInterests: Array<{ section: string; count: number }>
  } {
    const stats = {
      total: submissions.length,
      byType: {} as Record<string, number>,
      needsFollowUp: 0,
      averageCompleteness: 0,
      topInterests: [] as Array<{ section: string; count: number }>
    }

    if (submissions.length === 0) return stats

    // Calculate type distribution
    submissions.forEach(submission => {
      const type = submission.submission.investorType || 'unspecified'
      stats.byType[type] = (stats.byType[type] || 0) + 1

      if (submission.needsFollowUp().needs) {
        stats.needsFollowUp++
      }
    })

    // Calculate average completeness
    const totalCompleteness = submissions.reduce((sum, submission) =>
      sum + submission.completenessScore, 0)
    stats.averageCompleteness = Math.round(totalCompleteness / submissions.length)

    // Calculate top interests
    const interestCounts: Record<string, number> = {}
    submissions.forEach(submission => {
      (submission.submission.interestedSections || []).forEach(section => {
        interestCounts[section] = (interestCounts[section] || 0) + 1
      })
    })

    stats.topInterests = Object.entries(interestCounts)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return stats
  }

  /**
   * Format timeline for display
   */
  static getFollowUpTimeline(): string {
    return FOLLOWUP_TIMELINE
  }

  /**
   * Check if submission is recent
   */
  static isRecentSubmission(submittedAt: string, hoursThreshold: number = 24): boolean {
    const submitted = new Date(submittedAt)
    const now = new Date()
    const diffHours = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60)

    return diffHours <= hoursThreshold
  }
}