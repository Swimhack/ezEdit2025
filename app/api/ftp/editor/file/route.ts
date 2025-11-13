/**
 * FTP Editor File Operations API
 * Handles loading and saving file content for the three-pane editor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnection, ensureConnectionActive, queueFTPOperation } from '@/lib/ftp-connections';
import { createRequestLogger } from '@/lib/logger';
import { extractErrorContext, createErrorResponse } from '@/lib/api-error-handler';
import { getWebsite } from '@/lib/websites-memory-store';
import { getFTPConfig } from '@/lib/ftp-config';
import { randomUUID } from 'crypto';
import { logFTPActivity } from '@/lib/ftp-activity-log';

// Helper to normalize and validate paths
function normalizePath(path: string): string {
  if (!path) return '/'
  // Remove trailing slashes except for root
  path = path.replace(/\/+$/, '') || '/'
  // Ensure starts with /
  if (!path.startsWith('/')) path = '/' + path
  // Normalize double slashes
  path = path.replace(/\/+/g, '/')
  return path
}

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
    const { websiteId, filePath: rawFilePath } = body;
    
    // Normalize file path
    const filePath = normalizePath(rawFilePath || '')

    // Temporary user (matches editor page and website API)
    const userId = 'test-user-123';

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
      
      // Retry logic for file size check
      let retries = 3
      let sizeError: any = null
      
      while (retries > 0) {
        try {
          fileSize = await queueFTPOperation(connection, async () => {
            // Don't change directory - use absolute path
            // The filePath already includes the full path from root
            return await connection.client.size(filePath);
          });
          sizeError = null
          break
        } catch (error) {
          sizeError = error
          retries--
          
          if (retries > 0) {
            const delay = (4 - retries) * 500 // Exponential backoff
            logger.info('Retrying file size check', {
              connectionId,
              filePath,
              retries,
              delay
            })
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      if (sizeError) {
        throw sizeError
      }
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

    try {
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

      // Retry logic for file download
      let downloadRetries = 3
      let downloadError: any = null
      
      while (downloadRetries > 0) {
        try {
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

              const timeout = setTimeout(() => {
                bufferStream.destroy();
                reject(new Error('Download timeout'));
              }, getFTPConfig().dataTimeout);

              bufferStream.on('finish', () => {
                clearTimeout(timeout);
                const buffer = Buffer.concat(chunks);
                
                // Try to detect encoding
                let textContent = ''
                try {
                  textContent = buffer.toString('utf-8')
                } catch (e) {
                  // Fallback to latin1 if UTF-8 fails
                  try {
                    textContent = buffer.toString('latin1')
                  } catch (e2) {
                    textContent = buffer.toString('utf-8', 0, buffer.length)
                  }
                }
                
                content = textContent;
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
                clearTimeout(timeout);
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

              // Download using absolute path (filePath already includes full path)
              Promise.resolve().then(async () => {
                return connection.client.downloadTo(bufferStream, filePath)
              })
                .then(() => bufferStream.end())
                .catch((error: Error) => {
                  clearTimeout(timeout);
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
          
          downloadError = null
          break
        } catch (error) {
          downloadError = error
          downloadRetries--
          
          if (downloadRetries > 0) {
            const delay = (4 - downloadRetries) * 500 // Exponential backoff
            logger.info('Retrying file download', {
              connectionId,
              filePath,
              retries: downloadRetries,
              delay
            })
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      if (downloadError) {
        throw downloadError
      }

      // Get file modification time from directory listing
      const parentDir = normalizePath(filePath.split('/').slice(0, -1).join('/') || '/');
      const fileName = filePath.split('/').pop();

      let fileEntry: any = null
      try {
        const fileList = await queueFTPOperation(connection, async () => {
          // Use absolute path for listing
          return await connection.client.list(parentDir);
        });

        fileEntry = fileList.find((entry: any) => entry.name === fileName);
      } catch (listError) {
        logger.warn('Could not get file metadata from directory listing', {
          error: listError instanceof Error ? listError.message : 'Unknown error',
          filePath,
          parentDir
        })
      }

      const response = {
        path: filePath, // Already normalized
        content,
        encoding: 'utf-8' as const,
        size: fileSize,
        lastModified: fileEntry?.modifiedAt || new Date().toISOString(),
        permissions: fileEntry?.permissions || '',
        mimeType: getMimeTypeFromPath(filePath)
      };

      const totalDuration = Date.now() - startTime
      
      // Log successful file read
      logFTPActivity({
        operation: 'ftp_editor_read',
        websiteId,
        connectionId,
        correlationId,
        status: 'success',
        filePath,
        details: {
          fileSize,
          contentLength: content.length,
          mimeType: response.mimeType,
          encoding: response.encoding
        },
        fileSize,
        duration: totalDuration
      });
      
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
      
      // Log failed file read
      logFTPActivity({
        operation: 'ftp_editor_read',
        websiteId,
        connectionId,
        correlationId,
        status: 'error',
        filePath,
        details: {
          errorType: 'FTP_OPERATION_ERROR'
        },
        error: {
          message: (ftpError as Error).message,
          code: (ftpError as any).code || 'UNKNOWN'
        },
        duration: totalDuration
      });

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

    // Temporary user (matches editor page and website API)
    const userId = 'test-user-123';

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

    // Normalize file path
    const normalizedFilePath = normalizePath(filePath || '')

    try {
      // Create buffer from content with UTF-8 encoding
      const buffer = Buffer.from(content, 'utf-8');

      // Retry logic for file upload
      let uploadRetries = 3
      let uploadError: any = null
      
      while (uploadRetries > 0) {
        try {
          await queueFTPOperation(connection, async () => {
            return new Promise((resolve, reject) => {
              const { Readable } = require('stream');
              const stream = new Readable({
                read() {} // Required but can be empty
              });
              stream.push(buffer);
              stream.push(null); // Signal end of stream

              const timeout = setTimeout(() => {
                stream.destroy();
                reject(new Error('Upload timeout'));
              }, getFTPConfig().dataTimeout);

              // Upload using absolute path (normalizedFilePath already includes full path)
              Promise.resolve().then(async () => {
                return connection.client.uploadFrom(stream, normalizedFilePath)
              })
                .then(() => {
                  clearTimeout(timeout);
                  resolve(undefined);
                })
                .catch((error: Error) => {
                  clearTimeout(timeout);
                  reject(error);
                });
            });
          });
          
          uploadError = null
          break
        } catch (error) {
          uploadError = error
          uploadRetries--
          
          if (uploadRetries > 0) {
            const delay = (4 - uploadRetries) * 500 // Exponential backoff
            logger.info('Retrying file upload', {
              connectionId,
              filePath: normalizedFilePath,
              retries: uploadRetries,
              delay
            })
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      if (uploadError) {
        throw uploadError
      }

      // Get updated file info
      const parentDir = normalizePath(normalizedFilePath.split('/').slice(0, -1).join('/') || '/');
      const fileName = normalizedFilePath.split('/').pop();

      let fileEntry: any = null
      try {
        const fileList = await queueFTPOperation(connection, async () => {
          // Use absolute path for listing
          return await connection.client.list(parentDir);
        });

        fileEntry = fileList.find((entry: any) => entry.name === fileName);
      } catch (listError) {
        logger.warn('Could not get file metadata from directory listing after upload', {
          error: listError instanceof Error ? listError.message : 'Unknown error',
          filePath: normalizedFilePath,
          parentDir
        })
      }

      const response = {
        path: normalizedFilePath,
        size: buffer.length,
        lastModified: fileEntry?.modifiedAt || new Date().toISOString(),
        success: true
      };

      logger.info('File saved successfully', {
        correlationId,
        websiteId,
        filePath: normalizedFilePath,
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