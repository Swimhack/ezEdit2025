import { NextRequest, NextResponse } from 'next/server'
import { appendErrorLog } from '@/lib/server-error-log'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    appendErrorLog({ source: 'client', ...payload })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    appendErrorLog({ source: 'client', parseError: e?.message })
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}



