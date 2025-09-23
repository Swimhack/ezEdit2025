/**
 * Pitch Deck Sections API endpoint
 * Handles retrieval of all pitch deck sections
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
 * GET /api/pitch-deck/sections
 * Retrieve all pitch deck sections in presentation order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHidden = searchParams.get('include_hidden') === 'true'

    // Create service instance
    const pitchDeckService = new PitchDeckService()

    // Get sections with options
    const result = await pitchDeckService.getSections({
      includeHidden,
      orderBy: 'order'
    })

    if (!result.success) {
      const status = result.error?.error === 'NOT_FOUND' ? 404 :
                     result.error?.error === 'VALIDATION_ERROR' ? 400 : 500

      return NextResponse.json(result.error, { status })
    }

    // Return successful response with metadata
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error in GET /api/pitch-deck/sections:', error)

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while retrieving sections'
    }, { status: 500 })
  }
}