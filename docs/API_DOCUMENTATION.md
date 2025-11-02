# EzEdit v2 - API Documentation

This document provides comprehensive API reference for all backend services in EzEdit v2.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All API routes (except `/api/auth/*`) require authentication via JWT token.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Error Response Format
All errors follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional context (optional)"
  }
}
```

---

## Authentication API

### POST `/api/auth/login`
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "developer"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

### POST `/api/auth/logout`
Invalidate current session.

**Response:**
```json
{
  "success": true
}
```

### GET `/api/auth/session`
Get current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "developer"
  }
}
```

---

## FTP/SFTP API

### POST `/api/ftp/connect`
Establish FTP/SFTP connection.

**Request:**
```json
{
  "connectionId": "uuid",  // Optional: Use saved connection
  "config": {              // Optional: Use new connection
    "type": "sftp",
    "host": "ftp.example.com",
    "port": 22,
    "username": "user",
    "password": "pass",
    "basePath": "/public_html"
  }
}
```

**Response:**
```json
{
  "sessionId": "session_token",
  "connected": true,
  "basePath": "/public_html"
}
```

### GET `/api/ftp/list`
List directory contents.

**Query Parameters:**
- `sessionId` (required): Session token from connect
- `path` (optional): Directory path (default: basePath)

**Response:**
```json
{
  "files": [
    {
      "name": "index.html",
      "type": "file",
      "size": 2048,
      "modifiedAt": "2025-01-15T12:00:00Z",
      "permissions": "rw-r--r--"
    },
    {
      "name": "css",
      "type": "directory",
      "modifiedAt": "2025-01-14T10:30:00Z"
    }
  ]
}
```

### GET `/api/ftp/file`
Read file content.

**Query Parameters:**
- `sessionId` (required): Session token
- `path` (required): File path

**Response:**
```json
{
  "path": "/public_html/index.html",
  "content": "<!DOCTYPE html>...",
  "encoding": "utf-8",
  "size": 2048,
  "modifiedAt": "2025-01-15T12:00:00Z"
}
```

### PUT `/api/ftp/file`
Write/update file content.

**Request:**
```json
{
  "sessionId": "session_token",
  "path": "/public_html/index.html",
  "content": "<!DOCTYPE html>...",
  "createBackup": true  // Optional: Create version backup
}
```

**Response:**
```json
{
  "success": true,
  "path": "/public_html/index.html",
  "size": 2048,
  "backupId": "version_uuid"  // If createBackup was true
}
```

### DELETE `/api/ftp/file`
Delete file or directory.

**Query Parameters:**
- `sessionId` (required): Session token
- `path` (required): File/directory path

**Response:**
```json
{
  "success": true,
  "path": "/public_html/old-file.html"
}
```

### POST `/api/ftp/upload`
Upload new file.

**Request:** (multipart/form-data)
- `sessionId`: Session token
- `path`: Target directory path
- `file`: File to upload

**Response:**
```json
{
  "success": true,
  "path": "/public_html/images/photo.jpg",
  "size": 102400
}
```

### POST `/api/ftp/disconnect`
Close FTP connection.

**Request:**
```json
{
  "sessionId": "session_token"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Storage (S3) API

### POST `/api/storage/connect`
Connect to S3-compatible storage.

**Request:**
```json
{
  "bucket": "my-bucket",
  "region": "us-east-1",
  "accessKeyId": "AKIA...",
  "secretAccessKey": "secret",
  "endpoint": "https://s3.amazonaws.com"  // Optional
}
```

**Response:**
```json
{
  "sessionId": "session_token",
  "connected": true,
  "bucket": "my-bucket"
}
```

### GET `/api/storage/list`
List bucket objects.

**Query Parameters:**
- `sessionId` (required): Session token
- `prefix` (optional): Filter by prefix
- `delimiter` (optional): Directory delimiter (default: /)

**Response:**
```json
{
  "objects": [
    {
      "key": "index.html",
      "size": 2048,
      "lastModified": "2025-01-15T12:00:00Z",
      "etag": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "prefixes": ["css/", "js/"]
}
```

### GET `/api/storage/object`
Get object content.

**Query Parameters:**
- `sessionId` (required): Session token
- `key` (required): Object key

**Response:**
```json
{
  "key": "index.html",
  "content": "<!DOCTYPE html>...",
  "contentType": "text/html",
  "size": 2048,
  "metadata": {}
}
```

### PUT `/api/storage/object`
Upload/update object.

**Request:**
```json
{
  "sessionId": "session_token",
  "key": "index.html",
  "content": "<!DOCTYPE html>...",
  "contentType": "text/html",
  "metadata": {
    "author": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "key": "index.html",
  "etag": "d41d8cd98f00b204e9800998ecf8427e",
  "versionId": "version_id"  // If versioning enabled
}
```

---

## AI API

### POST `/api/ai/chat`
Send message to AI assistant.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain this function"
    }
  ],
  "mode": "explain",
  "provider": "openai",
  "model": "gpt-4",
  "context": {
    "files": [
      {
        "path": "/app.js",
        "content": "function hello() {...}",
        "language": "javascript"
      }
    ],
    "selection": "function hello() {...}",
    "cursorPosition": { "line": 10, "column": 5 }
  }
}
```

**Response:** (streaming)
```json
{
  "id": "msg_uuid",
  "role": "assistant",
  "content": "This function...",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200,
    "totalTokens": 350
  }
}
```

### POST `/api/ai/complete`
Get code completion suggestions.

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "code": "function calculate",
  "language": "javascript",
  "cursorPosition": { "line": 5, "column": 18 },
  "context": {
    "beforeCursor": "const x = 10;\nconst y = 20;\n",
    "afterCursor": "\nconsole.log(result);"
  }
}
```

**Response:**
```json
{
  "completions": [
    {
      "text": "Sum(a, b) {\n  return a + b;\n}",
      "score": 0.95
    }
  ]
}
```

### POST `/api/ai/explain`
Get code explanation.

**Request:**
```json
{
  "provider": "anthropic",
  "model": "claude-3-opus",
  "code": "const map = arr.map(x => x * 2);",
  "language": "javascript"
}
```

**Response:**
```json
{
  "explanation": "This code creates a new array by doubling each element...",
  "concepts": ["Array.map", "Arrow functions", "Immutability"],
  "complexity": "O(n)"
}
```

### POST `/api/ai/refactor`
Get refactoring suggestions.

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "code": "function badFunction() { var x = 1; var y = 2; return x + y; }",
  "language": "javascript",
  "goals": ["modernize", "readability"]
}
```

**Response:**
```json
{
  "refactoredCode": "const sum = (a = 1, b = 2) => a + b;",
  "changes": [
    "Converted to arrow function",
    "Replaced var with const",
    "Added default parameters",
    "Improved naming"
  ],
  "improvements": {
    "readability": 8,
    "maintainability": 9,
    "performance": 5
  }
}
```

---

## Connections API

### GET `/api/connections`
List user's saved connections.

**Response:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "name": "Production Server",
      "type": "sftp",
      "host": "ftp.example.com",
      "port": 22,
      "username": "user",
      "basePath": "/public_html",
      "createdAt": "2025-01-10T12:00:00Z",
      "lastUsed": "2025-01-15T14:30:00Z"
    }
  ]
}
```

### POST `/api/connections`
Save new connection.

**Request:**
```json
{
  "name": "Production Server",
  "type": "sftp",
  "host": "ftp.example.com",
  "port": 22,
  "username": "user",
  "password": "pass",  // Will be encrypted
  "basePath": "/public_html"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Production Server",
  "type": "sftp",
  "host": "ftp.example.com",
  "port": 22
}
```

### PUT `/api/connections/:id`
Update connection.

**Request:**
```json
{
  "name": "Updated Name",
  "basePath": "/var/www"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "type": "sftp",
  "host": "ftp.example.com",
  "basePath": "/var/www"
}
```

### DELETE `/api/connections/:id`
Delete connection.

**Response:**
```json
{
  "success": true
}
```

---

## File Versions API

### GET `/api/versions`
List file version history.

**Query Parameters:**
- `filePath` (required): File path

**Response:**
```json
{
  "versions": [
    {
      "id": "version_uuid",
      "filePath": "/index.html",
      "size": 2048,
      "userId": "user_uuid",
      "userName": "John Doe",
      "message": "Updated header section",
      "timestamp": "2025-01-15T12:00:00Z"
    }
  ]
}
```

### GET `/api/versions/:id`
Get specific version content.

**Response:**
```json
{
  "id": "version_uuid",
  "filePath": "/index.html",
  "content": "<!DOCTYPE html>...",
  "size": 2048,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### POST `/api/versions/restore`
Restore file to previous version.

**Request:**
```json
{
  "versionId": "version_uuid",
  "sessionId": "session_token"
}
```

**Response:**
```json
{
  "success": true,
  "filePath": "/index.html",
  "newVersionId": "new_version_uuid"
}
```

---

## Rate Limits

- **Authentication**: 10 requests per minute
- **FTP Operations**: 100 requests per minute
- **AI Requests**: 20 requests per minute
- **File Uploads**: 50 MB per request, 500 MB per hour

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request parameters |
| `FTP_CONNECTION_FAILED` | Cannot connect to FTP server |
| `FTP_TIMEOUT` | FTP operation timed out |
| `FILE_TOO_LARGE` | File exceeds size limit |
| `AI_REQUEST_FAILED` | AI provider returned error |
| `AI_QUOTA_EXCEEDED` | AI usage quota exceeded |
| `S3_CONNECTION_FAILED` | Cannot connect to S3 |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## WebSocket API (Future)

### Connection
```javascript
const ws = new WebSocket('wss://your-domain.com/api/ws?token=<jwt>');
```

### Events
- `file:changed` - File was modified externally
- `connection:status` - FTP connection status update
- `ai:stream` - Streaming AI response
