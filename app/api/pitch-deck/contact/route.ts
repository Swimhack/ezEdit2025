/**
 * Pitch Deck Contact Form API endpoint
 * Handles investor inquiry and contact information processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { PitchDeckService } from '../../../../lib/services/pitch-deck-service'
import { InvestorType } from '../../../../lib/types/pitch-deck'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

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
 * Rate limiting middleware
 */
function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const clientData = rateLimitMap.get(ip)

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    })
    return { allowed: true }
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: clientData.resetTime }
  }

  // Increment count
  clientData.count++
  return { allowed: true }
}

/**
 * POST /api/pitch-deck/contact
 * Process investor inquiry and contact information
 */
export async function POST(request: NextRequest) {
  try {
    // Extract IP address for rate limiting
    const ip = (request as any).ip ||
              request.headers.get('x-forwarded-for')?.split(',')[0] ||
              request.headers.get('x-real-ip') ||
              'unknown'

    // Apply rate limiting
    const rateLimitCheck = checkRateLimit(ip)
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime!
      const remainingSeconds = Math.ceil((resetTime - Date.now()) / 1000)

      return NextResponse.json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Please try again in ${remainingSeconds} seconds.`,
        details: { retryAfter: remainingSeconds }
      }, {
        status: 429,
        headers: {
          'Retry-After': remainingSeconds.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        }
      })
    }

    const body = await request.json()
    const {
      name,
      email,
      company,
      investorType,
      message,
      interestedSections
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Name and email are required',
        details: { field: !name ? 'name' : 'email' }
      }, { status: 400 })
    }

    // Validate name length
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Name must be between 1 and 100 characters',
        details: { field: 'name' }
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: { field: 'email' }
      }, { status: 400 })
    }

    // Validate company length if provided
    if (company && (typeof company !== 'string' || company.trim().length > 100)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Company name must be 100 characters or less',
        details: { field: 'company' }
      }, { status: 400 })
    }

    // Validate investor type if provided
    const validInvestorTypes: InvestorType[] = ['angel', 'vc', 'strategic', 'family_office', 'other']
    if (investorType && !validInvestorTypes.includes(investorType)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid investor type',
        details: {
          field: 'investorType',
          validValues: validInvestorTypes
        }
      }, { status: 400 })
    }

    // Validate message length if provided
    if (message && (typeof message !== 'string' || message.trim().length > 2000)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Message must be 2000 characters or less',
        details: { field: 'message' }
      }, { status: 400 })
    }

    // Validate interested sections if provided
    if (interestedSections && (!Array.isArray(interestedSections) ||
        interestedSections.some(section => typeof section !== 'string'))) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Interested sections must be an array of strings',
        details: { field: 'interestedSections' }
      }, { status: 400 })
    }

    // Extract request metadata
    const requestMetadata = {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: body.sessionId
    }

    // Create service instance
    const pitchDeckService = new PitchDeckService()

    // Submit contact form
    const result = await pitchDeckService.submitContactForm({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim(),
      investorType,
      message: message?.trim(),
      interestedSections
    }, requestMetadata)

    if (!result.success) {
      const status = result.error?.error === 'VALIDATION_ERROR' ? 400 : 500

      return NextResponse.json(result.error, { status })
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Thank you for your interest. We'll be in touch soon.",
      data: result.data
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error in POST /api/pitch-deck/contact:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while processing your request'
    }, { status: 500 })
  }
}

// Clean up rate limit map periodically (simple cleanup)
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW_MS)
