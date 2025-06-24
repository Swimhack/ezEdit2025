# EzEdit FTP Backend

This directory contains the PHP backend implementation for handling FTP operations in the EzEdit application.

## Overview

The FTP backend provides a secure and efficient way to interact with FTP servers, allowing the EzEdit application to:

1. Connect to FTP servers
2. List directory contents
3. Download files
4. Upload/save files
5. Disconnect from servers

## Files

- `ftp-handler.php` - Main handler for all FTP operations
- `config.php` - Configuration file for FTP settings
- `test-connection.php` - Utility to test FTP connections
- `test.html` - Browser-based testing interface

## API Endpoints

All endpoints are accessed through `ftp-handler.php` with the following actions:

### Connect

```
GET ftp-handler.php?action=connect&site_id={site_id}
```

Establishes a connection to the FTP server for the specified site.

**Response:**
```json
{
  "success": true,
  "connection_id": "ftp_60a1b2c3d4e5f",
  "message": "Connected to FTP server"
}
```

### List Directory

```
GET ftp-handler.php?action=list&connection_id={connection_id}&path={path}
```

Lists contents of the specified directory.

**Response:**
```json
{
  "success": true,
  "path": "/public_html",
  "items": [
    {
      "name": "index.html",
      "type": "file",
      "size": 1024,
      "modified": "2025-06-18 12:30:00"
    },
    {
      "name": "images",
      "type": "directory",
      "size": 0,
      "modified": "2025-06-17 09:45:00"
    }
  ]
}
```

### Get File

```
GET ftp-handler.php?action=get&connection_id={connection_id}&path={path}
```

Retrieves the contents of the specified file.

**Response:**
```json
{
  "success": true,
  "path": "/public_html/index.html",
  "content": "<!DOCTYPE html>...",
  "modified": "2025-06-18 12:30:00"
}
```

### Save File

```
POST ftp-handler.php?action=put&connection_id={connection_id}&path={path}
Content-Type: text/plain

File content goes here...
```

Saves content to the specified file.

**Response:**
```json
{
  "success": true,
  "path": "/public_html/index.html",
  "message": "File saved successfully"
}
```

### Disconnect

```
GET ftp-handler.php?action=disconnect&connection_id={connection_id}
```

Closes the FTP connection and frees server resources.

**Response:**
```json
{
  "success": true,
  "message": "Disconnected successfully"
}
```

## Security Features

1. **Session-based Connection Management**
   - FTP connections are stored securely in PHP sessions
   - Each connection has a unique ID
   - Connections are automatically closed after 30 minutes of inactivity

2. **Error Logging**
   - Detailed error logs are stored in `ftp-errors.log`
   - Includes timestamps and client IP addresses

3. **Secure Credential Handling**
   - FTP credentials are stored in the database and retrieved securely
   - Credentials are never exposed to the client-side code

## Integration with Frontend

The frontend interacts with the FTP backend through the `ftpService` JavaScript module, which provides methods for all FTP operations and handles connection state management.

## Testing

You can test the FTP functionality using the provided `test.html` page, which allows you to:

1. Test direct connections to FTP servers
2. Test the FTP handler API
3. Test disconnection functionality

## Error Handling

All API endpoints return consistent JSON responses with:

- `success` (boolean) - Indicates if the operation was successful
- `error` (string, if applicable) - Error message if the operation failed
- Additional data specific to each operation

## Resource Management

- FTP connections are automatically closed after 30 minutes of inactivity
- A shutdown function ensures all connections are properly closed when the script terminates
- Temporary files used for transfers are automatically cleaned up

## Future Improvements

1. Implement SFTP support
2. Add file and directory operations (rename, delete, create)
3. Enhance error handling and logging
4. Implement connection pooling for better performance
5. Add progress tracking for large file transfers
