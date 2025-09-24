# Data Model: Remove Demo Users and Establish Proper Authentication

**Feature**: 013-no-demo-users | **Date**: 2025-09-20

## Core Entities

### 1. Enhanced User Account

**Purpose**: Clean user authentication entity with proper Supabase integration

```typescript
interface UserAccount {
  // Core identification
  id: string;                     // UUID primary key (Supabase managed)
  email: string;                  // User email address (unique)

  // Authentication data (Supabase managed)
  emailVerified: boolean;         // Email verification status
  authProvider: 'SUPABASE';       // Always Supabase (no more demo)

  // Profile data
  name?: string;                 // Display name
  role: UserRole;                // USER, ADMIN, SUPER_ADMIN

  // Account state
  isActive: boolean;             // Account active status
  lastLoginAt?: Date;            // Last successful login timestamp

  // Audit trail (Supabase managed)
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `email` must be valid email format and unique
- `role` must be valid UserRole enum value
- `emailVerified` required for account activation
- `isActive` defaults to true on creation

### 2. Authentication Session

**Purpose**: Clean session management with proper Supabase JWT integration

```typescript
interface AuthenticationSession {
  // Core identification
  id: string;                    // UUID primary key
  userId: string;                // Foreign key to UserAccount

  // Session data (Supabase managed)
  accessToken: string;           // Supabase JWT token
  refreshToken: string;          // Supabase refresh token
  sessionType: 'SUPABASE';       // Always Supabase (no more demo/hybrid)

  // Session lifecycle
  expiresAt: Date;              // Session expiration timestamp
  isActive: boolean;            // Session active status
  deviceInfo?: string;          // User agent or device identifier
  ipAddress?: string;           // Client IP address (anonymized)

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}
```

**Validation Rules**:
- `userId` must reference valid UserAccount
- `sessionType` always 'SUPABASE' (simplified from hybrid system)
- `expiresAt` must be in the future for active sessions
- `accessToken` must be valid Supabase JWT format
- `lastAccessedAt` must not be before `createdAt`

### 3. Registration Request

**Purpose**: Track user registration attempts and validation

```typescript
interface RegistrationRequest {
  // Core identification
  id: string;                    // UUID primary key
  email: string;                 // Registration email

  // Registration status
  status: RegistrationStatus;    // PENDING, VERIFIED, FAILED, EXPIRED
  attemptedAt: Date;            // Registration attempt timestamp
  verifiedAt?: Date;            // Email verification timestamp
  completedAt?: Date;           // Account creation timestamp

  // Validation data
  emailToken?: string;          // Email verification token
  tokenExpiresAt?: Date;        // Token expiration
  validationErrors?: string[];  // Validation failure reasons

  // Context
  userAgent?: string;           // Browser/client information
  ipAddress?: string;           // Client IP address (anonymized)

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `email` must be valid email format
- `status` must be valid RegistrationStatus enum value
- `tokenExpiresAt` must be after `attemptedAt` if present
- `verifiedAt` must be after `attemptedAt` if present
- `completedAt` must be after `verifiedAt` if present

### 4. Authentication Error Event

**Purpose**: Track authentication failures for monitoring and debugging

```typescript
interface AuthenticationErrorEvent {
  // Core identification
  id: string;                    // UUID primary key
  correlationId?: string;        // Request correlation ID

  // Error classification
  errorType: AuthErrorType;      // INVALID_CREDENTIALS, ACCOUNT_LOCKED, etc.
  errorCategory: AuthErrorCategory; // USER_ERROR, SYSTEM_ERROR, EXTERNAL_ERROR
  severity: ErrorSeverity;       // LOW, MEDIUM, HIGH, CRITICAL

  // Error details
  errorCode: string;             // Specific error code
  errorMessage: string;          // Human-readable error message
  technicalDetails?: string;     // Technical error information

  // Context information
  attemptedEmail?: string;       // Email used in failed attempt (anonymized)
  userAgent?: string;            // Browser/client information
  ipAddress?: string;            // Client IP address (anonymized)

  // Resolution guidance
  isRecoverable: boolean;        // Whether error can be resolved by user
  recoveryActions?: string[];    // Suggested recovery steps
  retryable: boolean;            // Whether operation can be retried

  // Impact assessment
  userId?: string;               // Affected user (if applicable)
  sessionId?: string;            // Affected session (if applicable)

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

## Enumerations

### UserRole
```typescript
enum UserRole {
  USER = 'USER',                 // Standard user
  ADMIN = 'ADMIN',               // Administrator
  SUPER_ADMIN = 'SUPER_ADMIN'    // Super administrator
}
```

### RegistrationStatus
```typescript
enum RegistrationStatus {
  PENDING = 'PENDING',           // Email verification pending
  VERIFIED = 'VERIFIED',         // Email verified, account creation pending
  COMPLETED = 'COMPLETED',       // Account successfully created
  FAILED = 'FAILED',             // Registration failed
  EXPIRED = 'EXPIRED'            // Verification token expired
}
```

### AuthErrorType
```typescript
enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  RATE_LIMITED = 'RATE_LIMITED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  EXTERNAL_ERROR = 'EXTERNAL_ERROR'
}
```

### AuthErrorCategory
```typescript
enum AuthErrorCategory {
  USER_ERROR = 'USER_ERROR',           // User-caused error
  SYSTEM_ERROR = 'SYSTEM_ERROR',       // System/infrastructure error
  EXTERNAL_ERROR = 'EXTERNAL_ERROR'    // External service error
}
```

### ErrorSeverity
```typescript
enum ErrorSeverity {
  LOW = 'LOW',                   // Minor issues, auto-recoverable
  MEDIUM = 'MEDIUM',             // Standard errors requiring user action
  HIGH = 'HIGH',                 // Critical errors affecting functionality
  CRITICAL = 'CRITICAL'          // System-wide authentication failures
}
```

## Entity Relationships

### Primary Relationships
1. **UserAccount** ← (1:0..*) → **AuthenticationSession**
   - Each user can have multiple active sessions
   - Sessions always belong to a user

2. **UserAccount** ← (1:0..*) → **RegistrationRequest**
   - Each user may have registration history
   - Registration requests track signup attempts

3. **AuthenticationSession** ← (1:0..*) → **AuthenticationErrorEvent**
   - Error events may reference specific sessions
   - Sessions may have multiple error events

4. **UserAccount** ← (1:0..*) → **AuthenticationErrorEvent**
   - Error events may reference specific users
   - Users may have multiple error events

### Simplified State Transitions

#### Registration Flow
```
PENDING → VERIFIED → COMPLETED
   ↓         ↓         ↑
EXPIRED ← FAILED ------+
```

#### Session Lifecycle
```
ACTIVE → EXPIRED
  ↓         ↑
INVALIDATED
```

#### Error Event Flow
```
CREATED → LOGGED → RESOLVED (optional)
```

## Data Validation Rules

### Cross-Entity Constraints
1. **Email Uniqueness**: Each email can only be associated with one active UserAccount
2. **Session Validity**: Active sessions must have `expiresAt` in the future
3. **Registration Completion**: Completed registrations must have corresponding UserAccount
4. **Error Correlation**: Error events should have valid correlation IDs for tracking

### Business Rules
1. **Single Session Type**: All sessions are SUPABASE type (no more demo/hybrid)
2. **Email Verification Required**: Users must verify email before account activation
3. **Session Limit**: Users can have maximum 5 active sessions
4. **Error Retention**: Error events older than 90 days are archived

## Indexing Strategy

### Performance Indexes
- `UserAccount.email` (unique index for login lookups)
- `UserAccount.isActive + createdAt` (for user management queries)
- `AuthenticationSession.userId + isActive` (for user session queries)
- `AuthenticationSession.accessToken` (for session validation)
- `RegistrationRequest.email + status` (for registration tracking)
- `AuthenticationErrorEvent.correlationId` (for error tracking)
- `AuthenticationErrorEvent.createdAt + errorType` (for error analysis)

### Search Indexes
- `AuthenticationErrorEvent.errorMessage` (full-text search for support)
- `RegistrationRequest.validationErrors` (full-text search for troubleshooting)

## Data Retention Policies

### Retention Periods
- **UserAccount**: Indefinite (until user deletion)
- **AuthenticationSession**: 30 days after expiration
- **RegistrationRequest**: 90 days after completion or failure
- **AuthenticationErrorEvent**: 90 days (unless critical errors - 12 months)

### Cleanup Procedures
- **Expired Sessions**: Daily cleanup of sessions past `expiresAt`
- **Old Errors**: Weekly cleanup of non-critical errors >90 days
- **Failed Registrations**: Monthly cleanup of failed/expired registration attempts >90 days
- **Anonymous Data**: User deletion anonymizes related error logs and registration history

## Changes from Previous System

### Removed Entities
- **Demo User Definitions**: Hardcoded DEMO_USERS arrays removed
- **Hybrid Session Types**: No more DEMO or HYBRID session types
- **Migration Tracking**: No longer needed as demo users are removed

### Simplified Entities
- **UserAccount**: Removed `authProvider` options (only SUPABASE)
- **AuthenticationSession**: Removed `sessionType` options (only SUPABASE)
- **Error Events**: Simplified error categories (removed demo-specific errors)

### Enhanced Entities
- **RegistrationRequest**: New entity for tracking signup attempts
- **Error Handling**: Enhanced error tracking for better debugging
- **Session Management**: Cleaner session lifecycle without hybrid complexity