// FTP operations API for EzEdit.co
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { action, host, username, password, path, content } = JSON.parse(event.body || '{}');

    // Demo FTP operations (in production, would use actual FTP library)
    switch (action) {
      case 'connect':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Connected to FTP server',
            connectionId: 'demo-connection-' + Date.now()
          })
        };

      case 'list':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            files: [
              { name: 'index.html', type: 'file', size: 2048, modified: '2024-01-15T10:30:00Z' },
              { name: 'style.css', type: 'file', size: 1024, modified: '2024-01-14T15:45:00Z' },
              { name: 'script.js', type: 'file', size: 512, modified: '2024-01-13T09:20:00Z' },
              { name: 'images', type: 'directory', size: 0, modified: '2024-01-12T14:10:00Z' }
            ]
          })
        };

      case 'read':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Sample File</title>\n</head>\n<body>\n    <h1>Hello from EzEdit.co!</h1>\n</body>\n</html>',
            path: path || '/index.html'
          })
        };

      case 'write':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'File saved successfully',
            path: path || '/index.html',
            size: (content || '').length
          })
        };

      case 'delete':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'File deleted successfully',
            path: path
          })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid FTP action'
          })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'FTP operation failed: ' + error.message
      })
    };
  }
};