import { NextRequest, NextResponse } from 'next/server'
import { pitchDeckService } from '@/lib/services/pitch-deck-service'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const meta = { ipAddress: req.headers.get('x-forwarded-for') || undefined, userAgent: req.headers.get('user-agent') || undefined }
  const result = await pitchDeckService.trackEvent({
    sessionId: body.sessionId,
    event: body.event,
    sectionId: body.sectionId,
    duration: body.duration
  }, meta)
  return NextResponse.json(result.success ? result.data : result.error, { status: result.success ? 201 : 400 })
}



