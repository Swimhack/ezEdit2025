import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { addConnection, getConnection, type FTPConnection, queueFTPOperation } from '@/lib/ftp-connections'
import { getWebsite } from '@/lib/websites-store'

export async function POST(request: NextRequest) {
  const { websiteId, filePath } = await request.json()
  const userId = 'demo-user'
  if (!websiteId || !filePath) {
    return NextResponse.json({ error: 'websiteId and filePath are required' }, { status: 400 })
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
    const chunks: Buffer[] = []
    await queueFTPOperation(connection, async () => {
      const writable: any = {
        write(chunk: any) { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)) },
        end() {}
      }
      await connection!.client.downloadTo(writable as any, filePath)
    })
    const content = Buffer.concat(chunks).toString('utf8')
    return NextResponse.json({ content })
  } catch (err: any) {
    const msg = err?.message || 'Failed to read file'
    let status = 500
    if (msg.includes('ECONNRESET') || msg.includes('Client is closed')) status = 503
    if (msg.includes('530')) status = 401
    if (msg.startsWith('55')) status = 403
    if (msg.startsWith('45')) status = 404
    return NextResponse.json({ error: msg }, { status })
  }
}

