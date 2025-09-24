# Data Model: Enterprise Authentication System

**Date**: 2025-09-22
**Feature**: 016-ensure-a-robust
**Status**: Complete

## Core Entities

### User Account
**Purpose**: Represents an individual user in the system with authentication credentials and profile information.

**Attributes**:
- `id`: UUID - Primary key, auto-generated
- `email`: String - Unique email address (255 chars max)
- `password_hash`: String - Hashed password using bcrypt/scrypt
- `verification_status`: Enum - ['unverified', 'verified', 'pending']
- `created_at`: Timestamp - Account creation time
- `updated_at`: Timestamp - Last profile update
- `last_login_at`: Timestamp - Last successful login
- `login_attempts`: Integer - Failed login counter (reset on success)
- `account_locked_until`: Timestamp - Account lockout expiration (nullable)
- `mfa_enabled`: Boolean - Multi-factor authentication status
- `mfa_secret`: String - TOTP secret key (encrypted, nullable)

**Validation Rules**:
- Email must be valid format and unique across system
- Password must meet enterprise security requirements (8+ chars, mixed case, numbers, special chars)
- Verification status transitions: unverified → pending → verified
- Login attempts max: 5 before account lockout
- Account lockout duration: 15 minutes

**Relationships**:
- One-to-many with Authentication Sessions
- One-to-many with Security Event Logs
- One-to-many with Password Reset Tokens
- One-to-one with Email Verification (current)

### Authentication Session
**Purpose**: Represents an active user session with security tracking and expiration management.

**Attributes**:
- `id`: UUID - Primary key, auto-generated
- `user_id`: UUID - Foreign key to User Account
- `session_token`: String - JWT or session identifier (hashed)
- `device_info`: JSON - Browser, OS, device fingerprint
- `ip_address`: String - Client IP address
- `user_agent`: String - Full user agent string
- `created_at`: Timestamp - Session start time
- `expires_at`: Timestamp - Session expiration time
- `last_activity_at`: Timestamp - Last session activity
- `is_active`: Boolean - Session validity status
- `logout_reason`: Enum - ['user_logout', 'timeout', 'security_logout', 'admin_logout']

**Validation Rules**:
- Session token must be unique and cryptographically secure
- Expiration time default: 24 hours from creation
- IP address must be valid IPv4/IPv6 format
- Session automatically invalidated after 30 days of inactivity

**Relationships**:
- Many-to-one with User Account
- One-to-many with Security Event Logs

### Security Event Log
**Purpose**: Audit trail for all authentication-related security events and user actions.

**Attributes**:
- `id`: UUID - Primary key, auto-generated
- `user_id`: UUID - Foreign key to User Account (nullable for anonymous events)
- `session_id`: UUID - Foreign key to Authentication Session (nullable)
- `event_type`: Enum - ['login', 'logout', 'signup', 'password_reset', 'account_locked', 'mfa_enabled', 'failed_login']
- `event_outcome`: Enum - ['success', 'failure', 'blocked']
- `ip_address`: String - Source IP address
- `user_agent`: String - Client user agent
- `event_details`: JSON - Additional event-specific data
- `risk_score`: Integer - Event risk level (0-100)
- `timestamp`: Timestamp - Event occurrence time
- `correlation_id`: UUID - Request tracing identifier

**Validation Rules**:
- Event type must be from predefined security event catalog
- Risk score calculated based on IP reputation, device fingerprint, behavior patterns
- Event details must not contain sensitive information (passwords, tokens)
- Retention period: 90 days for compliance

**Relationships**:
- Many-to-one with User Account (nullable)
- Many-to-one with Authentication Session (nullable)

### Password Reset Token
**Purpose**: Temporary tokens for secure password recovery process with expiration and usage tracking.

**Attributes**:
- `id`: UUID - Primary key, auto-generated
- `user_id`: UUID - Foreign key to User Account
- `token_hash`: String - Hashed reset token for security
- `created_at`: Timestamp - Token generation time
- `expires_at`: Timestamp - Token expiration time
- `used_at`: Timestamp - Token usage time (nullable)
- `ip_address`: String - Requesting IP address
- `is_used`: Boolean - Token usage status
- `email_sent_at`: Timestamp - Email delivery confirmation

**Validation Rules**:
- Token expires 1 hour after creation
- Token can only be used once
- Maximum 3 reset requests per user per 24-hour period
- Token must be cryptographically secure (32+ random bytes)

**Relationships**:
- Many-to-one with User Account
- Related to Security Event Logs for audit trail

### Email Verification
**Purpose**: Email confirmation process for new accounts and email changes with secure token management.

**Attributes**:
- `id`: UUID - Primary key, auto-generated
- `user_id`: UUID - Foreign key to User Account
- `email`: String - Email address being verified
- `token_hash`: String - Hashed verification token
- `created_at`: Timestamp - Verification request time
- `expires_at`: Timestamp - Token expiration time
- `verified_at`: Timestamp - Verification completion time (nullable)
- `attempts`: Integer - Verification attempt counter
- `status`: Enum - ['pending', 'verified', 'expired', 'failed']

**Validation Rules**:
- Token expires 24 hours after creation
- Maximum 5 verification attempts per token
- Email must be valid format
- Token must be cryptographically secure

**Relationships**:
- Many-to-one with User Account
- Related to Security Event Logs for audit trail

## Data Relationships

### Primary Relationships
```
User Account (1) ←→ (many) Authentication Session
User Account (1) ←→ (many) Security Event Log
User Account (1) ←→ (many) Password Reset Token
User Account (1) ←→ (many) Email Verification
Authentication Session (1) ←→ (many) Security Event Log
```

### State Transitions

#### User Account Verification
```
unverified → pending (email sent) → verified (token confirmed)
verified → pending (email change) → verified (new email confirmed)
```

#### Authentication Session Lifecycle
```
created → active → [expired | user_logout | security_logout | admin_logout]
```

#### Password Reset Flow
```
requested → email_sent → used → expired
requested → email_sent → expired (unused)
```

## Database Constraints

### Unique Constraints
- User Account: email (unique across system)
- Authentication Session: session_token (unique active sessions)
- Password Reset Token: token_hash (unique active tokens)
- Email Verification: token_hash (unique active tokens)

### Foreign Key Constraints
- All user_id references cascade on delete
- Session cleanup on user deletion
- Token cleanup on user deletion

### Index Requirements
- User Account: email, verification_status, created_at
- Authentication Session: user_id, session_token, expires_at, is_active
- Security Event Log: user_id, event_type, timestamp, ip_address
- Password Reset Token: user_id, token_hash, expires_at, is_used
- Email Verification: user_id, token_hash, status, expires_at

## Security Considerations

### Data Protection
- Password hashes using bcrypt with salt rounds ≥12
- Session tokens and reset tokens stored as hashes only
- MFA secrets encrypted at rest
- PII encrypted in event logs

### Access Controls
- Row Level Security (RLS) policies for user data isolation
- Service role access limited to specific operations
- Audit logging for all data access

### Compliance Requirements
- GDPR: Right to deletion, data portability, consent tracking
- SOC 2: Audit trails, access controls, data protection
- Enterprise: Data retention policies, backup procedures

## Performance Considerations

### Query Optimization
- Indexes on frequently queried fields
- Partition security logs by date for large datasets
- Connection pooling for database efficiency

### Scalability
- Session storage can be moved to Redis for high concurrency
- Security logs can be archived to separate storage after 90 days
- User lookup optimized for email-based authentication

### Monitoring
- Track authentication success/failure rates
- Monitor unusual login patterns and IP addresses
- Alert on high-risk security events

## Data Migration Considerations

### Existing Data
- Preserve existing user accounts and sessions
- Migrate to new security log format
- Maintain backward compatibility during transition

### Rollback Plan
- Database migrations with rollback scripts
- Feature flags for gradual rollout
- Data backup before major schema changes