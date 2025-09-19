/**
 * FTP Editor File Operations API
 * Handles loading and saving file content for the three-pane editor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnection, ensureConnectionActive, queueFTPOperation } from '@/lib/ftp-connections';
import { createRequestLogger } from '@/lib/logger';
import { extractErrorContext, createErrorResponse } from '@/lib/api-error-handler';
import { getWebsite } from '@/lib/websites-memory-store';
import { randomUUID } from 'crypto';

interface FileRequest {
  websiteId: string;
  filePath: string;
  content?: string;
}

/**
 * POST - Load file content for editing
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  // Enhanced logging: Log request initiation
  logger.info('FTP Editor file load request initiated', {
    correlationId,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    operation: 'ftp_editor_file_load_start',
    requestId: correlationId
  })

  try {
    const body: FileRequest = await request.json();
    const { websiteId, filePath } = body;

    // Temporary user
    const userId = 'demo-user';

    // Enhanced logging: Log request details
    logger.info('FTP Editor file load request details', {
      correlationId,
      websiteId,
      filePath,
      userId,
      operation: 'ftp_editor_file_load_details',
      requestSize: JSON.stringify(body).length,
      timestamp: new Date().toISOString()
    })

    // Validate request
    if (!websiteId || !filePath) {
      logger.error('FTP Editor file load validation failed', {
        ...new Error('Missing required parameters'),
        correlationId,
        websiteId: websiteId || 'MISSING',
        filePath: filePath || 'MISSING',
        operation: 'ftp_editor_file_load_validation_error',
        errorType: 'VALIDATION_ERROR',
        duration: Date.now() - startTime
      }, 'ftp_editor_validation_error')
      return NextResponse.json(
        { error: 'Missing websiteId or filePath' },
        { status: 400 }
      );
    }

    // Get website configuration
    const website = getWebsite(userId, websiteId);
    if (!website) {
      logger.error('FTP Editor website configuration not found', {
        error: new Error('Website not found'),
        correlationId,
        websiteId,
        userId,
        operation: 'ftp_editor_file_load_website_not_found',
        errorType: 'WEBSITE_NOT_FOUND',
        duration: Date.now() - startTime
      }, 'ftp_editor_website_not_found')
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Enhanced logging: Log website configuration (sanitized)
    logger.info('FTP Editor website configuration found', {
      correlationId,
      websiteId,
      websiteHost: website.host,
      websitePort: website.port,
      websiteUsername: website.username,
      websiteProtocol: website.type || 'FTP',
      operation: 'ftp_editor_website_config_found',
      timestamp: new Date().toISOString()
    })

    // Get FTP connection
    const connectionId = `${website.host}:${website.port}:${website.username}`;
    const connection = getConnection(connectionId);

    if (!connection) {
      logger.error('FTP Editor connection not found in pool', {
        error: new Error('Connection not found'),
        correlationId,
        connectionId,
        websiteId,
        operation: 'ftp_editor_file_load_connection_not_found',
        errorType: 'CONNECTION_NOT_FOUND',
        ftpHost: website.host,
        ftpPort: website.port,
        ftpUsername: website.username,
        duration: Date.now() - startTime
      }, 'ftp_editor_connection_not_found')
      return NextResponse.json(
        { error: `FTP connection not found: ${connectionId}. Please reconnect.` },
        { status: 404 }
      );
    }

    // Enhanced logging: Log connection details
    logger.info('FTP Editor connection retrieved from pool', {
      correlationId,
      connectionId,
      connectionConnected: connection.connected,
      connectionLastActivity: new Date(connection.lastActivity).toISOString(),
      connectionIsReconnecting: connection.isReconnecting || false,
      operation: 'ftp_editor_connection_retrieved',
      timestamp: new Date().toISOString()
    })

    // Ensure connection is active
    logger.info('FTP Editor checking connection activity', {
      correlationId,
      connectionId,
      operation: 'ftp_editor_connection_activity_check_start',
      timestamp: new Date().toISOString()
    })

    const connectionTestStart = Date.now()
    const isActive = await ensureConnectionActive(connection);
    const connectionTestDuration = Date.now() - connectionTestStart

    if (!isActive) {
      logger.error('FTP Editor connection is not active', {
        error: new Error('Connection inactive'),
        correlationId,
        connectionId,
        operation: 'ftp_editor_file_load_connection_inactive',
        errorType: 'CONNECTION_INACTIVE',
        connectionTestDuration,
        duration: Date.now() - startTime
      }, 'ftp_editor_connection_inactive')
      return NextResponse.json(
        { error: 'FTP connection is not active. Please reconnect.' },
        { status: 503 }
      );
    }

    logger.info('FTP Editor connection activity confirmed', {
      correlationId,
      connectionId,
      connectionTestDuration,
      operation: 'ftp_editor_connection_activity_confirmed',
      timestamp: new Date().toISOString()
    })

    try {
      // Check if file exists and get size
      logger.info('FTP Editor checking file size', {
        correlationId,
        filePath,
        operation: 'ftp_editor_file_size_check_start',
        timestamp: new Date().toISOString()
      })

      let fileSize;
      const fileSizeStart = Date.now()
      try {
        fileSize = await queueFTPOperation(connection, async () => {
          return await connection.client.size(filePath);
        });
        const fileSizeDuration = Date.now() - fileSizeStart

        logger.info('FTP Editor file size retrieved', {
          correlationId,
          filePath,
          fileSize,
          fileSizeDuration,
          operation: 'ftp_editor_file_size_retrieved',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        const fileSizeDuration = Date.now() - fileSizeStart
        logger.error('FTP Editor file size check failed', {
          error: error as Error,
          correlationId,
          filePath,
          fileSizeDuration,
          operation: 'ftp_editor_file_size_check_failed',
          errorType: 'FILE_NOT_FOUND_OR_INACCESSIBLE',
          ftpErrorMessage: (error as Error).message,
          duration: Date.now() - startTime
        }, 'ftp_editor_file_size_error')
        return NextResponse.json(
          { error: 'File not found or inaccessible' },
          { status: 404 }
        );
      }

      // Check file size (limit to 10MB for editor)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileSize > maxSize) {
        return NextResponse.json(
          { error: `File too large (${Math.round(fileSize / 1024 / 1024)}MB). Maximum size is 10MB.` },
          { status: 413 }
        );
      }

      // Download file content using a buffer stream
      logger.info('FTP Editor starting file download', {
        correlationId,
        filePath,
        fileSize,
        operation: 'ftp_editor_file_download_start',
        timestamp: new Date().toISOString()
      })

      let content = '';
      const downloadStart = Date.now()

      await queueFTPOperation(connection, async () => {
        return new Promise((resolve, reject) => {
          const { Writable } = require('stream');
          let chunks: Buffer[] = [];
          let bytesReceived = 0;

          const bufferStream = new Writable({
            write(chunk: Buffer, _encoding: string, callback: () => void) {
              chunks.push(chunk);
              bytesReceived += chunk.length;
              callback();
            }
          });

          bufferStream.on('finish', () => {
            const buffer = Buffer.concat(chunks);
            content = buffer.toString('utf-8');
            const downloadDuration = Date.now() - downloadStart

            logger.info('FTP Editor file download completed', {
              correlationId,
              filePath,
              bytesReceived,
              expectedSize: fileSize,
              downloadDuration,
              contentLength: content.length,
              operation: 'ftp_editor_file_download_completed',
              timestamp: new Date().toISOString()
            })
            resolve(content);
          });

          bufferStream.on('error', (error: Error) => {
            const downloadDuration = Date.now() - downloadStart
            logger.error('FTP Editor file download stream error', {
              error,
              correlationId,
              filePath,
              bytesReceived,
              downloadDuration,
              operation: 'ftp_editor_file_download_stream_error',
              errorType: 'DOWNLOAD_STREAM_ERROR'
            }, 'ftp_editor_download_stream_error')
            reject(error);
          });

          connection.client.downloadTo(bufferStream, filePath)
            .then(() => bufferStream.end())
            .catch((error: Error) => {
              const downloadDuration = Date.now() - downloadStart
              logger.error('FTP Editor file download client error', {
                error,
                correlationId,
                filePath,
                downloadDuration,
                operation: 'ftp_editor_file_download_client_error',
                errorType: 'DOWNLOAD_CLIENT_ERROR',
                ftpErrorMessage: error.message
              }, 'ftp_editor_download_client_error')
              reject(error);
            });
        });
      });

      // Get file modification time from directory listing
      const parentDir = filePath.split('/').slice(0, -1).join('/') || '/';
      const fileName = filePath.split('/').pop();

      const fileList = await queueFTPOperation(connection, async () => {
        return await connection.client.list(parentDir);
      });

      const fileEntry = fileList.find((entry: any) => entry.name === fileName);

      const response = {
        path: filePath,
        content,
        encoding: 'utf-8' as const,
        size: fileSize,
        lastModified: fileEntry?.modifiedAt || new Date().toISOString(),
        permissions: fileEntry?.permissions || '',
        mimeType: getMimeTypeFromPath(filePath)
      };

      const totalDuration = Date.now() - startTime
      logger.info('FTP Editor file load operation completed successfully', {
        correlationId,
        websiteId,
        filePath,
        fileSize,
        contentLength: content.length,
        mimeType: response.mimeType,
        permissions: response.permissions,
        lastModified: response.lastModified,
        encoding: response.encoding,
        totalDuration,
        operation: 'ftp_editor_file_load_success',
        performance: {
          connectionTestDuration,
          fileSizeDuration: Date.now() - fileSizeStart,
          downloadDuration: Date.now() - downloadStart,
          totalDuration
        },
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(response);

    } catch (ftpError) {
      const totalDuration = Date.now() - startTime
      logger.error('FTP Editor file load FTP operation failed', {
        error: ftpError as Error,
        correlationId,
        websiteId,
        filePath,
        connectionId,
        totalDuration,
        operation: 'ftp_editor_file_load_ftp_operation_failed',
        errorType: 'FTP_OPERATION_ERROR',
        ftpErrorMessage: (ftpError as Error).message,
        ftpErrorCode: (ftpError as any).code || 'UNKNOWN',
        timestamp: new Date().toISOString()
      }, 'ftp_editor_file_load_ftp_error');

      return NextResponse.json(
        { error: 'Failed to read file from FTP server' },
        { status: 500 }
      );
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime
    logger.error('FTP Editor file load operation failed', {
      error: error as Error,
      correlationId,
      totalDuration,
      operation: 'ftp_editor_file_load_general_error',
      errorType: 'GENERAL_ERROR',
      errorMessage: (error as Error).message,
      timestamp: new Date().toISOString()
    }, 'ftp_editor_file_load_general_error');

    return createErrorResponse(
      error instanceof Error ? error : new Error('File load operation failed'),
      context
    );
  }
}

/**
 * PUT - Save file content
 */
export async function PUT(request: NextRequest) {
  const correlationId = randomUUID()
  const logger = createRequestLogger(request)
  const context = extractErrorContext(request)
  context.correlationId = correlationId

  try {
    const body: FileRequest = await request.json();
    const { websiteId, filePath, content } = body;

    // Temporary user
    const userId = 'demo-user';

    // Validate request
    if (!websiteId || !filePath || content === undefined) {
      return NextResponse.json(
        { error: 'Missing websiteId, filePath, or content' },
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
      // Create buffer from content
      const buffer = Buffer.from(content, 'utf-8');

      // Upload file using a stream approach
      await queueFTPOperation(connection, async () => {
        return new Promise((resolve, reject) => {
          const { Readable } = require('stream');
          const stream = new Readable({
            read() {} // Required but can be empty
          });
          stream.push(buffer);
          stream.push(null); // Signal end of stream

          connection.client.uploadFrom(stream, filePath)
            .then(resolve)
            .catch(reject);
        });
      });

      // Get updated file info
      const parentDir = filePath.split('/').slice(0, -1).join('/') || '/';
      const fileName = filePath.split('/').pop();

      const fileList = await queueFTPOperation(connection, async () => {
        return await connection.client.list(parentDir);
      });

      const fileEntry = fileList.find((entry: any) => entry.name === fileName);

      const response = {
        path: filePath,
        size: buffer.length,
        lastModified: fileEntry?.modifiedAt || new Date().toISOString(),
        success: true
      };

      logger.info('File saved successfully', {
        correlationId,
        websiteId,
        filePath,
        size: buffer.length,
        operation: 'file_save_success'
      });

      return NextResponse.json(response);

    } catch (ftpError) {
      logger.error('FTP file save operation failed', ftpError as Error, 'file_save_ftp_error');

      return NextResponse.json(
        { error: 'Failed to save file to FTP server' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('File save operation failed', error as Error, 'file_save_error');

    return createErrorResponse(
      error instanceof Error ? error : new Error('File save operation failed'),
      context
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get MIME type from file path
 */
function getMimeTypeFromPath(filePath: string): string {
  const extension = filePath.toLowerCase().split('.').pop();

  const mimeTypes: Record<string, string> = {
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'json': 'application/json',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'scss': 'text/scss',
    'sass': 'text/sass',
    'less': 'text/less',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'yaml': 'application/x-yaml',
    'yml': 'application/x-yaml',
    'php': 'application/x-php',
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'cs': 'text/x-csharp',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'rb': 'text/x-ruby',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'sh': 'application/x-sh',
    'bash': 'application/x-sh',
    'sql': 'application/sql'
  };

  return mimeTypes[extension || ''] || 'text/plain';
}