/**
 * Pitch Deck Analytics Event API endpoint
 * Handles recording of viewer engagement and interaction events
 */

import { NextRequest, NextResponse } from 'next/server'
import { PitchDeckService } from '../../../../../lib/services/pitch-deck-service'
import { AnalyticsEvent } from '../../../../../lib/types/pitch-deck'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  })
}

/**
 * POST /api/pitch-deck/analytics/event
 * Record viewer engagement and interaction events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, event, sectionId, timestamp, duration, metadata } = body

    // Validate required fields
    if (!event || !timestamp) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Event type and timestamp are required',
        details: { field: !event ? 'event' : 'timestamp' }
      }, { status: 400 })
    }

    // Validate event type
    const validEvents: AnalyticsEvent[] = [
      'section_view',
      'time_spent',
      'navigation',
      'contact_form',
      'asset_download'
    ]

    if (!validEvents.includes(event)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid event type',
        details: {
          field: 'event',
          validValues: validEvents
        }
      }, { status: 400 })
    }

    // Validate timestamp format
    try {
      new Date(timestamp).toISOString()
    } catch {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid timestamp format',
        details: { field: 'timestamp' }
      }, { status: 400 })
    }

    // Validate duration if provided
    if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Duration must be a positive number',
        details: { field: 'duration' }
      }, { status: 400 })
    }

    // Extract request metadata
    const requestMetadata = {
      ipAddress: (request as any).ip ||
                request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: sessionId
    }

    // Create service instance
    const pitchDeckService = new PitchDeckService()

    // Track the analytics event
    const result = await pitchDeckService.trackEvent({
      sessionId,
      event,
      sectionId,
      duration
    }, requestMetadata)

    if (!result.success) {
      const status = result.error?.error === 'VALIDATION_ERROR' ? 400 : 500

      return NextResponse.json(result.error, { status })
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error in POST /api/pitch-deck/analytics/event:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while tracking event'
    }, { status: 500 })
  }
}
