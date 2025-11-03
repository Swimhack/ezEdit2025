import { NextRequest, NextResponse } from 'next/server'
import { platformDetection } from '@/lib/platform-detection'

export const dynamic = 'force-dynamic'

/**
 * POST /api/platform/detect
 * Detect platform for a given domain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Validate domain format (basic)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    
    if (!domainRegex.test(normalizedDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    const result = await platformDetection.detect(domain)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Platform detection error:', error)
    return NextResponse.json(
      { error: 'Failed to detect platform' },
      { status: 500 }
    )
  }
}

