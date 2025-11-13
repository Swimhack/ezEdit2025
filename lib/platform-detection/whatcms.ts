/**
 * WhatCMS.org API Client
 * Primary method for platform detection
 */

export interface WhatCMSResponse {
  result: {
    code: number
    msg: string
    name?: string
    version?: string
    confidence?: number
  }
}

export interface PlatformDetectionResult {
  platform: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown'
  confidence: number
  method: 'api' | 'custom' | 'manual'
  version?: string
  detectionData?: Record<string, any>
}

class WhatCMSClient {
  private apiKey: string | null = null
  private baseUrl = 'https://whatcms.org/API'

  constructor() {
    this.apiKey = process.env.WHATCMS_API_KEY || null
  }

  /**
   * Detect platform using WhatCMS API
   */
  async detect(domain: string): Promise<PlatformDetectionResult | null> {
    if (!this.apiKey) {
      console.warn('WhatCMS API key not configured, skipping API detection')
      return null
    }

    try {
      // Normalize domain (remove protocol, www, trailing slash)
      const normalizedDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .split('/')[0] // Remove path

      const url = `${this.baseUrl}?key=${this.apiKey}&url=${encodeURIComponent(normalizedDomain)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`WhatCMS API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data: WhatCMSResponse = await response.json()

      if (data.result.code !== 200 || !data.result.name) {
        return null
      }

      // Map WhatCMS platform names to our platform enum
      const platformMap: Record<string, 'wordpress' | 'shopify' | 'wix' | 'unknown'> = {
        'WordPress': 'wordpress',
        'Shopify': 'shopify',
        'Wix': 'wix',
        'Wix.com': 'wix'
      }

      const detectedPlatform = platformMap[data.result.name] || 'unknown'
      const confidence = data.result.confidence ? data.result.confidence / 100 : 0.5

      return {
        platform: detectedPlatform,
        confidence,
        method: 'api',
        version: data.result.version,
        detectionData: {
          name: data.result.name,
          version: data.result.version,
          confidence: data.result.confidence
        }
      }
    } catch (error) {
      console.error('WhatCMS API request failed:', error)
      return null
    }
  }
}

export const whatCMSClient = new WhatCMSClient()









