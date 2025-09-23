/**
 * Pitch Section Model with Validation Rules
 * Enterprise-grade pitch deck section management for investor presentations
 */

import { z } from 'zod'
import {
  PitchSection,
  PitchSectionContent,
  ContentBlock,
  ContentBlockType,
  LayoutType,
  pitchSectionSchema,
  DEFAULT_ANIMATION
} from '../types/pitch-deck'

/**
 * Pitch Section Entity with validation and business logic
 */
export class PitchSectionModel {
  constructor(private data: PitchSection) {
    this.validate()
  }

  /**
   * Validate pitch section data
   */
  private validate(): void {
    const result = pitchSectionSchema.safeParse(this.data)
    if (!result.success) {
      throw new Error(`Invalid pitch section data: ${result.error.message}`)
    }
  }

  /**
   * Get pitch section data
   */
  get section(): PitchSection {
    return { ...this.data }
  }

  /**
   * Check if section is visible
   */
  get isVisible(): boolean {
    return this.data.isVisible
  }

  /**
   * Get section order
   */
  get order(): number {
    return this.data.order
  }

  /**
   * Get content blocks count
   */
  get blocksCount(): number {
    return this.data.content.blocks.length
  }

  /**
   * Check if section has required content
   */
  get hasRequiredContent(): boolean {
    return !!(
      this.data.content.headline &&
      this.data.content.blocks.length > 0
    )
  }

  /**
   * Get content blocks by type
   */
  getBlocksByType(type: ContentBlockType): ContentBlock[] {
    return this.data.content.blocks.filter(block => block.type === type)
  }

  /**
   * Check if section is ready for presentation
   */
  canPresent(): { ready: boolean; issues?: string[] } {
    const issues: string[] = []

    if (!this.data.content.headline) {
      issues.push('Section headline is required')
    }

    if (this.data.content.blocks.length === 0) {
      issues.push('Section must have at least one content block')
    }

    if (!this.data.isVisible) {
      issues.push('Section is hidden')
    }

    return {
      ready: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    }
  }

  /**
   * Update section content
   */
  updateContent(content: Partial<PitchSectionContent>): PitchSectionModel {
    const updatedContent = {
      ...this.data.content,
      ...content
    }

    return new PitchSectionModel({
      ...this.data,
      content: updatedContent,
      metadata: {
        ...this.data.metadata,
        lastUpdated: new Date().toISOString(),
        version: (this.data.metadata?.version || 0) + 1
      }
    })
  }

  /**
   * Add content block
   */
  addBlock(block: ContentBlock): PitchSectionModel {
    if (this.data.content.blocks.length >= 10) {
      throw new Error('Maximum 10 content blocks allowed per section')
    }

    const newBlocks = [...this.data.content.blocks, block]

    return this.updateContent({ blocks: newBlocks })
  }

  /**
   * Remove content block
   */
  removeBlock(blockId: string): PitchSectionModel {
    const newBlocks = this.data.content.blocks.filter(block => block.id !== blockId)

    if (newBlocks.length === 0) {
      throw new Error('Section must have at least one content block')
    }

    return this.updateContent({ blocks: newBlocks })
  }

  /**
   * Update content block
   */
  updateBlock(blockId: string, updates: Partial<ContentBlock>): PitchSectionModel {
    const newBlocks = this.data.content.blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    )

    return this.updateContent({ blocks: newBlocks })
  }

  /**
   * Toggle section visibility
   */
  toggleVisibility(): PitchSectionModel {
    return new PitchSectionModel({
      ...this.data,
      isVisible: !this.data.isVisible,
      metadata: {
        ...this.data.metadata,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  /**
   * Update section order
   */
  updateOrder(newOrder: number): PitchSectionModel {
    if (newOrder < 1) {
      throw new Error('Section order must be a positive integer')
    }

    return new PitchSectionModel({
      ...this.data,
      order: newOrder,
      metadata: {
        ...this.data.metadata,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  /**
   * Add metadata tag
   */
  addTag(tag: string): PitchSectionModel {
    const currentTags = this.data.metadata?.tags || []

    if (currentTags.includes(tag)) {
      return this // Tag already exists
    }

    return new PitchSectionModel({
      ...this.data,
      metadata: {
        ...this.data.metadata,
        tags: [...currentTags, tag],
        lastUpdated: new Date().toISOString()
      }
    })
  }

  /**
   * Remove metadata tag
   */
  removeTag(tag: string): PitchSectionModel {
    const currentTags = this.data.metadata?.tags || []
    const newTags = currentTags.filter(t => t !== tag)

    return new PitchSectionModel({
      ...this.data,
      metadata: {
        ...this.data.metadata,
        tags: newTags,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  /**
   * Create a sanitized version for API responses
   */
  toApiResponse(): PitchSection {
    return {
      id: this.data.id,
      title: this.data.title,
      order: this.data.order,
      content: this.data.content,
      metadata: this.data.metadata || {},
      isVisible: this.data.isVisible
    }
  }

  /**
   * Create for database storage
   */
  toDatabaseRow(): Omit<PitchSection, 'id'> {
    const { id, ...dbData } = this.data
    return dbData
  }

  /**
   * Get summary for listing views
   */
  getSummary(): {
    id: string
    title: string
    order: number
    blocksCount: number
    isVisible: boolean
    lastUpdated?: string
  } {
    return {
      id: this.data.id,
      title: this.data.title,
      order: this.data.order,
      blocksCount: this.data.content.blocks.length,
      isVisible: this.data.isVisible,
      lastUpdated: this.data.metadata?.lastUpdated
    }
  }
}

/**
 * Factory for creating new pitch sections
 */
export class PitchSectionFactory {
  /**
   * Create a new pitch section with default values
   */
  static create(data: {
    id: string
    title: string
    order: number
    layout?: LayoutType
    author?: string
  }): PitchSectionModel {
    const now = new Date().toISOString()

    const sectionData: PitchSection = {
      id: data.id,
      title: data.title,
      order: data.order,
      content: {
        headline: data.title,
        blocks: [],
        layout: data.layout || 'centered'
      },
      metadata: {
        lastUpdated: now,
        version: 1,
        author: data.author,
        tags: []
      },
      isVisible: true
    }

    return new PitchSectionModel(sectionData)
  }

  /**
   * Create from database row
   */
  static fromDatabase(dbRow: PitchSection): PitchSectionModel {
    return new PitchSectionModel(dbRow)
  }

  /**
   * Create default sections for a new pitch deck
   */
  static createDefaultSections(author?: string): PitchSectionModel[] {
    const defaultSections = [
      { id: 'problem', title: 'Problem & Opportunity', layout: 'hero' as LayoutType },
      { id: 'solution', title: 'Solution Overview', layout: 'two_column' as LayoutType },
      { id: 'market', title: 'Market Analysis', layout: 'two_column' as LayoutType },
      { id: 'business-model', title: 'Business Model', layout: 'centered' as LayoutType },
      { id: 'competition', title: 'Competitive Analysis', layout: 'three_column' as LayoutType },
      { id: 'product', title: 'Product Roadmap', layout: 'two_column' as LayoutType },
      { id: 'go-to-market', title: 'Go-to-Market Strategy', layout: 'two_column' as LayoutType },
      { id: 'financials', title: 'Financial Projections', layout: 'centered' as LayoutType },
      { id: 'team', title: 'Team', layout: 'three_column' as LayoutType },
      { id: 'funding', title: 'Funding Requirements', layout: 'centered' as LayoutType },
      { id: 'use-of-funds', title: 'Use of Funds', layout: 'two_column' as LayoutType },
      { id: 'contact', title: 'Next Steps', layout: 'hero' as LayoutType }
    ]

    return defaultSections.map((section, index) =>
      this.create({
        id: section.id,
        title: section.title,
        order: index + 1,
        layout: section.layout,
        author
      })
    )
  }

  /**
   * Validate section ID format
   */
  static validateId(id: string): { valid: boolean; error?: string } {
    if (!id || id.trim().length === 0) {
      return { valid: false, error: 'Section ID is required' }
    }

    if (!/^[a-z0-9-]+$/.test(id)) {
      return { valid: false, error: 'Section ID must contain only lowercase letters, numbers, and hyphens' }
    }

    if (id.length > 50) {
      return { valid: false, error: 'Section ID must be 50 characters or less' }
    }

    return { valid: true }
  }

  /**
   * Validate content block structure
   */
  static validateContentBlock(block: ContentBlock): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!block.id || block.id.trim().length === 0) {
      errors.push('Block ID is required')
    }

    if (!block.type) {
      errors.push('Block type is required')
    }

    if (!['text', 'image', 'chart', 'video', 'button', 'quote', 'metrics'].includes(block.type)) {
      errors.push('Invalid block type')
    }

    if (!block.content) {
      errors.push('Block content is required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Constants for section management
 */
export const MAX_CONTENT_BLOCKS = 10
export const MAX_SECTIONS_PER_DECK = 15
export const REQUIRED_SECTIONS = ['problem', 'solution', 'market', 'team', 'funding']

/**
 * Section utilities
 */
export class SectionUtils {
  /**
   * Sort sections by order
   */
  static sortByOrder(sections: PitchSectionModel[]): PitchSectionModel[] {
    return sections.sort((a, b) => a.order - b.order)
  }

  /**
   * Get visible sections only
   */
  static getVisibleSections(sections: PitchSectionModel[]): PitchSectionModel[] {
    return sections.filter(section => section.isVisible)
  }

  /**
   * Validate complete pitch deck
   */
  static validatePitchDeck(sections: PitchSectionModel[]): {
    valid: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []

    if (sections.length === 0) {
      errors.push('Pitch deck must have at least one section')
      return { valid: false, warnings, errors }
    }

    if (sections.length > MAX_SECTIONS_PER_DECK) {
      warnings.push(`Pitch deck has ${sections.length} sections. Consider keeping it under ${MAX_SECTIONS_PER_DECK} for optimal presentation`)
    }

    // Check for required sections
    const sectionIds = sections.map(s => s.section.id)
    const missingRequired = REQUIRED_SECTIONS.filter(req => !sectionIds.includes(req))

    if (missingRequired.length > 0) {
      warnings.push(`Missing recommended sections: ${missingRequired.join(', ')}`)
    }

    // Check for duplicate orders
    const orders = sections.map(s => s.order)
    const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)

    if (duplicateOrders.length > 0) {
      errors.push(`Duplicate section orders found: ${duplicateOrders.join(', ')}`)
    }

    // Check individual sections
    sections.forEach(section => {
      const sectionCheck = section.canPresent()
      if (!sectionCheck.ready && sectionCheck.issues) {
        warnings.push(`Section "${section.section.title}": ${sectionCheck.issues.join(', ')}`)
      }
    })

    return {
      valid: errors.length === 0,
      warnings,
      errors
    }
  }

  /**
   * Reorder sections automatically
   */
  static reorderSections(sections: PitchSectionModel[]): PitchSectionModel[] {
    return sections
      .sort((a, b) => a.order - b.order)
      .map((section, index) => section.updateOrder(index + 1))
  }
}