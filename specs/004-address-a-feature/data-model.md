# Data Model: FTP Editor Loading Bug Fix

**Date**: 2025-09-17
**Feature**: Fix FTP Editor Loading Failure
**Phase**: Design Phase 1

## Core Entities

### 1. Editor Session
Represents the active editing session with connection state and loaded files.

**Purpose**: Track the complete state of a user's FTP editing session
**Lifecycle**: Created on editor load, updated during operations, destroyed on navigation away

**Attributes**:
- `websiteId`: string - Unique identifier for the website being edited
- `connectionStatus`: ConnectionStatus - Current FTP connection state
- `loadedFiles`: Map<string, FileContent> - Currently loaded file contents
- `currentFile`: string | null - Path of actively edited file
- `errorState`: EditorError | null - Current error state if any
- `lastActivity`: Date - Timestamp of last user interaction

**State Transitions**:
- `initializing` → `connected` (successful FTP connection)
- `initializing` → `error` (connection failure)
- `connected` → `loading` (file operation in progress)
- `loading` → `connected` (operation completed)
- `loading` → `error` (operation failed)
- `error` → `initializing` (retry attempted)

**Validation Rules**:
- `websiteId` must be valid and exist in storage
- `connectionStatus` must be valid enum value
- `currentFile` must exist in `loadedFiles` if not null
- `lastActivity` must be recent (within session timeout)

### 2. FTP Connection
Connection parameters and status for accessing remote files.

**Purpose**: Manage FTP connection lifecycle and status
**Lifecycle**: Created from website configuration, maintained in connection pool

**Attributes**:
- `id`: string - Unique connection identifier
- `websiteId`: string - Reference to website configuration
- `status`: ConnectionStatus - Current connection state
- `config`: FTPConfig - Connection parameters (host, port, credentials)
- `lastUsed`: Date - Timestamp of last operation
- `errorCount`: number - Consecutive error count for circuit breaker
- `capabilities`: string[] - Server-reported capabilities

**Relationships**:
- Belongs to one Website (via websiteId)
- Used by one or more Editor Sessions
- Managed by FTP Connection Pool

**Validation Rules**:
- `config.host` must be valid hostname or IP
- `config.port` must be valid port number (1-65535)
- `config.username` and `config.password` required for authentication
- `errorCount` resets to 0 on successful operation
- Connection expires after inactivity timeout

### 3. Error State
Categorized error information with user-friendly messages and retry capabilities.

**Purpose**: Provide structured error handling with user guidance
**Lifecycle**: Created on error occurrence, cleared on successful operation or retry

**Attributes**:
- `type`: ErrorType - Category of error for handling strategy
- `code`: string - Specific error code for debugging
- `userMessage`: string - Human-readable error description
- `technicalDetails`: string - Technical error information for support
- `retryable`: boolean - Whether retry operation is available
- `suggestedAction`: string - Recommended user action
- `timestamp`: Date - When error occurred
- `context`: Record<string, any> - Additional error context

**Error Types**:
- `connection`: Network connectivity issues
- `authentication`: Invalid credentials or permissions
- `server`: FTP server errors or unavailability
- `configuration`: Invalid website configuration
- `timeout`: Operation timeout exceeded
- `unknown`: Unexpected errors requiring investigation

**Validation Rules**:
- `type` must be valid ErrorType enum value
- `userMessage` must be non-empty and user-friendly
- `technicalDetails` should include stack trace for debugging
- `suggestedAction` must provide actionable guidance
- `retryable` should be false for authentication errors

## Supporting Types

### ConnectionStatus Enum
```typescript
enum ConnectionStatus {
  INITIALIZING = 'initializing',    // Connection being established
  CONNECTED = 'connected',          // Ready for operations
  LOADING = 'loading',              // Operation in progress
  ERROR = 'error',                  // Connection failed
  DISCONNECTED = 'disconnected',    // Explicitly disconnected
  TIMEOUT = 'timeout'               // Connection timed out
}
```

### ErrorType Enum
```typescript
enum ErrorType {
  CONNECTION = 'connection',
  AUTHENTICATION = 'authentication',
  SERVER = 'server',
  CONFIGURATION = 'configuration',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}
```

### FTPConfig Interface
```typescript
interface FTPConfig {
  host: string
  port: number
  username: string
  password: string
  type: 'FTP' | 'SFTP' | 'FTPS'
  path: string
  secure?: boolean
  timeout?: number
}
```

## Entity Relationships

```
Website (existing)
    ↓ (1:1)
FTP Connection
    ↓ (1:many)
Editor Session
    ↓ (1:1)
Error State (optional)
```

## Data Flow Patterns

### 1. Editor Initialization Flow
1. User clicks "Edit Files" → Navigate to `/editor/[websiteId]`
2. Load Website from storage → Create FTP Connection
3. Test FTP Connection → Create Editor Session
4. Load file tree → Update session state
5. Ready for editing operations

### 2. Error Handling Flow
1. Operation fails → Create Error State
2. Categorize error type → Generate user message
3. Update Editor Session → Display error to user
4. User clicks retry → Clear error state → Retry operation

### 3. Connection Recovery Flow
1. Connection lost → Update status to ERROR
2. Create Error State with retry option
3. User initiates retry → Re-establish connection
4. Success → Clear error, update status to CONNECTED
5. Failure → Update error with new details

## Storage Alignment Strategy

### Current State Problem
- Website API uses `websites-memory-store.ts`
- FTP Editor APIs use `websites-store.ts`
- Result: Websites created via dashboard not found by editor

### Solution
- Standardize all APIs to use `websites-memory-store.ts`
- Maintain existing interface compatibility
- No data migration required (memory store starts empty)

### Updated API Imports
```typescript
// Before (causing bug)
import { getWebsite } from '@/lib/websites-store'

// After (fix)
import { getWebsite } from '@/lib/websites-memory-store'
```

## Performance Considerations

### Memory Usage
- Editor Session: ~1KB per session
- FTP Connection: ~500B per connection
- Error State: ~200B per error
- Total impact: Negligible for expected user count

### Connection Pool Efficiency
- Reuse existing connections across sessions
- Lazy connection cleanup (timeout-based)
- Circuit breaker pattern for failing connections

### Error Handling Performance
- Error creation: O(1) operation
- Error categorization: Map-based lookup
- User message generation: Template-based, cached

---

**Data Model Complete**: Ready for API contract generation