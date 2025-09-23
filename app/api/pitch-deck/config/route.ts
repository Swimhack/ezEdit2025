/**
 * Pitch Deck Configuration API endpoint
 * Handles retrieval of presentation settings and theme
 */

import { NextRequest, NextResponse } from 'next/server'
import { PitchDeckService } from '../../../../lib/services/pitch-deck-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  })
}

/**
 * GET /api/pitch-deck/config
 * Retrieve global presentation settings and theme
 */
export async function GET(request: NextRequest) {
  try {
    // Create service instance
    const pitchDeckService = new PitchDeckService()

    // Get presentation configuration
    const result = await pitchDeckService.getConfiguration()

    if (!result.success) {
      const status = result.error?.error === 'NOT_FOUND' ? 404 :
                     result.error?.error === 'VALIDATION_ERROR' ? 400 : 500

      return NextResponse.json(result.error, { status })
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result.data
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600', // Cache for 10 minutes (config changes less frequently)
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error in GET /api/pitch-deck/config:', error)

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while retrieving configuration'
    }, { status: 500 })
  }
}