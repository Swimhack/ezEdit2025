import { NextRequest, NextResponse } from 'next/server'
import { listWebsites, createWebsite, type WebsiteRecord } from '@/lib/websites-store'

// TEMP auth: derive userId from a fixed header/cookie placeholder until real auth wired
function getUserId() {
  // In a real app, decode session. For now use a fixed demo id.
  return 'demo-user'
}

export async function GET() {
  const userId = getUserId()
  const websites = listWebsites(userId)
  return NextResponse.json({ websites })
}

export async function POST(request: NextRequest) {
  const userId = getUserId()
  const body = await request.json()
  const required = ['name','url','type','host','username','password','port','path']
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 })
    }
  }

  const record = createWebsite(userId, {
    name: body.name,
    url: body.url,
    type: body.type,
    host: body.host.trim(),
    username: body.username,
    password: body.password,
    port: String(body.port || '21'),
    path: body.path || '/'
  })
  const { password, ...safe } = record
  return NextResponse.json({ website: safe })
}

