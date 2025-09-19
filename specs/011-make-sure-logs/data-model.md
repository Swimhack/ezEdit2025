# Data Model: Enhanced Logging for FTP and Editor Troubleshooting

**Feature**: 011-make-sure-logs | **Date**: 2025-09-18

## Core Entities

### 1. Enhanced ApplicationLog

**Purpose**: Primary log entry entity with enhanced metadata for FTP and editor operations

```typescript
interface ApplicationLog {
  // Core identification
  id: string;                    // UUID primary key
  correlationId: string;         // Cross-operation tracking ID
  parentCorrelationId?: string;  // Hierarchical operation tracking

  // Temporal data
  timestamp: Date;               // ISO 8601 timestamp
  processingTime?: number;       // Operation duration in milliseconds

  // Classification
  level: LogLevel;               // ERROR, WARN, INFO, DEBUG, TRACE
  category: LogCategory;         // FTP, EDITOR, AUTH, SYSTEM, API
  source: LogSource;             // CLIENT, SERVER, FTP_CLIENT, EDITOR

  // Content
  message: string;               // Human-readable message
  event: string;                 // Machine-readable event identifier
  context: Record<string, any>;  // Structured metadata

  // User context
  userId?: string;               // Associated user (if applicable)
  sessionId?: string;            // Browser/FTP session identifier
  userAgent?: string;            // Browser user agent string
  ipAddress?: string;            // Sanitized IP address

  // Performance and metrics
  metrics?: PerformanceMetrics;  // Operation performance data

  // Storage tier management
  tier: StorageTier;             // HOT, WARM, COLD
  compressedSize?: number;       // Compressed storage size
  searchVector?: string;         // PostgreSQL ts_vector for full-text search

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `correlationId` must be valid UUID format or timestamped format
- `level` must be one of defined LogLevel enum values
- `category` must be one of defined LogCategory enum values
- `message` maximum length: 10,000 characters
- `context` maximum size: 50KB JSON
- `processingTime` must be positive number if provided

### 2. FTPOperationLog

**Purpose**: Specialized log entry for FTP operations with connection and transfer details

```typescript
interface FTPOperationLog extends ApplicationLog {
  // Override category to enforce FTP classification
  category: LogCategory.FTP;

  // FTP-specific context
  ftpContext: {
    // Connection details (sanitized)
    host: string;                // FTP server hostname/IP
    port: number;                // FTP server port
    username: string;            // FTP username (not password)
    protocol: 'FTP' | 'SFTP' | 'FTPS';

    // Operation details
    operation: FTPOperation;     // CONNECT, LIST, UPLOAD, DOWNLOAD, DELETE, DISCONNECT
    remotePath?: string;         // Server file/directory path
    localPath?: string;          // Local file path (if applicable)

    // Transfer details (for file operations)
    fileSize?: number;           // File size in bytes
    transferredBytes?: number;   // Bytes successfully transferred
    transferSpeed?: number;      // Transfer speed in bytes/second

    // Connection state
    connectionPoolId?: string;   // Connection pool identifier
    isPassiveMode?: boolean;     // FTP passive mode flag

    // Error details (if operation failed)
    ftpErrorCode?: number;       // FTP response code (e.g., 550, 426)
    ftpErrorMessage?: string;    // FTP server error message
    retryAttempt?: number;       // Retry attempt number

    // Performance metrics
    connectionTime?: number;     // Time to establish connection (ms)
    dataTransferTime?: number;   // Time for actual data transfer (ms)
  };
}
```

**Validation Rules**:
- `ftpContext.host` must be valid hostname or IP address
- `ftpContext.port` must be between 1-65535
- `ftpContext.operation` must be valid FTPOperation enum value
- `ftpContext.fileSize` and `transferredBytes` must be non-negative
- `ftpContext.ftpErrorCode` must be valid FTP response code (100-599)

### 3. EditorOperationLog

**Purpose**: Specialized log entry for editor operations with file and state details

```typescript
interface EditorOperationLog extends ApplicationLog {
  // Override category to enforce EDITOR classification
  category: LogCategory.EDITOR;

  // Editor-specific context
  editorContext: {
    // File details
    fileId?: string;             // Internal file identifier
    fileName?: string;           // File name with extension
    filePath?: string;           // Full file path
    fileSize?: number;           // File size in bytes
    fileExtension?: string;      // File extension (e.g., '.html', '.css')
    mimeType?: string;           // MIME type

    // Operation details
    operation: EditorOperation;  // LOAD, SAVE, PREVIEW, VALIDATE, SWITCH, MODIFY
    previousState?: string;      // Previous editor state (if applicable)
    currentState?: string;       // Current editor state

    // Content details
    contentLength?: number;      // Content length in characters
    lineCount?: number;          // Number of lines
    modificationCount?: number;  // Number of modifications in session

    // Editor state
    cursorPosition?: {           // Current cursor position
      line: number;
      column: number;
    };
    selectedText?: {             // Selected text range
      start: { line: number; column: number; };
      end: { line: number; column: number; };
    };

    // Three-pane layout state
    leftPaneVisible?: boolean;   // File tree visibility
    rightPaneVisible?: boolean;  // Preview pane visibility
    activePane?: 'tree' | 'editor' | 'preview';

    // Validation and errors
    syntaxErrors?: Array<{       // Syntax validation errors
      line: number;
      column: number;
      message: string;
      severity: 'error' | 'warning';
    }>;

    // Performance metrics
    loadTime?: number;           // File load time (ms)
    saveTime?: number;           // File save time (ms)
    renderTime?: number;         // Preview render time (ms)
  };
}
```

**Validation Rules**:
- `editorContext.operation` must be valid EditorOperation enum value
- `editorContext.fileSize` and `contentLength` must be non-negative
- `editorContext.cursorPosition` coordinates must be non-negative
- `editorContext.syntaxErrors` must have valid line/column numbers

### 4. ErrorEvent

**Purpose**: Detailed error information with categorization and recovery context

```typescript
interface ErrorEvent {
  // Core identification
  id: string;                    // UUID primary key
  correlationId: string;         // Links to associated log entry

  // Error classification
  errorType: ErrorType;          // CONNECTION, AUTHENTICATION, PERMISSION, VALIDATION, SYSTEM
  errorCategory: ErrorCategory;  // FTP, EDITOR, API, DATABASE, NETWORK
  severity: ErrorSeverity;       // CRITICAL, HIGH, MEDIUM, LOW

  // Error details
  errorCode?: string;            // Application-specific error code
  errorMessage: string;          // Human-readable error message
  stackTrace?: string;           // Stack trace (sanitized)

  // Context information
  component: string;             // Component where error occurred
  operation: string;             // Operation being performed
  inputData?: Record<string, any>; // Sanitized input data

  // Recovery information
  isRecoverable: boolean;        // Whether error is recoverable
  recoveryActions?: string[];    // Suggested recovery actions
  retryable: boolean;            // Whether operation can be retried
  retryAfter?: number;           // Suggested retry delay (ms)

  // Impact assessment
  userImpact: UserImpact;        // NONE, LOW, MEDIUM, HIGH, CRITICAL
  systemImpact: SystemImpact;    // NONE, PERFORMANCE, AVAILABILITY, DATA_LOSS
  affectedUsers?: number;        // Number of users affected

  // Resolution tracking
  status: ErrorStatus;           // OPEN, INVESTIGATING, RESOLVED, IGNORED
  resolvedAt?: Date;             // Resolution timestamp
  resolutionNotes?: string;      // Resolution description

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `errorMessage` maximum length: 5,000 characters
- `stackTrace` maximum length: 20,000 characters
- `severity` must be valid ErrorSeverity enum value
- `affectedUsers` must be non-negative integer
- `retryAfter` must be positive number if provided

### 5. PerformanceMetrics

**Purpose**: Quantitative measurements for performance monitoring and optimization

```typescript
interface PerformanceMetrics {
  // Timing metrics
  startTime: Date;               // Operation start timestamp
  endTime: Date;                 // Operation end timestamp
  duration: number;              // Total duration in milliseconds

  // Request/Response metrics
  requestSize?: number;          // Request payload size (bytes)
  responseSize?: number;         // Response payload size (bytes)

  // Network metrics (for FTP operations)
  networkLatency?: number;       // Network round-trip time (ms)
  bandwidth?: number;            // Effective bandwidth (bytes/second)
  connectionTime?: number;       // Time to establish connection (ms)

  // System resource metrics
  memoryUsage?: {                // Memory usage during operation
    heapUsed: number;            // Used heap memory (bytes)
    heapTotal: number;           // Total heap memory (bytes)
    external: number;            // External memory (bytes)
  };
  cpuUsage?: {                   // CPU usage during operation
    user: number;                // User CPU time (microseconds)
    system: number;              // System CPU time (microseconds)
  };

  // Application-specific metrics
  cacheHitRate?: number;         // Cache hit rate (0.0 - 1.0)
  errorRate?: number;            // Error rate (0.0 - 1.0)
  throughput?: number;           // Operations per second

  // Database metrics (for logging operations)
  queryCount?: number;           // Number of database queries
  queryTime?: number;            // Total query execution time (ms)

  // Custom metrics
  customMetrics?: Record<string, number>; // Application-specific metrics
}
```

**Validation Rules**:
- `duration` must be non-negative
- `startTime` must be before or equal to `endTime`
- Percentage values (`cacheHitRate`, `errorRate`) must be between 0.0 and 1.0
- All size values must be non-negative integers

## Enumerations

### LogLevel
```typescript
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}
```

### LogCategory
```typescript
enum LogCategory {
  FTP = 'FTP',
  EDITOR = 'EDITOR',
  AUTH = 'AUTH',
  API = 'API',
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK'
}
```

### LogSource
```typescript
enum LogSource {
  CLIENT = 'CLIENT',           // Browser/frontend
  SERVER = 'SERVER',           // Next.js server
  FTP_CLIENT = 'FTP_CLIENT',   // FTP client library
  EDITOR = 'EDITOR',           // Monaco editor
  DATABASE = 'DATABASE',       // Database operations
  EXTERNAL = 'EXTERNAL'        // External services
}
```

### FTPOperation
```typescript
enum FTPOperation {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  LIST = 'LIST',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  DELETE = 'DELETE',
  MKDIR = 'MKDIR',
  RMDIR = 'RMDIR',
  RENAME = 'RENAME',
  CHMOD = 'CHMOD',
  STAT = 'STAT'
}
```

### EditorOperation
```typescript
enum EditorOperation {
  LOAD = 'LOAD',               // Load file into editor
  SAVE = 'SAVE',               // Save file changes
  PREVIEW = 'PREVIEW',         // Generate preview
  VALIDATE = 'VALIDATE',       // Validate syntax
  SWITCH = 'SWITCH',           // Switch between files
  MODIFY = 'MODIFY',           // Content modification
  SEARCH = 'SEARCH',           // Search within file
  REPLACE = 'REPLACE',         // Replace text
  FORMAT = 'FORMAT',           // Format code
  AUTOCOMPLETE = 'AUTOCOMPLETE' // Auto-completion
}
```

### StorageTier
```typescript
enum StorageTier {
  HOT = 'HOT',                 // Recent logs, fast access
  WARM = 'WARM',               // Older logs, medium access
  COLD = 'COLD'                // Archive logs, slow access
}
```

## Relationships

### Entity Relationships
1. **ApplicationLog** ← (1:1) → **FTPOperationLog** | **EditorOperationLog**
   - FTP and Editor logs extend the base ApplicationLog
   - Each specialized log has exactly one base log entry

2. **ApplicationLog** ← (1:0..1) → **ErrorEvent**
   - Each log entry may have an associated error event
   - Error events always link back to a log entry

3. **ApplicationLog** ← (1:0..1) → **PerformanceMetrics**
   - Each log entry may have associated performance metrics
   - Performance metrics always link back to a log entry

4. **ApplicationLog** ← (1:0..*) → **ApplicationLog** (parent-child)
   - Hierarchical relationship through `parentCorrelationId`
   - Enables tracing of related operations

### State Transitions

#### Log Entry Lifecycle
```
CREATED → HOT_TIER → WARM_TIER → COLD_TIER → ARCHIVED/DELETED
```

#### Error Event Lifecycle
```
OPEN → INVESTIGATING → RESOLVED/IGNORED
```

## Indexing Strategy

### Primary Indexes
- `ApplicationLog.id` (Primary Key, UUID)
- `ApplicationLog.correlationId` (Non-unique, frequently queried)
- `ApplicationLog.timestamp` (Range queries, partitioning key)
- `ApplicationLog.category + level` (Composite index for filtering)

### Search Indexes
- `ApplicationLog.searchVector` (PostgreSQL ts_vector for full-text search)
- `ApplicationLog.userId + timestamp` (User-specific queries)
- `FTPOperationLog.ftpContext.host + operation` (FTP troubleshooting)
- `EditorOperationLog.editorContext.fileName + operation` (Editor troubleshooting)

### Performance Considerations
- Time-based partitioning by month for large datasets
- Separate indexes per storage tier for query optimization
- Partial indexes for frequently filtered combinations
- Consider materialized views for common aggregations

## Data Retention Policies

### Tier Migration Schedule
- **HOT → WARM**: After 7 days
- **WARM → COLD**: After 90 days
- **COLD → ARCHIVE**: After 365 days
- **ARCHIVE → DELETE**: Configurable retention (default: never)

### Cleanup Procedures
- Automated daily cleanup jobs
- Configurable retention periods per log category
- Emergency cleanup procedures for storage pressure
- Audit trail for all cleanup operations