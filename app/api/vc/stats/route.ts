import { NextRequest, NextResponse } from 'next/server'
import { pitchDeckService } from '@/lib/services/pitch-deck-service'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined
  const result = await pitchDeckService.getAnalyticsSummary({ sessionId, dateFrom: from || undefined, dateTo: to || undefined })
  return NextResponse.json(result.success ? result.data : result.error, { status: result.success ? 200 : 400 })
}



