import { NextResponse } from 'next/server'
import { pitchDeckService } from '@/lib/services/pitch-deck-service'

export async function GET() {
  const config = await pitchDeckService.getConfiguration()
  return NextResponse.json(config.success ? config.data : { error: 'SERVICE_ERROR' }, { status: config.success ? 200 : 500 })
}



