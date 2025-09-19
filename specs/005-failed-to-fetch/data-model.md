# Data Model: Authentication Error Resolution and Application Logging

**Feature Branch**: `005-failed-to-fetch` | **Date**: 2025-09-18 | **Phase**: 1
**Prerequisites**: [research.md](./research.md) complete with all NEEDS CLARIFICATION resolved

## Entity Overview

This data model defines the core entities required for implementing reliable authentication flows with comprehensive error tracking and logging infrastructure. All entities follow the research decisions for 12-month authentication log retention and role-based access control.

## Core Entities

### 1. Authentication Request
**Purpose**: Captures authentication attempt data for login/signup processes with error context

**Fields**:
- `id` (UUID): Unique identifier for the authentication attempt
- `correlationId` (UUID): Request correlation ID for tracing across services
- `userId` (UUID, nullable): User ID if user exists (null for signup)
- `email` (String): User email address (sanitized)
- `method` (Enum): Authentication method - 'password', 'oauth_google'
- `operation` (Enum): Type of operation - 'login', 'signup', 'password_reset'
- `ipAddress` (String): Client IP address (masked for privacy)
- `userAgent` (String): Client user agent (truncated)
- `sessionId` (UUID, nullable): Session identifier if applicable
- `timestamp` (DateTime): Request timestamp in UTC
- `duration` (Integer): Request processing time in milliseconds
- `success` (Boolean): Whether authentication succeeded
- `errorCode` (String, nullable): Standardized error code if failed
- `errorMessage` (String, nullable): Human-readable error message
- `context` (JSONB): Additional context data (browser, device, etc.)

**Validation Rules**:
- Email must be valid format and sanitized
- IP address must be masked (e.g., 192.168.1.xxx)
- Duration must be positive integer
- Error code required if success is false
- Context data must not contain sensitive information

**State Transitions**:
- Created → Processing → Success/Failure → Logged
- Failed attempts may trigger rate limiting after 5 consecutive failures
- Successful attempts create or update user session

**Relationships**:
- Belongs to User (if userId not null)
- Related to Error Log Entry (if authentication fails)
- Related to Authentication Log Entry (for audit trail)

### 2. Error Log Entry
**Purpose**: Records application errors with sufficient detail for troubleshooting and system monitoring

**Fields**:
- `id` (UUID): Unique identifier for the error entry
- `correlationId` (UUID): Request correlation ID for cross-service tracing
- `timestamp` (DateTime): Error occurrence timestamp in UTC
- `level` (Enum): Error severity - 'debug', 'info', 'warn', 'error', 'fatal'
- `message` (String): Primary error message
- `errorType` (String): Error class/type (e.g., 'ValidationError', 'NetworkError')
- `errorCode` (String): Standardized application error code
- `stackTrace` (Text, nullable): Error stack trace (sanitized)
- `userId` (UUID, nullable): Associated user if applicable
- `sessionId` (UUID, nullable): Session context if applicable
- `route` (String): API route or page where error occurred
- `method` (String): HTTP method (GET, POST, etc.)
- `source` (Enum): Error source - 'frontend', 'backend', 'database', 'external'
- `context` (JSONB): Additional error context and metadata
- `resolved` (Boolean): Whether error has been investigated/resolved
- `resolvedAt` (DateTime, nullable): Resolution timestamp
- `resolvedBy` (UUID, nullable): User who marked as resolved

**Validation Rules**:
- Severity level must be valid enum value
- Stack trace must be sanitized to remove secrets
- Context must not contain passwords, tokens, or PII
- Route must match valid application routes
- Resolution fields required if resolved is true

**State Transitions**:
- New → Under Investigation → Resolved
- Critical errors automatically escalate to monitoring alerts
- Recurring errors trigger pattern analysis

**Relationships**:
- May relate to User (if userId present)
- May relate to Authentication Request (for auth errors)
- Belongs to Log Access Session (when accessed)

### 3. Authentication Log Entry
**Purpose**: Audit trail of authentication events for security monitoring and compliance

**Fields**:
- `id` (UUID): Unique identifier for the log entry
- `userId` (UUID): User identifier for the authentication event
- `correlationId` (UUID): Request correlation ID
- `timestamp` (DateTime): Event timestamp in UTC
- `event` (Enum): Event type - 'login_attempt', 'login_success', 'login_failure', 'logout', 'password_change', 'account_lockout'
- `method` (Enum): Authentication method - 'password', 'oauth_google', 'magic_link'
- `ipAddress` (String): Client IP address (masked)
- `userAgent` (String): Client user agent (truncated)
- `location` (String, nullable): Approximate geographic location
- `deviceFingerprint` (String, nullable): Device identification hash
- `sessionId` (UUID, nullable): Session identifier
- `duration` (Integer, nullable): Operation duration in milliseconds
- `failureReason` (String, nullable): Reason for failure if applicable
- `riskScore` (Integer): Risk assessment score (0-100)
- `metadata` (JSONB): Additional event metadata

**Validation Rules**:
- User ID must exist in profiles table
- Event type must be valid enum value
- IP address must be masked for privacy
- Risk score must be between 0-100
- Metadata must not contain sensitive authentication data

**State Transitions**:
- Created → Processed → Archived (after retention period)
- High-risk events trigger additional security checks
- Failed attempts accumulate for rate limiting

**Relationships**:
- Belongs to User (profiles table)
- Related to Authentication Request
- May trigger Security Alert (if high risk score)

### 4. Log Access Session
**Purpose**: Audit trail for accessing application logs through the secure endpoint

**Fields**:
- `id` (UUID): Unique identifier for the access session
- `userId` (UUID): User who accessed the logs
- `apiKeyId` (UUID, nullable): API key used if API access
- `timestamp` (DateTime): Access timestamp in UTC
- `accessType` (Enum): Access method - 'session', 'api_key', 'token'
- `logType` (Enum): Type of logs accessed - 'error', 'authentication', 'access', 'performance'
- `filters` (JSONB): Applied filters and search criteria
- `recordCount` (Integer): Number of log records accessed
- `ipAddress` (String): Access IP address
- `userAgent` (String): Client user agent
- `duration` (Integer): Session duration in milliseconds
- `exported` (Boolean): Whether data was exported
- `exportFormat` (String, nullable): Export format if applicable

**Validation Rules**:
- User ID must exist and have appropriate role
- Access type must match authentication method used
- Filter criteria must be valid JSON
- Record count must be non-negative
- Export format required if exported is true

**State Transitions**:
- Started → Active → Completed
- Extended sessions require re-authentication
- Suspicious access patterns trigger security alerts

**Relationships**:
- Belongs to User (profiles table)
- May relate to API Key (if API access)
- References accessed Error Log Entries and Authentication Log Entries

## Data Relationships

### User Profile Extensions
**Additional Fields Required**:
- `role` (Enum): User role - 'user', 'developer', 'admin', 'superadmin'
- `lastLoginAt` (DateTime, nullable): Last successful login timestamp
- `failedLoginAttempts` (Integer): Count of consecutive failed logins
- `accountLockedAt` (DateTime, nullable): Account lockout timestamp
- `passwordChangedAt` (DateTime, nullable): Last password change timestamp

### API Keys Table (New)
**Purpose**: Manage API keys for external log access

**Fields**:
- `id` (UUID): Unique identifier
- `userId` (UUID): Owner of the API key
- `keyHash` (String): Hashed API key value
- `name` (String): Human-readable key name
- `permissions` (String[]): Array of granted permissions
- `role` (Enum): Effective role for this key
- `expiresAt` (DateTime, nullable): Expiration timestamp
- `lastUsedAt` (DateTime, nullable): Last usage timestamp
- `createdAt` (DateTime): Creation timestamp
- `revokedAt` (DateTime, nullable): Revocation timestamp

## Data Storage Strategy

### PostgreSQL Tables
- **Supabase PostgreSQL**: Primary storage for all entities
- **Row Level Security**: Implemented for all tables based on user roles
- **Indexes**: Optimized for timestamp queries and user lookups
- **Partitioning**: Time-based partitioning for log tables

### Data Retention Implementation
```sql
-- Automated retention policy enforcement
CREATE OR REPLACE FUNCTION cleanup_expired_logs()
RETURNS void AS $$
BEGIN
  -- Authentication logs: 12 months
  DELETE FROM authentication_log_entries
  WHERE timestamp < NOW() - INTERVAL '12 months';

  -- Error logs: 90 days (6 months for critical)
  DELETE FROM error_log_entries
  WHERE timestamp < NOW() - INTERVAL '90 days'
  AND level NOT IN ('error', 'fatal');

  DELETE FROM error_log_entries
  WHERE timestamp < NOW() - INTERVAL '6 months'
  AND level IN ('error', 'fatal');

  -- Access logs: 12 months
  DELETE FROM log_access_sessions
  WHERE timestamp < NOW() - INTERVAL '12 months';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_expired_logs();');
```

### Privacy and Security
- **Data Minimization**: Only essential fields stored
- **Encryption at Rest**: Supabase provides automatic encryption
- **Field Masking**: IP addresses and sensitive data automatically masked
- **Access Controls**: RLS policies enforce role-based access
- **Audit Trail**: All access to sensitive data logged

## Performance Considerations

### Indexing Strategy
```sql
-- Primary indexes for performance
CREATE INDEX idx_auth_requests_user_timestamp ON authentication_requests(userId, timestamp);
CREATE INDEX idx_error_logs_level_timestamp ON error_log_entries(level, timestamp);
CREATE INDEX idx_auth_logs_user_event ON authentication_log_entries(userId, event, timestamp);
CREATE INDEX idx_log_access_user_type ON log_access_sessions(userId, logType, timestamp);

-- Correlation ID index for tracing
CREATE INDEX idx_correlation_id ON authentication_requests(correlationId);
CREATE INDEX idx_error_correlation_id ON error_log_entries(correlationId);
```

### Query Optimization
- **Time-based queries**: Optimized with timestamp indexes
- **User-scoped queries**: Efficient user ID filtering
- **Correlation tracing**: Fast correlation ID lookups
- **Aggregation queries**: Pre-computed daily/weekly summaries

---
*Phase 1 Data Model Complete - Ready for API Contracts Generation*