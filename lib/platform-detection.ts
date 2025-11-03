/**
 * Platform Detection Service
 * Hybrid detection: WhatCMS API first, custom detection fallback, cache results
 */

import { whatCMSClient } from './platform-detection/whatcms'
import { customDetection } from './platform-detection/custom'
import { createClient } from '@supabase/supabase-js'

export interface PlatformDetectionResult {
  platform: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown'
  confidence: number
  method: 'api' | 'custom' | 'manual'
  version?: string
  detectionData?: Record<string, any>
}

class PlatformDetectionService {
  private supabase: ReturnType<typeof createClient> | null = null
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey)
    }
  }

  /**
   * Normalize domain for consistent lookup
   */
  private normalizeDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .split('/')[0]
      .toLowerCase()
  }

  /**
   * Check cache for existing detection result
   */
  private async getCachedDetection(domain: string): Promise<PlatformDetectionResult | null> {
    if (!this.supabase) return null

    try {
      const normalizedDomain = this.normalizeDomain(domain)
      const { data, error } = await this.supabase
        .from('platform_detections')
        .select('*')
        .eq('domain', normalizedDomain)
        .single()

      if (error || !data) return null

      // Check if cache is still valid
      const lastChecked = new Date(data.last_checked)
      const now = new Date()
      const age = now.getTime() - lastChecked.getTime()

      if (age < this.cacheTTL) {
        return {
          platform: data.detected_platform as PlatformDetectionResult['platform'],
          confidence: 0.8, // Cached results have slightly lower confidence
          method: 'api', // Assume API for cached
          detectionData: data.detection_data || {}
        }
      }

      return null
    } catch (error) {
      console.error('Error checking detection cache:', error)
      return null
    }
  }

  /**
   * Store detection result in cache
   */
  private async cacheDetection(
    domain: string,
    result: PlatformDetectionResult
  ): Promise<void> {
    if (!this.supabase) return

    try {
      const normalizedDomain = this.normalizeDomain(domain)
      
      await this.supabase
        .from('platform_detections')
        .upsert({
          domain: normalizedDomain,
          detected_platform: result.platform,
          detection_data: result.detectionData || {},
          last_checked: new Date().toISOString()
        }, {
          onConflict: 'domain'
        })
    } catch (error) {
      console.error('Error caching detection result:', error)
      // Don't throw - caching failure shouldn't break detection
    }
  }

  /**
   * Detect platform for a domain
   * Uses hybrid strategy: cache -> API -> custom -> unknown
   */
  async detect(domain: string): Promise<PlatformDetectionResult> {
    const normalizedDomain = this.normalizeDomain(domain)

    // Step 1: Check cache
    const cached = await this.getCachedDetection(normalizedDomain)
    if (cached) {
      return cached
    }

    // Step 2: Try WhatCMS API
    const apiResult = await whatCMSClient.detect(normalizedDomain)
    if (apiResult && apiResult.platform !== 'unknown' && apiResult.confidence > 0.5) {
      await this.cacheDetection(normalizedDomain, apiResult)
      return apiResult
    }

    // Step 3: Try custom detection
    const customResult = await customDetection.detect(normalizedDomain)
    if (customResult && customResult.platform !== 'unknown' && customResult.confidence > 0.5) {
      await this.cacheDetection(normalizedDomain, customResult)
      return customResult
    }

    // Step 4: Return unknown
    const unknownResult: PlatformDetectionResult = {
      platform: 'unknown',
      confidence: 0,
      method: 'manual',
      detectionData: {}
    }

    // Don't cache unknown results
    return unknownResult
  }

  /**
   * Get detection result (from cache or fresh)
   * If forceRefresh is true, bypasses cache
   */
  async getDetection(domain: string, forceRefresh: boolean = false): Promise<PlatformDetectionResult> {
    if (forceRefresh) {
      return this.detect(domain)
    }

    const cached = await this.getCachedDetection(domain)
    if (cached) {
      return cached
    }

    return this.detect(domain)
  }
}

export const platformDetection = new PlatformDetectionService()

