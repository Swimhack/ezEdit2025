import fs from 'fs'
import path from 'path'

const logsDir = path.join(process.cwd(), '.logs')
const errorFile = path.join(logsDir, 'errors.log')

export function appendErrorLog(entry: any) {
  try {
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry
    }) + '\n'
    fs.appendFileSync(errorFile, line, 'utf8')
  } catch {}
}

export function readErrorLog(limit: number = 5000): string {
  try {
    if (!fs.existsSync(errorFile)) return ''
    const content = fs.readFileSync(errorFile, 'utf8')
    const lines = content.trim().split('\n')
    return lines.slice(-limit).join('\n')
  } catch {
    return ''
  }
}

export function getErrorFilePath(): string { return errorFile }



