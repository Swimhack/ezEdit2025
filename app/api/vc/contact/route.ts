import { NextRequest, NextResponse } from 'next/server'
import { pitchDeckService } from '@/lib/services/pitch-deck-service'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const meta = { ipAddress: req.headers.get('x-forwarded-for') || undefined, userAgent: req.headers.get('user-agent') || undefined }
  const result = await pitchDeckService.submitContactForm({
    name: body.name,
    email: body.email,
    company: body.company,
    investorType: body.investorType,
    message: body.message,
    interestedSections: body.interestedSections
  }, meta)
  return NextResponse.json(result.success ? result.data : result.error, { status: result.success ? 201 : 400 })
}



