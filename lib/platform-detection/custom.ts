/**
 * Custom Platform Detection
 * Fallback detection methods using HTTP headers, HTML patterns, DNS, etc.
 */

export interface PlatformDetectionResult {
  platform: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown'
  confidence: number
  method: 'api' | 'custom' | 'manual'
  version?: string
  detectionData?: Record<string, any>
}

class CustomDetection {
  /**
   * Detect platform using custom methods
   * Checks HTTP headers, HTML content, domain patterns, etc.
   */
  async detect(domain: string): Promise<PlatformDetectionResult | null> {
    try {
      // Normalize domain
      const normalizedDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .split('/')[0]

      // Try HTTPS first, then HTTP
      const urls = [
        `https://${normalizedDomain}`,
        `http://${normalizedDomain}`
      ]

      let html: string | null = null
      let headers: Headers | null = null

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; EzEdit Platform Detector)'
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })

          if (response.ok) {
            html = await response.text()
            headers = response.headers
            break
          }
        } catch (error) {
          // Try next URL
          continue
        }
      }

      if (!html && !headers) {
        return null
      }

      const detectionData: Record<string, any> = {}
      let platform: 'wordpress' | 'shopify' | 'wix' | 'unknown' = 'unknown'
      let confidence = 0.3 // Lower confidence for custom detection

      // Check domain patterns
      if (normalizedDomain.includes('.myshopify.com')) {
        return {
          platform: 'shopify',
          confidence: 1.0,
          method: 'custom',
          detectionData: { method: 'domain_pattern' }
        }
      }

      if (normalizedDomain.includes('.wixsite.com') || normalizedDomain.includes('.wix.com')) {
        return {
          platform: 'wix',
          confidence: 1.0,
          method: 'custom',
          detectionData: { method: 'domain_pattern' }
        }
      }

      // Check HTTP headers
      if (headers) {
        const poweredBy = headers.get('x-powered-by')?.toLowerCase() || ''
        const server = headers.get('server')?.toLowerCase() || ''

        if (poweredBy.includes('wordpress') || server.includes('wordpress')) {
          platform = 'wordpress'
          confidence = 0.7
          detectionData.method = 'http_headers'
        }
      }

      // Check HTML content
      if (html) {
        const htmlLower = html.toLowerCase()

        // WordPress detection
        if (htmlLower.includes('/wp-content/') || 
            htmlLower.includes('/wp-includes/') ||
            htmlLower.includes('wp-json') ||
            htmlLower.includes('wordpress')) {
          platform = 'wordpress'
          confidence = Math.max(confidence, 0.8)
          detectionData.method = 'html_content'
          detectionData.indicators = ['wp-content', 'wp-includes', 'wp-json']
        }

        // Shopify detection
        if (htmlLower.includes('shopify') ||
            htmlLower.includes('shopify.shop') ||
            htmlLower.includes('cdn.shopify.com')) {
          platform = 'shopify'
          confidence = Math.max(confidence, 0.8)
          detectionData.method = 'html_content'
          detectionData.indicators = ['shopify', 'cdn.shopify.com']
        }

        // Wix detection
        if (htmlLower.includes('wix.com') ||
            htmlLower.includes('wixstatic.com') ||
            htmlLower.includes('wix-code')) {
          platform = 'wix'
          confidence = Math.max(confidence, 0.8)
          detectionData.method = 'html_content'
          detectionData.indicators = ['wix.com', 'wixstatic.com']
        }

        // Check meta tags
        const generatorMatch = html.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i)
        if (generatorMatch) {
          const generator = generatorMatch[1].toLowerCase()
          if (generator.includes('wordpress')) {
            platform = 'wordpress'
            confidence = Math.max(confidence, 0.9)
            detectionData.method = 'meta_tags'
            detectionData.generator = generatorMatch[1]
          } else if (generator.includes('wix')) {
            platform = 'wix'
            confidence = Math.max(confidence, 0.9)
            detectionData.method = 'meta_tags'
            detectionData.generator = generatorMatch[1]
          }
        }
      }

      if (platform !== 'unknown') {
        return {
          platform,
          confidence,
          method: 'custom',
          detectionData
        }
      }

      return null
    } catch (error) {
      console.error('Custom platform detection failed:', error)
      return null
    }
  }
}

export const customDetection = new CustomDetection()









