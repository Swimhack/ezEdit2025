# FTP Activity Logging System

## Overview

The FTP Activity Logging System provides comprehensive logging of all FTP operations to aid in troubleshooting connection issues, file listing problems, and other FTP-related errors.

## Features

- **Centralized Logging**: All FTP operations are logged to a centralized in-memory store
- **Structured Logs**: Each log entry includes operation type, status, timing, paths, and error details
- **Correlation IDs**: Track all operations for a single request using correlation IDs
- **Filtering**: Query logs by website, connection, operation type, status, and time range
- **Statistics**: Get aggregated statistics about FTP operations

## API Endpoint

### GET `/api/ftp/logs`

Retrieve FTP activity logs with optional filters.

#### Query Parameters

- `websiteId` (optional): Filter logs for a specific website
- `connectionId` (optional): Filter logs for a specific FTP connection
- `operation` (optional): Filter by operation type (e.g., `ftp_list`, `ftp_read`, `ftp_connect`)
- `status` (optional): Filter by status (`success`, `error`, `warning`, `info`)
- `correlationId` (optional): Get all logs for a specific request
- `limit` (optional): Maximum number of logs to return (default: 100)
- `since` (optional): ISO date string - only return logs after this date
- `statsOnly` (optional): If `true`, return only statistics

#### Examples

**Get all recent logs:**
```
GET /api/ftp/logs?limit=50
```

**Get logs for a specific website:**
```
GET /api/ftp/logs?websiteId=w_mfqaki011hc6q3&limit=100
```

**Get logs for a specific request (correlation ID):**
```
GET /api/ftp/logs?correlationId=abc123-def456-ghi789
```

**Get only errors:**
```
GET /api/ftp/logs?status=error&limit=50
```

**Get statistics:**
```
GET /api/ftp/logs?statsOnly=true
```

**Get logs since a specific time:**
```
GET /api/ftp/logs?since=2024-01-15T10:00:00Z
```

#### Response Format

```json
{
  "success": true,
  "logs": [
    {
      "id": "log_1234567890_abc123",
      "timestamp": "2024-01-15T10:30:45.123Z",
      "operation": "ftp_list",
      "websiteId": "w_mfqaki011hc6q3",
      "connectionId": "72.167.42.141:21:eastgateus",
      "correlationId": "abc123-def456-ghi789",
      "status": "success",
      "path": "/public_html",
      "details": {
        "originalPath": "/",
        "websitePath": "/public_html",
        "listPath": "/public_html"
      },
      "duration": 234,
      "fileCount": 15
    }
  ],
  "count": 1,
  "total": 1000,
  "filters": {
    "websiteId": "w_mfqaki011hc6q3",
    "limit": 100
  },
  "stats": {
    "byStatus": {
      "success": 850,
      "error": 50,
      "warning": 75,
      "info": 25
    },
    "byOperation": {
      "ftp_list": 500,
      "ftp_read": 300,
      "ftp_connect": 150,
      "ftp_editor_read": 50
    },
    "recentErrors": 5
  }
}
```

## Log Entry Structure

Each log entry contains:

- `id`: Unique log entry identifier
- `timestamp`: When the operation occurred
- `operation`: Type of operation (e.g., `ftp_list`, `ftp_read`, `ftp_connect`, `ftp_editor_read`)
- `websiteId`: Website identifier (if applicable)
- `connectionId`: FTP connection identifier (if applicable)
- `correlationId`: Request correlation ID for tracing
- `status`: Operation status (`success`, `error`, `warning`, `info`)
- `path`: Directory path (for list operations)
- `filePath`: File path (for read/write operations)
- `details`: Additional operation-specific details
- `error`: Error information (if status is `error`)
- `duration`: Operation duration in milliseconds
- `fileCount`: Number of files returned (for list operations)
- `fileSize`: File size in bytes (for read operations)

## Logged Operations

The following operations are logged:

1. **ftp_connect**: FTP connection attempts
   - Connection parameters (host, port, username, protocol)
   - Success/failure status
   - Connection duration

2. **ftp_list**: Directory listing operations
   - Requested path and actual path used
   - Number of files/directories returned
   - Operation duration

3. **ftp_read**: File read operations
   - File path
   - File size
   - Read duration

4. **ftp_editor_read**: Editor file read operations
   - File path
   - File size and content length
   - MIME type and encoding
   - Read duration

## Troubleshooting

### Files Not Showing

If files are not showing in the editor:

1. Check logs for the website:
   ```
   GET /api/ftp/logs?websiteId=YOUR_WEBSITE_ID&operation=ftp_list
   ```

2. Look for errors in the logs:
   ```
   GET /api/ftp/logs?websiteId=YOUR_WEBSITE_ID&status=error
   ```

3. Check the `details` field in log entries to see:
   - What path was requested (`originalPath`)
   - What path was actually used (`listPath`)
   - The website's configured path (`websitePath`)

### Connection Issues

If experiencing connection problems:

1. Check connection logs:
   ```
   GET /api/ftp/logs?operation=ftp_connect&status=error
   ```

2. Look for authentication errors (error code 530)

3. Check connection duration - long durations may indicate network issues

### Path Resolution Issues

The logging system tracks:
- `originalPath`: The path requested by the client
- `websitePath`: The website's configured working directory
- `listPath`: The actual path used for the FTP LIST command

This helps identify path resolution problems.

## Log Retention

- Maximum logs stored: 1000 entries
- Oldest logs are automatically removed when limit is reached
- Logs are stored in memory (not persisted to disk)

## Development

In development mode, logs are also printed to the console for easier debugging.

## Future Enhancements

- Persistent log storage (database)
- Log export functionality
- Real-time log streaming
- Log retention policies
- Alerting on error thresholds

