import { NextRequest, NextResponse } from 'next/server'
import { getWebsite } from '@/lib/websites-store'

function getUserId() { return 'demo-user' }

export async function GET(_request: NextRequest, { params }: { params: { id: string }}) {
  const userId = getUserId()
  const website = getWebsite(userId, params.id)
  if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  const { password, ...safe } = website as any
  return NextResponse.json({ website: safe })
}

