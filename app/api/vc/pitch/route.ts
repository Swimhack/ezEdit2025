import { NextRequest, NextResponse } from 'next/server'
import { pitchDeckService } from '@/lib/services/pitch-deck-service'

export async function GET(req: NextRequest) {
  const sections = await pitchDeckService.getSections({ includeHidden: false, orderBy: 'order' })
  if (!sections.success) {
    return NextResponse.json(sections.error, { status: 500 })
  }
  const config = await pitchDeckService.getConfiguration()
  return NextResponse.json({ sections: sections.data, config: config.success ? config.data : undefined })
}


