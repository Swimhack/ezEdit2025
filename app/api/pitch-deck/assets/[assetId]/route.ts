/**
 * Pitch Deck Assets API endpoint
 * Handles retrieval of optimized assets (images, videos, documents)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  })
}

/**
 * GET /api/pitch-deck/assets/[assetId]
 * Retrieve optimized assets (images, videos, documents)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'medium'

    // Validate asset ID parameter
    if (!assetId || typeof assetId !== 'string') {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Asset ID is required',
        details: { field: 'assetId' }
      }, { status: 400 })
    }

    // Validate format parameter
    const validFormats = ['thumbnail', 'medium', 'large', 'original']
    if (!validFormats.includes(format)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid format parameter',
        details: {
          field: 'format',
          validValues: validFormats
        }
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // First, check if asset exists in our assets table
    const { data: assetRecord, error: assetError } = await supabase
      .from('pitch_deck_assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (assetError || !assetRecord) {
      return NextResponse.json({
        error: 'NOT_FOUND',
        message: `Asset '${assetId}' not found`
      }, { status: 404 })
    }

    // Construct file path based on format
    let filePath = assetRecord.file_path

    // For images, try to get optimized versions
    if (assetRecord.type === 'image' && format !== 'original') {
      const pathParts = filePath.split('.')
      const extension = pathParts.pop()
      const basePath = pathParts.join('.')

      // Try format-specific version first
      const optimizedPath = `${basePath}_${format}.${extension}`

      const { data: optimizedFile } = await supabase.storage
        .from('pitch-deck-assets')
        .list(optimizedPath.split('/').slice(0, -1).join('/'), {
          search: optimizedPath.split('/').pop()
        })

      if (optimizedFile && optimizedFile.length > 0) {
        filePath = optimizedPath
      }
      // Fall back to original if optimized version doesn't exist
    }

    // Get the asset from Supabase Storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('pitch-deck-assets')
      .download(filePath)

    if (storageError || !fileData) {
      return NextResponse.json({
        error: 'NOT_FOUND',
        message: `Asset file not found in storage`
      }, { status: 404 })
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine content type
    let contentType = 'application/octet-stream'
    switch (assetRecord.type) {
      case 'image':
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
          contentType = 'image/jpeg'
        } else if (filePath.endsWith('.png')) {
          contentType = 'image/png'
        } else if (filePath.endsWith('.webp')) {
          contentType = 'image/webp'
        } else if (filePath.endsWith('.svg')) {
          contentType = 'image/svg+xml'
        }
        break
      case 'video':
        if (filePath.endsWith('.mp4')) {
          contentType = 'video/mp4'
        } else if (filePath.endsWith('.webm')) {
          contentType = 'video/webm'
        }
        break
      case 'document':
        if (filePath.endsWith('.pdf')) {
          contentType = 'application/pdf'
        }
        break
    }

    // Set cache headers based on asset type
    const cacheHeaders = {
      'Cache-Control': assetRecord.type === 'image'
        ? 'public, max-age=31536000, immutable' // 1 year for images
        : 'public, max-age=86400', // 1 day for other assets
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'ETag': `"${assetId}-${format}"`,
      'Last-Modified': new Date(assetRecord.updated_at).toUTCString()
    }

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === `"${assetId}-${format}"`) {
      return new NextResponse(null, {
        status: 304,
        headers: cacheHeaders
      })
    }

    // Return the asset file
    return new NextResponse(buffer, {
      status: 200,
      headers: cacheHeaders
    })

  } catch (error) {
    console.error(`Error in GET /api/pitch-deck/assets/[assetId]:`, error)

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while retrieving asset'
    }, { status: 500 })
  }
}