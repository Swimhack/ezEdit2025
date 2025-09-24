# Data Model: Resolve Authentication Regression Issue

**Feature**: 012-invalid-email-or | **Date**: 2025-09-20

## Core Entities

### 1. Enhanced User Account

**Purpose**: User authentication entity with migration tracking and backward compatibility

```typescript
interface UserAccount {
  // Core identification
  id: string;                     // UUID primary key
  email: string;                  // User email address (unique)

  // Authentication data
  hashedPassword?: string;        // Hashed password (Supabase managed)
  authProvider: AuthProvider;     // DEMO, SUPABASE, GOOGLE, etc.

  // Migration tracking
  migrationStatus: MigrationStatus; // PENDING, IN_PROGRESS, COMPLETED, FAILED
  migratedAt?: Date;             // Migration completion timestamp
  migratedFromProvider?: string;  // Original authentication provider

  // Profile data
  name?: string;                 // Display name
  role: UserRole;                // USER, ADMIN, SUPER_ADMIN

  // Account state
  isEmailVerified: boolean;      // Email verification status
  isActive: boolean;             // Account active status
  lastLoginAt?: Date;            // Last successful login timestamp

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `email` must be valid email format and unique
- `authProvider` must be valid AuthProvider enum value
- `migrationStatus` must be valid MigrationStatus enum value
- `role` must be valid UserRole enum value
- `migratedAt` must be after `createdAt` if present

### 2. Authentication Session

**Purpose**: User session management with hybrid token support for demo and Supabase authentication

```typescript
interface AuthenticationSession {
  // Core identification
  id: string;                    // UUID primary key
  userId: string;                // Foreign key to UserAccount

  // Session data
  sessionType: SessionType;      // DEMO, SUPABASE, HYBRID
  accessToken: string;           // JWT or demo token
  refreshToken?: string;         // Refresh token (Supabase only)

  // Session lifecycle
  expiresAt: Date;              // Session expiration timestamp
  isActive: boolean;            // Session active status
  deviceInfo?: string;          // User agent or device identifier
  ipAddress?: string;           // Client IP address (anonymized)

  // Migration support
  legacyToken?: string;         // Original demo token if migrated
  migrationContext?: {          // Migration metadata
    originalProvider: string;
    migrationReason: string;
    migrationTimestamp: Date;
  };

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}
```

**Validation Rules**:
- `userId` must reference valid UserAccount
- `sessionType` must be valid SessionType enum value
- `expiresAt` must be in the future for active sessions
- `accessToken` format depends on sessionType
- `lastAccessedAt` must not be before `createdAt`

### 3. User Migration Log

**Purpose**: Comprehensive audit trail for user account migrations between authentication providers

```typescript
interface UserMigrationLog {
  // Core identification
  id: string;                    // UUID primary key
  userId: string;                // Foreign key to UserAccount

  // Migration details
  fromProvider: AuthProvider;    // Source authentication provider
  toProvider: AuthProvider;      // Target authentication provider
  migrationTrigger: MigrationTrigger; // LOGIN_ATTEMPT, MANUAL, BATCH, etc.

  // Migration process
  status: MigrationStatus;       // PENDING, IN_PROGRESS, COMPLETED, FAILED
  startedAt: Date;              // Migration start timestamp
  completedAt?: Date;           // Migration completion timestamp

  // Migration data
  originalCredentials?: {        // Original authentication data (sanitized)
    email: string;
    provider: string;
    accountId?: string;
  };
  newCredentials?: {            // New authentication data (sanitized)
    email: string;
    provider: string;
    accountId?: string;
  };

  // Error handling
  errorMessage?: string;        // Error description if migration failed
  errorCode?: string;           // Error code for categorization
  retryCount: number;           // Number of retry attempts

  // Context
  userAgent?: string;           // Browser/client information
  ipAddress?: string;           // Client IP address (anonymized)
  correlationId?: string;       // Request correlation ID

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `userId` must reference valid UserAccount
- `fromProvider` and `toProvider` must be valid AuthProvider enum values
- `fromProvider` and `toProvider` must be different
- `completedAt` must be after `startedAt` if present
- `retryCount` must be non-negative integer

### 4. Authentication Error Event

**Purpose**: Detailed error tracking for authentication failures with categorization and recovery guidance

```typescript
interface AuthenticationErrorEvent {
  // Core identification
  id: string;                    // UUID primary key
  correlationId?: string;        // Request correlation ID

  // Error classification
  errorType: AuthErrorType;      // INVALID_CREDENTIALS, MIGRATION_FAILED, SESSION_EXPIRED, etc.
  errorCategory: AuthErrorCategory; // USER_ERROR, SYSTEM_ERROR, CONFIGURATION_ERROR
  severity: ErrorSeverity;       // LOW, MEDIUM, HIGH, CRITICAL

  // Error details
  errorCode: string;             // Specific error code
  errorMessage: string;          // Human-readable error message
  technicalDetails?: string;     // Technical error information

  // Context information
  attemptedEmail?: string;       // Email used in failed attempt (anonymized)
  authProvider?: AuthProvider;   // Authentication provider used
  userAgent?: string;            // Browser/client information
  ipAddress?: string;            // Client IP address (anonymized)

  // Resolution guidance
  isRecoverable: boolean;        // Whether error can be resolved by user
  recoveryActions?: string[];    // Suggested recovery steps
  retryable: boolean;            // Whether operation can be retried
  retryAfter?: number;           // Suggested retry delay (seconds)

  // Impact assessment
  userId?: string;               // Affected user (if applicable)
  sessionId?: string;            // Affected session (if applicable)
  userImpact: UserImpact;        // NONE, LOW, MEDIUM, HIGH

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
- `errorType` must be valid AuthErrorType enum value
- `errorCategory` must be valid AuthErrorCategory enum value
- `severity` must be valid ErrorSeverity enum value
- `errorMessage` maximum length: 1,000 characters
- `technicalDetails` maximum length: 5,000 characters
- `retryAfter` must be positive number if provided

## Enumerations

### AuthProvider
```typescript
enum AuthProvider {
  DEMO = 'DEMO',                 // Demo/hardcoded users
  SUPABASE = 'SUPABASE',         // Supabase authentication
  GOOGLE = 'GOOGLE',             // Google OAuth
  GITHUB = 'GITHUB',             // GitHub OAuth
  MICROSOFT = 'MICROSOFT'        // Microsoft OAuth
}
```

### MigrationStatus
```typescript
enum MigrationStatus {
  PENDING = 'PENDING',           // Migration not started
  IN_PROGRESS = 'IN_PROGRESS',   // Migration in progress
  COMPLETED = 'COMPLETED',       // Migration successful
  FAILED = 'FAILED',             // Migration failed
  CANCELLED = 'CANCELLED'        // Migration cancelled
}
```

### MigrationTrigger
```typescript
enum MigrationTrigger {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',     // Triggered by user login
  MANUAL = 'MANUAL',                   // Manually triggered
  BATCH = 'BATCH',                     // Part of batch migration
  ADMIN = 'ADMIN',                     // Triggered by admin
  SYSTEM = 'SYSTEM'                    // System-triggered
}
```

### SessionType
```typescript
enum SessionType {
  DEMO = 'DEMO',                 // Demo session format
  SUPABASE = 'SUPABASE',         // Supabase JWT session
  HYBRID = 'HYBRID'              // Mixed session (during migration)
}
```

### UserRole
```typescript
enum UserRole {
  USER = 'USER',                 // Standard user
  ADMIN = 'ADMIN',               // Administrator
  SUPER_ADMIN = 'SUPER_ADMIN'    // Super administrator
}
```

### AuthErrorType
```typescript
enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}
```

### AuthErrorCategory
```typescript
enum AuthErrorCategory {
  USER_ERROR = 'USER_ERROR',           // User-caused error
  SYSTEM_ERROR = 'SYSTEM_ERROR',       // System/infrastructure error
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR', // Configuration issue
  EXTERNAL_ERROR = 'EXTERNAL_ERROR'    // External service error
}
```

## Entity Relationships

### Primary Relationships
1. **UserAccount** ← (1:0..*) → **AuthenticationSession**
   - Each user can have multiple active sessions
   - Sessions always belong to a user

2. **UserAccount** ← (1:0..*) → **UserMigrationLog**
   - Each user can have multiple migration records
   - Migration logs always reference a user

3. **AuthenticationSession** ← (1:0..*) → **AuthenticationErrorEvent**
   - Error events may reference specific sessions
   - Sessions may have multiple error events

4. **UserAccount** ← (1:0..*) → **AuthenticationErrorEvent**
   - Error events may reference specific users
   - Users may have multiple error events

### State Transitions

#### Migration Status Flow
```
PENDING → IN_PROGRESS → COMPLETED
   ↓            ↓           ↑
CANCELLED ← FAILED --------+
```

#### Session Lifecycle
```
DEMO → HYBRID → SUPABASE
  ↓      ↓        ↓
EXPIRED/INVALID
```

#### Error Event Flow
```
OPEN → INVESTIGATING → RESOLVED
  ↓                      ↑
IGNORED ←---------------+
```

## Data Validation Rules

### Cross-Entity Constraints
1. **Migration Consistency**: User's `migrationStatus` must match latest migration log status
2. **Session Validity**: Active sessions must have `expiresAt` in the future
3. **Authentication Provider**: User's `authProvider` must match session `sessionType` (or HYBRID during migration)
4. **Error Resolution**: Resolved errors must have `resolvedAt` timestamp

### Business Rules
1. **Unique Email**: Each email can only be associated with one UserAccount
2. **Migration Direction**: Users can only migrate from DEMO to other providers (not reverse)
3. **Session Limit**: Users can have maximum 5 active sessions
4. **Error Retention**: Error events older than 90 days are archived

## Indexing Strategy

### Performance Indexes
- `UserAccount.email` (unique index for login lookups)
- `UserAccount.migrationStatus` (for migration queries)
- `AuthenticationSession.userId + isActive` (for user session queries)
- `AuthenticationSession.accessToken` (for session validation)
- `UserMigrationLog.userId + createdAt` (for migration history)
- `AuthenticationErrorEvent.correlationId` (for error tracking)
- `AuthenticationErrorEvent.createdAt + errorType` (for error analysis)

### Search Indexes
- `AuthenticationErrorEvent.errorMessage` (full-text search for support)
- `UserMigrationLog.errorMessage` (full-text search for troubleshooting)

## Data Retention Policies

### Retention Periods
- **UserAccount**: Indefinite (until user deletion)
- **AuthenticationSession**: 30 days after expiration
- **UserMigrationLog**: 12 months (for audit compliance)
- **AuthenticationErrorEvent**: 90 days (unless critical errors - 12 months)

### Cleanup Procedures
- **Expired Sessions**: Daily cleanup of sessions past `expiresAt`
- **Old Errors**: Weekly cleanup of non-critical errors >90 days
- **Migration Logs**: Monthly cleanup of non-failed migrations >12 months
- **Anonymous Data**: User deletion anonymizes related migration logs and errors