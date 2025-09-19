import { NextRequest, NextResponse } from 'next/server'
import { listWebsites, createWebsite, type WebsiteRecord } from '@/lib/websites-memory-store'
import { createRequestLogger } from '@/lib/logger'
import { extractErrorContext, createErrorResponse } from '@/lib/api-error-handler'
import { randomUUID } from 'crypto'

// TEMP auth: derive userId from a fixed header/cookie placeholder until real auth wired
function getUserId() {
  // In a real app, decode session. For now use a fixed demo id.
  return 'demo-user'
}

export async function GET(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    const userId = getUserId()

    logger.info('Listing websites', {
      correlationId,
      userId,
      operation: 'websites_list'
    })

    const websites = listWebsites(userId)

    logger.info('Websites listed successfully', {
      correlationId,
      userId,
      websiteCount: websites.length,
      operation: 'websites_list_success'
    })

    return NextResponse.json({ websites })
  } catch (error) {
    logger.error('Failed to list websites', error as Error, 'websites_list_error')
    return createErrorResponse(
      error instanceof Error ? error : new Error('Failed to list websites'),
      context
    )
  }
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    const userId = getUserId()
    const body = await request.json()

    logger.info('Creating website', {
      correlationId,
      userId,
      websiteName: body.name,
      operation: 'website_create'
    })

    const required = ['name','url','type','host','username','password','port','path']
    for (const key of required) {
      if (!body[key]) {
        logger.warn('Missing required field for website creation', {
          correlationId,
          userId,
          missingField: key,
          operation: 'website_create_validation_error'
        })
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

    logger.info('Website created successfully', {
      correlationId,
      userId,
      websiteId: record.id,
      websiteName: record.name,
      host: record.host,
      operation: 'website_create_success'
    })

    const { password, ...safe } = record
    return NextResponse.json({ website: safe })

  } catch (error) {
    logger.error('Failed to create website', error as Error, 'website_create_error')
    return createErrorResponse(
      error instanceof Error ? error : new Error('Failed to create website'),
      context
    )
  }
}

