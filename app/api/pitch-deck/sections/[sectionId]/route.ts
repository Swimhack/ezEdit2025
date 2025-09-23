/**
 * Pitch Deck Section by ID API endpoint
 * Handles retrieval of specific pitch deck section
 */

import { NextRequest, NextResponse } from 'next/server'
import { PitchDeckService } from '../../../../../lib/services/pitch-deck-service'

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
 * GET /api/pitch-deck/sections/[sectionId]
 * Retrieve detailed content for a specific section
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params

    // Validate section ID parameter
    if (!sectionId || typeof sectionId !== 'string') {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Section ID is required',
        details: { field: 'sectionId' }
      }, { status: 400 })
    }

    // Create service instance
    const pitchDeckService = new PitchDeckService()

    // Get specific section
    const result = await pitchDeckService.getSection(sectionId)

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
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error(`Error in GET /api/pitch-deck/sections/[sectionId]:`, error)

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while retrieving section'
    }, { status: 500 })
  }
}