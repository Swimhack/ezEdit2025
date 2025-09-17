import fs from 'fs'
import path from 'path'

export interface WebsiteRecord {
  id: string
  userId: string
  name: string
  url: string
  type: 'FTP' | 'SFTP' | 'FTPS'
  host: string
  username: string
  password: string
  port: string
  path: string
}

const dataDir = path.join(process.cwd(), '.data')
const websitesFile = path.join(dataDir, 'websites.json')

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(websitesFile)) fs.writeFileSync(websitesFile, '[]', 'utf8')
}

export function listWebsites(userId: string): WebsiteRecord[] {
  ensureStore()
  const raw = fs.readFileSync(websitesFile, 'utf8')
  const items: WebsiteRecord[] = JSON.parse(raw)
  return items.filter(w => w.userId === userId)
}

export function getWebsite(userId: string, id: string): WebsiteRecord | undefined {
  ensureStore()
  const raw = fs.readFileSync(websitesFile, 'utf8')
  const items: WebsiteRecord[] = JSON.parse(raw)
  return items.find(w => w.userId === userId && w.id === id)
}

export function createWebsite(userId: string, input: Omit<WebsiteRecord, 'id' | 'userId'>): WebsiteRecord {
  ensureStore()
  const raw = fs.readFileSync(websitesFile, 'utf8')
  const items: WebsiteRecord[] = JSON.parse(raw)
  const record: WebsiteRecord = { id: `w_${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`, userId, ...input }
  items.push(record)
  fs.writeFileSync(websitesFile, JSON.stringify(items, null, 2), 'utf8')
  return record
}


