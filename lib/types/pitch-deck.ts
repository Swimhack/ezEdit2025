/**
 * Investor Pitch Deck Types
 * Comprehensive type definitions for investor presentation content management
 */

import { z } from 'zod'

// === Pitch Section Types ===

export interface PitchSection {
  id: string
  title: string
  order: number
  content: PitchSectionContent
  metadata: PitchSectionMetadata
  isVisible: boolean
}

export interface PitchSectionContent {
  headline: string
  subheadline?: string
  blocks: ContentBlock[]
  backgroundStyle?: BackgroundStyle
  layout: LayoutType
}

export interface PitchSectionMetadata {
  lastUpdated?: string
  version?: number
  author?: string
  tags?: string[]
}

// === Content Block Types ===

export interface ContentBlock {
  id: string
  type: ContentBlockType
  content: TextBlock | ImageBlock | ChartBlock | VideoBlock | ButtonBlock
  position?: Position
  animation?: AnimationConfig
}

export type ContentBlockType = 'text' | 'image' | 'chart' | 'video' | 'button' | 'quote' | 'metrics'

export interface TextBlock {
  text: string
  formatting?: TextStyle
}

export interface ImageBlock {
  src: string
  alt: string
  caption?: string
}

export interface ChartBlock {
  chartType: ChartType
  data: object // Chart.js compatible data structure
}

export interface VideoBlock {
  src: string
  poster?: string
  autoplay?: boolean
}

export interface ButtonBlock {
  text: string
  action: ActionConfig
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'funnel'

// === Style and Layout Types ===

export interface BackgroundStyle {
  color?: string
  gradient?: string
  image?: string
}

export interface Position {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface AnimationConfig {
  type?: AnimationType
  duration?: number
  delay?: number
  easing?: string
}

export type AnimationType = 'fade' | 'slide' | 'zoom' | 'none'

export interface TextStyle {
  fontSize?: string
  fontWeight?: string
  color?: string
  textAlign?: TextAlign
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export interface ActionConfig {
  type: ActionType
  target?: string
  params?: object
}

export type ActionType = 'navigate' | 'external_link' | 'contact_form' | 'download'

export type LayoutType = 'hero' | 'two_column' | 'three_column' | 'centered' | 'full_bleed'

// === Presentation Configuration Types ===

export interface PresentationConfig {
  theme: ThemeConfig
  navigation: NavigationConfig
  analytics?: AnalyticsConfig
  seo?: SEOConfig
}

export interface ThemeConfig {
  primary: string
  secondary: string
  background: string
  text: string
  fonts?: {
    heading?: string
    body?: string
  }
}

export interface NavigationConfig {
  showProgress?: boolean
  enableKeyboard?: boolean
  autoAdvance?: boolean
  showSlideNumbers?: boolean
}

export interface AnalyticsConfig {
  enabled?: boolean
  trackingId?: string
  retentionDays?: number
}

export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
}

// === Analytics Types ===

export interface ViewerAnalytics {
  sessionId?: string
  event: AnalyticsEvent
  sectionId?: string
  timestamp: string
  duration?: number
  metadata?: AnalyticsMetadata
}

export type AnalyticsEvent = 'section_view' | 'time_spent' | 'navigation' | 'contact_form' | 'asset_download'

export interface AnalyticsMetadata {
  device?: string
  referrer?: string
}

// === Contact Submission Types ===

export interface ContactSubmission {
  id?: string
  name: string
  email: string
  company?: string
  investorType?: InvestorType
  message?: string
  interestedSections?: string[]
  submittedAt?: string
  followupStatus?: string
}

export type InvestorType = 'angel' | 'vc' | 'strategic' | 'family_office' | 'other'

// === Asset File Types ===

export interface AssetFile {
  id: string
  filename: string
  type: AssetType
  url: string
  size: number
  metadata?: AssetMetadata
  uploadedAt: string
  tags?: string[]
}

export type AssetType = 'image' | 'video' | 'document' | 'logo'

export interface AssetMetadata {
  dimensions?: {
    width: number
    height: number
  }
  duration?: number
  format?: string
}

// === API Response Types ===

export interface PitchDeckApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  metadata?: object
}

export interface PitchSectionsResponse {
  success: boolean
  data: PitchSection[]
  metadata: {
    total_sections: number
    visible_sections: number
    last_updated: string
  }
}

export interface ErrorResponse {
  error: string
  message: string
  details?: {
    field?: string
    code?: string
  }
}

// === Validation Schemas ===

export const pitchSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  order: z.number().int().min(1, 'Order must be a positive integer'),
  content: z.object({
    headline: z.string().min(1, 'Headline is required').max(100, 'Headline must be 100 characters or less'),
    subheadline: z.string().max(200, 'Subheadline must be 200 characters or less').optional(),
    blocks: z.array(z.object({
      id: z.string().min(1, 'Block ID is required'),
      type: z.enum(['text', 'image', 'chart', 'video', 'button', 'quote', 'metrics']),
      content: z.object({}).passthrough() // Allow any content structure
    })).min(1, 'At least one content block is required').max(10, 'Maximum 10 content blocks allowed'),
    layout: z.enum(['hero', 'two_column', 'three_column', 'centered', 'full_bleed'])
  }),
  metadata: z.object({
    lastUpdated: z.string().datetime().optional(),
    version: z.number().int().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional(),
  isVisible: z.boolean()
})

export const contactSubmissionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Invalid email format'),
  company: z.string().max(100, 'Company name must be 100 characters or less').optional(),
  investorType: z.enum(['angel', 'vc', 'strategic', 'family_office', 'other']).optional(),
  message: z.string().max(2000, 'Message must be 2000 characters or less').optional(),
  interestedSections: z.array(z.string()).optional()
})

export const analyticsEventSchema = z.object({
  sessionId: z.string().optional(),
  event: z.enum(['section_view', 'time_spent', 'navigation', 'contact_form', 'asset_download']),
  sectionId: z.string().optional(),
  timestamp: z.string().datetime(),
  duration: z.number().int().min(0).optional(),
  metadata: z.object({
    device: z.string().optional(),
    referrer: z.string().url().optional()
  }).optional()
})

// === Default Values ===

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#2563eb',
  secondary: '#64748b',
  background: '#ffffff',
  text: '#1e293b',
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif'
  }
}

export const DEFAULT_NAVIGATION: NavigationConfig = {
  showProgress: true,
  enableKeyboard: true,
  autoAdvance: false,
  showSlideNumbers: true
}

export const DEFAULT_ANALYTICS: AnalyticsConfig = {
  enabled: true,
  retentionDays: 730
}

export const DEFAULT_ANIMATION: AnimationConfig = {
  type: 'fade',
  duration: 0.5,
  delay: 0,
  easing: 'ease-in-out'
}