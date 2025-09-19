import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { Readable } from 'stream'
import { addConnection, getConnection, type FTPConnection, queueFTPOperation } from '@/lib/ftp-connections'
import { getWebsite } from '@/lib/websites-memory-store'

export async function POST(request: NextRequest) {
  const { websiteId, filePath, content } = await request.json()
  const userId = 'demo-user'
  if (!websiteId || !filePath || typeof content !== 'string') {
    return NextResponse.json({ error: 'websiteId, filePath, content are required' }, { status: 400 })
  }

  const website = getWebsite(userId, websiteId)
  if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 })

  const connectionId = `${website.host}:${website.port}:${website.username}`
  let connection = getConnection(connectionId)
  if (!connection) {
    const client = new FTPClient()
    try {
      await client.access({ host: website.host.trim(), port: parseInt(website.port, 10) || 21, user: website.username, password: website.password, secure: false })
      const conn: FTPConnection = { id: connectionId, host: website.host.trim(), port: parseInt(website.port, 10) || 21, username: website.username, password: website.password, protocol: 'ftp', name: connectionId, connected: true, lastConnected: new Date().toISOString(), client, lastActivity: Date.now(), taskQueue: Promise.resolve() }
      addConnection(conn)
      connection = conn
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect'
      if (msg.includes('530')) return NextResponse.json({ error: 'Authentication failed (530). Verify FTP username/password.' }, { status: 401 })
      return NextResponse.json({ error: `Connection failed: ${msg}` }, { status: 400 })
    }
  }

  try {
    const buffer = Buffer.from(content, 'utf8')
    const stream = Readable.from(buffer)
    await queueFTPOperation(connection, async () => {
      await connection!.client.uploadFrom(stream, filePath)
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    const msg = err?.message || 'Failed to save file'
    let status = 500
    if (msg.includes('ECONNRESET') || msg.includes('Client is closed')) status = 503
    if (msg.includes('530')) status = 401
    return NextResponse.json({ error: msg }, { status })
  }
}

