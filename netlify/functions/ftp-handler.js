/**
 * Netlify Serverless Function for FTP Operations
 * Replaces the PHP FTP handler for Netlify deployment
 */

const { Client } = require('basic-ftp');
const crypto = require('crypto');

// Store active connections (in production, use Redis or similar)
const connections = new Map();

// Connection timeout (5 minutes)
const CONNECTION_TIMEOUT = 5 * 60 * 1000;

// Clean up expired connections
setInterval(() => {
  const now = Date.now();
  for (const [id, conn] of connections.entries()) {
    if (now - conn.lastUsed > CONNECTION_TIMEOUT) {
      conn.client.close();
      connections.delete(id);
    }
  }
}, 60000); // Clean up every minute

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  const { httpMethod, queryStringParameters, body } = event;
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    const action = queryStringParameters?.action || '';
    const connectionId = queryStringParameters?.connection_id || '';
    
    switch (action) {
      case 'connect':
        return await handleConnect(body, headers);
      case 'list':
        return await handleList(connectionId, queryStringParameters.path, headers);
      case 'get':
        return await handleGet(connectionId, queryStringParameters.path, headers);
      case 'put':
        return await handlePut(connectionId, body, headers);
      case 'mkdir':
        return await handleMkdir(connectionId, body, headers);
      case 'delete':
        return await handleDelete(connectionId, body, headers);
      case 'rename':
        return await handleRename(connectionId, body, headers);
      case 'status':
        return await handleStatus(connectionId, headers);
      case 'disconnect':
        return await handleDisconnect(connectionId, headers);
      default:
        return errorResponse('Invalid action', 400, headers);
    }
  } catch (error) {
    console.error('FTP Handler Error:', error);
    return errorResponse(error.message, 500, headers);
  }
};

/**
 * Handle FTP connection
 */
async function handleConnect(body, headers) {
  try {
    const params = parseBody(body);
    const { host, username, password, port = 21, passive = true } = params;
    
    if (!host || !username || !password) {
      return errorResponse('Missing required connection parameters', 400, headers);
    }
    
    const client = new Client();
    client.ftp.timeout = 30000; // 30 second timeout
    
    // Connect to FTP server
    await client.access({
      host,
      port: parseInt(port),
      user: username,
      password,
      secure: false
    });
    
    // Set passive mode
    if (passive) {
      client.ftp.pasv = true;
    }
    
    // Generate connection ID
    const connectionId = 'ftp_' + crypto.randomUUID();
    
    // Store connection
    connections.set(connectionId, {
      client,
      host,
      port,
      username,
      lastUsed: Date.now()
    });
    
    return successResponse({
      connection_id: connectionId,
      server_info: {
        host,
        port,
        system_type: 'Node.js FTP Client'
      }
    }, headers);
    
  } catch (error) {
    console.error('FTP Connect Error:', error);
    return errorResponse('Connection failed: ' + error.message, 500, headers);
  }
}

/**
 * Handle directory listing
 */
async function handleList(connectionId, path = '/', headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const { client } = connection;
    connection.lastUsed = Date.now();
    
    // List directory contents
    const list = await client.list(path);
    
    const items = list.map(item => ({
      name: item.name,
      type: item.type === 1 ? 'file' : 'directory',
      size: item.size || 0,
      modified: item.modifiedAt ? item.modifiedAt.toISOString() : null,
      permissions: item.permissions || '',
      is_readable: true,
      is_writable: true
    }));
    
    return successResponse({
      path,
      items,
      total_items: items.length,
      parent_path: path === '/' ? null : path.split('/').slice(0, -1).join('/') || '/'
    }, headers);
    
  } catch (error) {
    console.error('FTP List Error:', error);
    return errorResponse('Failed to list directory: ' + error.message, 500, headers);
  }
}

/**
 * Handle file download
 */
async function handleGet(connectionId, path, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const { client } = connection;
    connection.lastUsed = Date.now();
    
    // Download file content
    const chunks = [];
    await client.downloadTo(
      {
        write: (chunk) => chunks.push(chunk),
        end: () => {}
      },
      path
    );
    
    const content = Buffer.concat(chunks).toString('utf8');
    
    return successResponse({
      content,
      encoding: 'utf-8',
      size: content.length,
      modified: new Date().toISOString(),
      mime_type: getMimeType(path)
    }, headers);
    
  } catch (error) {
    console.error('FTP Get Error:', error);
    return errorResponse('Failed to download file: ' + error.message, 500, headers);
  }
}

/**
 * Handle file upload
 */
async function handlePut(connectionId, body, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const params = parseBody(body);
    const { path, content, encoding = 'utf-8' } = params;
    
    if (!path || content === undefined) {
      return errorResponse('Missing path or content', 400, headers);
    }
    
    const { client } = connection;
    connection.lastUsed = Date.now();
    
    // Convert content to buffer
    const buffer = Buffer.from(content, encoding);
    
    // Upload file
    await client.uploadFrom(
      {
        read: () => buffer,
        end: () => {}
      },
      path
    );
    
    return successResponse({
      bytes_written: buffer.length,
      modified: new Date().toISOString(),
      backup_created: false
    }, headers);
    
  } catch (error) {
    console.error('FTP Put Error:', error);
    return errorResponse('Failed to upload file: ' + error.message, 500, headers);
  }
}

/**
 * Handle directory creation
 */
async function handleMkdir(connectionId, body, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const params = parseBody(body);
    const { path, permissions = '755' } = params;
    
    if (!path) {
      return errorResponse('Missing path', 400, headers);
    }
    
    const { client } = connection;
    connection.lastUsed = Date.now();
    
    // Create directory
    await client.ensureDir(path);
    
    return successResponse({
      path,
      permissions,
      created: new Date().toISOString()
    }, headers);
    
  } catch (error) {
    console.error('FTP Mkdir Error:', error);
    return errorResponse('Failed to create directory: ' + error.message, 500, headers);
  }
}

/**
 * Handle file/directory deletion
 */
async function handleDelete(connectionId, body, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const params = parseBody(body);
    const { path, type = 'file' } = params;
    
    if (!path) {
      return errorResponse('Missing path', 400, headers);
    }
    
    const { client } = connection;
    connection.lastUsed = Date.now();
    
    // Delete file or directory
    if (type === 'directory') {
      await client.removeDir(path);
    } else {
      await client.remove(path);
    }
    
    return successResponse({
      deleted_path: path,
      backup_created: false
    }, headers);
    
  } catch (error) {
    console.error('FTP Delete Error:', error);
    return errorResponse('Failed to delete: ' + error.message, 500, headers);
  }
}

/**
 * Handle file/directory rename
 */
async function handleRename(connectionId, body, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const params = parseBody(body);
    const { old_path, new_path } = params;
    
    if (!old_path || !new_path) {
      return errorResponse('Missing old_path or new_path', 400, headers);
    }
    
    const { client } = connection;
    connection.lastUsed = Date.now();
    
    // Rename file
    await client.rename(old_path, new_path);
    
    return successResponse({
      old_path,
      new_path,
      renamed_at: new Date().toISOString()
    }, headers);
    
  } catch (error) {
    console.error('FTP Rename Error:', error);
    return errorResponse('Failed to rename: ' + error.message, 500, headers);
  }
}

/**
 * Handle connection status check
 */
async function handleStatus(connectionId, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const { client, host, port } = connection;
    connection.lastUsed = Date.now();
    
    return successResponse({
      connection_id: connectionId,
      is_connected: !client.closed,
      last_activity: new Date(connection.lastUsed).toISOString(),
      current_directory: '/',
      server_info: {
        host,
        port,
        system_type: 'Node.js FTP Client'
      }
    }, headers);
    
  } catch (error) {
    console.error('FTP Status Error:', error);
    return errorResponse('Failed to check status: ' + error.message, 500, headers);
  }
}

/**
 * Handle connection disconnect
 */
async function handleDisconnect(connectionId, headers) {
  try {
    const connection = getConnection(connectionId);
    if (!connection) {
      return errorResponse('Invalid connection ID', 400, headers);
    }
    
    const { client } = connection;
    
    // Close connection
    client.close();
    connections.delete(connectionId);
    
    return successResponse({
      message: 'Connection closed successfully',
      disconnected_at: new Date().toISOString()
    }, headers);
    
  } catch (error) {
    console.error('FTP Disconnect Error:', error);
    return errorResponse('Failed to disconnect: ' + error.message, 500, headers);
  }
}

/**
 * Helper functions
 */
function getConnection(connectionId) {
  return connections.get(connectionId);
}

function parseBody(body) {
  if (!body) return {};
  
  try {
    return JSON.parse(body);
  } catch (e) {
    // Try to parse as URL-encoded
    const params = new URLSearchParams(body);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }
}

function getMimeType(path) {
  const extension = path.split('.').pop().toLowerCase();
  const mimeTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'txt': 'text/plain',
    'php': 'application/x-php',
    'xml': 'application/xml',
    'md': 'text/markdown'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

function successResponse(data, headers) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

function errorResponse(message, statusCode = 500, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      success: false,
      error: {
        code: statusCode === 400 ? 'INVALID_REQUEST' : 'SERVER_ERROR',
        message
      }
    })
  };
}