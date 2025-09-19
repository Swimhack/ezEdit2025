import { NextRequest, NextResponse } from 'next/server'
import { readErrorLog } from '@/lib/server-error-log'

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams
  const limitParam = search.get('limit')
  const limit = limitParam ? Math.min(20000, Math.max(100, parseInt(limitParam, 10) || 5000)) : 5000
  const text = readErrorLog(limit)
  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
}



