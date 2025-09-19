/**
 * FTP Editor File Preview API
 * Provides file metadata and content preview for the preview pane
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnection, ensureConnectionActive, queueFTPOperation } from '@/lib/ftp-connections';
import { logger } from '@/lib/logger';
import { createAPILogger } from '@/lib/pino-logger';
import { getWebsite } from '@/lib/websites-memory-store';
import { createFilePreview, isPreviewableFile } from '@/lib/file-operations';

/**
 * GET - Get file preview and metadata
 */
export async function GET(request: NextRequest) {
  const apiLogger = createAPILogger(request as any, '/api/ftp/editor/preview');

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const filePath = searchParams.get('filePath');

    // Temporary user
    const userId = 'demo-user';

    // Validate request
    if (!websiteId || !filePath) {
      return NextResponse.json(
        { error: 'Missing websiteId or filePath query parameters' },
        { status: 400 }
      );
    }

    // Get website configuration
    const website = getWebsite(userId, websiteId);
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Get FTP connection
    const connectionId = `${website.host}:${website.port}:${website.username}`;
    const connection = getConnection(connectionId);

    if (!connection) {
      return NextResponse.json(
        { error: `FTP connection not found: ${connectionId}. Please reconnect.` },
        { status: 404 }
      );
    }

    // Ensure connection is active
    const isActive = await ensureConnectionActive(connection);
    if (!isActive) {
      return NextResponse.json(
        { error: 'FTP connection is not active. Please reconnect.' },
        { status: 503 }
      );
    }

    try {
      // Get file information from directory listing
      const parentDir = filePath.split('/').slice(0, -1).join('/') || '/';
      const fileName = filePath.split('/').pop();

      const fileList = await queueFTPOperation(connection, async () => {
        return await connection.client.list(parentDir);
      });

      const fileEntry = fileList.find((entry: any) => entry.name === fileName);

      if (!fileEntry) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      // Create file node structure for compatibility
      const fileNode = {
        path: filePath,
        name: fileName!,
        type: fileEntry.isDirectory || fileEntry.type === 1 ? 'directory' : 'file',
        size: fileEntry.size || 0,
        modified: fileEntry.modifiedAt || new Date(),
        permissions: fileEntry.permissions || ''
      };

      // For directories, return basic preview
      if (fileNode.type === 'directory') {
        const preview = createFilePreview(fileNode as any);

        apiLogger.info({
          websiteId,
          filePath,
          type: 'directory',
          operation: 'FILE_PREVIEW'
        }, 'Directory preview generated');

        return NextResponse.json(preview);
      }

      // For files, check if we can preview content
      let contentPreview = '';

      if (isPreviewableFile(fileNode as any)) {
        try {
          // Check file size first (limit preview to 1MB)
          const maxPreviewSize = 1024 * 1024; // 1MB
          if (fileNode.size <= maxPreviewSize) {

            // Download file content for preview
            let fullContent = '';

            await queueFTPOperation(connection, async () => {
              return new Promise((resolve, reject) => {
                const { Writable } = require('stream');
                let chunks: Buffer[] = [];

                const bufferStream = new Writable({
                  write(chunk: Buffer, _encoding: string, callback: () => void) {
                    chunks.push(chunk);
                    callback();
                  }
                });

                bufferStream.on('finish', () => {
                  const buffer = Buffer.concat(chunks);
                  fullContent = buffer.toString('utf-8');
                  resolve(fullContent);
                });

                bufferStream.on('error', reject);

                connection.client.downloadTo(bufferStream, filePath)
                  .then(() => bufferStream.end())
                  .catch(reject);
              });
            });
            contentPreview = fullContent.length > 1000
              ? fullContent.substring(0, 1000) + '...'
              : fullContent;
          }
        } catch (error) {
          // If preview generation fails, continue without content
          apiLogger.warn({
            websiteId,
            filePath,
            error: error instanceof Error ? error.message : error,
            operation: 'PREVIEW_CONTENT'
          }, 'Failed to generate content preview');
        }
      }

      // Create file preview with content
      const preview = createFilePreview(fileNode as any, contentPreview);

      apiLogger.info({
        websiteId,
        filePath,
        size: fileNode.size,
        hasPreview: !!contentPreview,
        operation: 'FILE_PREVIEW'
      }, 'File preview generated');

      return NextResponse.json(preview);

    } catch (ftpError) {
      apiLogger.error({
        websiteId,
        filePath,
        error: ftpError instanceof Error ? ftpError.message : ftpError,
        operation: 'FILE_PREVIEW'
      }, 'FTP preview operation failed');

      return NextResponse.json(
        { error: 'Failed to generate file preview' },
        { status: 500 }
      );
    }

  } catch (error) {
    apiLogger.error({
      error: error instanceof Error ? error.message : error,
      operation: 'FILE_PREVIEW'
    }, 'Preview operation failed');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}