# Research Findings: System Authentication User Login Setup

**Date**: 2025-09-17
**Feature**: System Authentication User Login Setup
**Research Phase**: Phase 0

## Executive Summary

Research completed for implementing a comprehensive authentication system with OAuth, preference persistence, and audit logging. The solution will leverage existing Supabase authentication infrastructure while adding Google OAuth initially, implementing progressive rate limiting, and maintaining GDPR-compliant audit logs.

## Research Areas

### 1. OAuth Provider Selection

**Decision**: Implement Google OAuth initially, with GitHub as second priority

**Rationale**:
- Google has universal adoption and the simplest Supabase integration
- GitHub appeals to developer users who are likely FTP/file editor users
- Microsoft adds complexity but enables enterprise features later

**Alternatives Considered**:
- **Facebook OAuth**: Rejected - less relevant for professional file editing use cases
- **Twitter/X OAuth**: Rejected - recent API changes make it unreliable
- **Apple Sign In**: Deferred - required for iOS apps but not web-first priority

**Implementation Details**:
- Use Supabase's built-in OAuth providers for streamlined setup
- Store provider-specific user IDs for account linking
- Handle OAuth token refresh automatically via Supabase

### 2. Session Timeout Duration

**Decision**: 15-minute idle timeout, 8-hour absolute timeout, 30-day "remember me"

**Rationale**:
- 15 minutes balances security with file editing workflows that may have pauses
- 8 hours covers a typical work session without forcing re-authentication
- 30-day persistent sessions with device fingerprinting for trusted devices

**Alternatives Considered**:
- **5-minute idle timeout**: Rejected - too disruptive for file editing workflows
- **No absolute timeout**: Rejected - security risk for forgotten sessions
- **7-day remember me**: Rejected - too short for regular users

**Implementation Approach**:
- Server-side session validation with JWT tokens
- Client-side countdown timer with 2-minute warning
- Session ID rotation every 2 hours for active sessions
- Device fingerprinting using browser characteristics

### 3. GDPR Compliance for Audit Logs

**Decision**: 12-month retention for security logs, 6-month for access logs, immediate deletion with account

**Rationale**:
- 12 months provides adequate security monitoring window
- 6 months covers operational troubleshooting needs
- Immediate deletion respects user's right to be forgotten

**Alternatives Considered**:
- **Indefinite retention**: Rejected - violates GDPR data minimization
- **30-day retention**: Rejected - insufficient for security analysis
- **No logging**: Rejected - prevents troubleshooting and security monitoring

**Compliant Logging Strategy**:
```typescript
// Allowed to log
{
  event_type: "login_attempt",
  timestamp: "2025-09-17T10:30:00Z",
  user_id_hash: "sha256_hash", // Anonymized
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  success: true,
  method: "oauth_google"
}

// Never log
// - Passwords or password hashes
// - Full session tokens
// - Personal file content
// - Unencrypted email addresses in logs
```

### 4. Rate Limiting Strategy

**Decision**: Progressive delays with CAPTCHA and temporary lockout

**Rationale**:
- Progressive delays deter automated attacks without blocking legitimate users
- CAPTCHA adds human verification without permanent blocking
- Temporary lockout prevents persistent brute force attempts

**Alternatives Considered**:
- **IP-only blocking**: Rejected - affects shared networks unfairly
- **Permanent lockout**: Rejected - enables denial-of-service attacks
- **No rate limiting**: Rejected - security vulnerability

**Rate Limit Thresholds**:
| Endpoint | Limit | Window | Action |
|----------|-------|---------|---------|
| /api/auth/login | 5 attempts | 15 minutes | Progressive delay + CAPTCHA |
| /api/auth/register | 10 attempts | 1 hour | Block IP temporarily |
| /api/auth/reset-password | 3 attempts | 1 hour | Email notification |
| /api/auth/oauth/* | 20 attempts | 1 hour | Log and monitor |

**Progressive Delay Formula**:
- 1st failure: 1 second delay
- 2nd failure: 2 seconds
- 3rd failure: 4 seconds + CAPTCHA
- 4th failure: 8 seconds
- 5th failure: 16 seconds
- 10th failure: 1-hour account lockout

## Technical Implementation Decisions

### Authentication Flow Architecture

**Decision**: Use Supabase Auth with custom middleware for enhanced features

**Rationale**:
- Leverages existing Supabase infrastructure
- Allows custom logic for preferences and audit logging
- Maintains compatibility with current codebase

**Implementation Layers**:
1. **Supabase Auth Core**: Handles basic auth, password hashing, JWT tokens
2. **Custom Middleware**: Adds rate limiting, audit logging, preference loading
3. **Application Layer**: Manages UI state and user experience

### Preference Storage Strategy

**Decision**: PostgreSQL jsonb column for flexible preference schema

**Rationale**:
- JSONB allows schema evolution without migrations
- Efficient querying for specific preferences
- Type safety via TypeScript interfaces

**Schema Design**:
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common preference queries
CREATE INDEX idx_preferences_theme ON user_preferences
  ((preferences->>'theme'));
```

### Audit Logging Architecture

**Decision**: Database-backed with async write-through pattern

**Rationale**:
- Database provides reliable storage and querying
- Async writes prevent auth latency impact
- Enables complex troubleshooting queries

**Table Structure**:
```sql
CREATE TABLE auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning by month for efficient cleanup
CREATE INDEX idx_audit_created_at ON auth_audit_logs(created_at);
CREATE INDEX idx_audit_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_audit_event_type ON auth_audit_logs(event_type);
```

## Security Considerations

### Password Policy
- Minimum 8 characters
- At least one uppercase, lowercase, number
- Check against common password list
- Enforce on frontend and backend

### OAuth Security
- Validate OAuth state parameter
- Use PKCE for OAuth 2.0 flows
- Limit OAuth scope to minimum required
- Regular token rotation

### Session Security
- HTTP-only, secure, sameSite cookies
- CSRF token validation
- Session binding to IP/User-Agent (configurable)
- Automatic session cleanup job

## Performance Optimizations

### Caching Strategy
- Cache user preferences in Redis (5-minute TTL)
- Session validation cache (30-second TTL)
- Rate limit counters in Redis
- Database connection pooling

### Database Optimizations
- Prepared statements for auth queries
- Batch insert for audit logs
- Automatic old log cleanup via pg_cron
- Read replicas for audit log queries

## Integration Points

### Email Service
- Use Resend (existing) for password reset emails
- Template for account verification
- Security alert emails for suspicious activity

### Monitoring
- Integrate with existing Pino logger
- Metrics for auth success/failure rates
- Alerts for unusual patterns
- Dashboard for support team

## Migration Strategy

### From Current System
1. Map existing Supabase users to new preference table
2. Implement audit logging without breaking changes
3. Add OAuth as additional option (not replacement)
4. Gradual rollout with feature flags

### Data Migration
```sql
-- Create preferences for existing users
INSERT INTO user_preferences (user_id, preferences)
SELECT id, '{"theme": "light", "language": "en"}'::jsonb
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_id = auth.users.id
);
```

## Risk Assessment

### Low Risk
- ✅ Building on proven Supabase Auth
- ✅ Standard OAuth implementation patterns
- ✅ Well-understood rate limiting techniques

### Medium Risk
- ⚠️ GDPR compliance requires ongoing attention
- ⚠️ Session management complexity with multiple devices
- ⚠️ OAuth provider API changes

### Mitigation Strategies
- Regular security audits
- Automated GDPR compliance checks
- Fallback authentication methods
- Comprehensive error handling

## Dependencies and Versions

### Required Packages
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/auth-helpers-nextjs": "^0.8.0",
  "next-auth": "^4.24.0",
  "ioredis": "^5.3.0",
  "rate-limiter-flexible": "^3.0.0",
  "ua-parser-js": "^1.0.0",
  "bcryptjs": "^2.4.3"
}
```

### Development Dependencies
```json
{
  "@testing-library/react": "^14.0.0",
  "@playwright/test": "^1.40.0",
  "msw": "^2.0.0"
}
```

## Next Steps for Phase 1

1. Create detailed data models for preferences and audit tables
2. Design API contracts for all authentication endpoints
3. Generate OpenAPI specifications
4. Write contract tests for each endpoint
5. Create quickstart validation guide

---

**Research Complete**: All technical decisions resolved, ready for Phase 1 design