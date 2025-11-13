import { NextRequest, NextResponse } from 'next/server'

// In-memory log storage (will reset on server restart)
const logs: any[] = []
const MAX_LOGS = 1000

export async function POST(request: NextRequest) {
  try {
    const log = await request.json()
    
    // Add timestamp
    log.timestamp = new Date().toISOString()
    log.serverTime = Date.now()
    
    // Store log
    logs.unshift(log)
    
    // Keep only last MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS)
    }
    
    // Also log to console
    console.log('[CLIENT LOG]', log.level?.toUpperCase(), log.message, log.data || '')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to log:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const level = searchParams.get('level')
  
  let filteredLogs = logs
  
  if (level) {
    filteredLogs = logs.filter(log => log.level === level)
  }
  
  return NextResponse.json({
    logs: filteredLogs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  })
}

export async function DELETE() {
  const count = logs.length
  logs.length = 0
  return NextResponse.json({ 
    success: true, 
    cleared: count,
    message: `Cleared ${count} logs`
  })
}
