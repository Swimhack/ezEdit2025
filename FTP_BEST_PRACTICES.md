# FTP Best Practices Implementation

## Overview
This document outlines the FTP best practices implemented to ensure reliable file loading and operations on FTP servers.

## Key Improvements

### 1. **Connection Management**
- ✅ Connection pooling and reuse
- ✅ Keepalive (NOOP/PWD) every 30 seconds
- ✅ Automatic reconnection on failure
- ✅ Connection timeout handling (10 seconds)
- ✅ Idle connection cleanup (4 minutes)

### 2. **Path Normalization**
- ✅ Normalized all paths (removes trailing slashes, handles double slashes)
- ✅ Ensures paths start with `/`
- ✅ Handles root directory (`/`) correctly
- ✅ Working directory support (`website.path`)

### 3. **Retry Logic**
- ✅ 3 retries with exponential backoff (500ms, 1000ms, 1500ms)
- ✅ No retries on authentication errors (401)
- ✅ No retries on permission errors (403)
- ✅ No retries on not found errors (404)
- ✅ Retries on connection/timeout errors

### 4. **Error Handling**
- ✅ Specific error messages for common FTP errors
- ✅ Circuit breaker pattern (5 failures = 1 minute timeout)
- ✅ Rate limiting (30 requests per minute)
- ✅ Connection state validation before operations
- ✅ Timeout handling for all operations

### 5. **File Operations**
- ✅ Working directory handling (cd to website.path before operations)
- ✅ Encoding detection (UTF-8 primary, Latin1 fallback)
- ✅ File size validation (10MB limit for editor)
- ✅ Timeout handling for downloads/uploads
- ✅ Proper stream handling

### 6. **Directory Listing**
- ✅ Improved file type detection (checks FTP metadata + extension)
- ✅ Path validation (prevents listing files as directories)
- ✅ Retry logic for failed listings
- ✅ Proper handling of empty directories

## Configuration

### FTP Config Defaults
```typescript
{
  connectionTimeout: 10000,      // 10 seconds
  dataTimeout: 30000,            // 30 seconds
  keepaliveInterval: 30000,      // 30 seconds
  pasvTimeout: 5000,             // 5 seconds
  connectionIdleTimeout: 240000,  // 4 minutes
}
```

### Environment Variables
- `FTP_CONNECTION_TIMEOUT` - Override connection timeout
- `FTP_KEEPALIVE_INTERVAL` - Override keepalive interval
- `FTP_MAX_CONNECTIONS` - Override max connections per host

## Error Codes Handled

| Code | Meaning | Action |
|------|---------|--------|
| 530 | Authentication failed | Don't retry, return 401 |
| 550 | File/directory not found | Don't retry, return 404 |
| 421 | Too many connections | Wait and retry |
| ECONNRESET | Connection reset | Reconnect and retry |
| ETIMEDOUT | Timeout | Retry with backoff |
| ECONNREFUSED | Connection refused | Return error |

## Best Practices Applied

1. **Connection Reuse**: Reuse FTP connections when possible
2. **Keepalive**: Send NOOP/PWD commands regularly to keep connections alive
3. **Queue Operations**: Queue FTP operations to prevent concurrent access
4. **Path Normalization**: Always normalize paths before operations
5. **Working Directory**: Change to website.path before operations
6. **Retry Logic**: Retry transient failures with exponential backoff
7. **Timeout Handling**: Set timeouts for all operations
8. **Error Classification**: Handle different error types appropriately
9. **Circuit Breaker**: Prevent hammering failing servers
10. **Rate Limiting**: Respect server limits

## File Loading Flow

1. **Validate Request**: Check websiteId and filePath
2. **Get Connection**: Reuse or create FTP connection
3. **Ensure Active**: Validate connection is still active
4. **Change Directory**: Navigate to website.path if specified
5. **Check File Size**: Get file size with retry logic
6. **Validate Size**: Check if file is within editor limits (10MB)
7. **Download File**: Stream file content with timeout
8. **Detect Encoding**: Try UTF-8, fallback to Latin1
9. **Return Content**: Return file content with metadata

## Directory Listing Flow

1. **Validate Request**: Check websiteId and path
2. **Normalize Path**: Normalize path to prevent errors
3. **Validate Path**: Ensure path is not a file
4. **Get Connection**: Reuse or create FTP connection
5. **Ensure Active**: Validate connection is still active
6. **Change Directory**: Navigate to website.path if specified
7. **List Directory**: Get directory contents with retry logic
8. **Format Results**: Format file info with proper type detection
9. **Return Files**: Return formatted file list

## Testing Recommendations

1. Test with slow FTP servers
2. Test with connection timeouts
3. Test with authentication failures
4. Test with large directories (100+ files)
5. Test with special characters in paths
6. Test with nested directories
7. Test with concurrent operations
8. Test with server disconnections

