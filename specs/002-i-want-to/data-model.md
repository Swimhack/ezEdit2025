# Data Model: Fluid Sign-In with Email Validation and Dashboard State

**Generated**: 2025-09-16
**Feature**: Email validation and dashboard state persistence

## Entities

### 1. User (Enhanced)
Extends existing user model with validation and state fields.

**Fields**:
- `id`: string (existing, UUID)
- `email`: string (existing, unique)
- `password`: string (existing, hashed)
- `email_verified`: boolean (new, default: false)
- `email_verified_at`: datetime | null (new)
- `verification_token_hash`: string | null (new, hashed token)
- `verification_token_expires`: datetime | null (new)
- `verification_attempts`: number (new, default: 0)
- `last_verification_sent`: datetime | null (new)
- `dashboard_state`: JSON | null (new, current state)
- `created_at`: datetime (existing)
- `updated_at`: datetime (existing)

**Validation Rules**:
- email must be valid email format
- verification_attempts max 3 per 24 hours
- dashboard_state max size 100KB

**State Transitions**:
- unverified → verified (on successful token validation)
- verified → verified (no reverse transition)

### 2. EmailValidationToken
Temporary tokens for email verification.

**Fields**:
- `token`: string (primary key, random 32 bytes)
- `token_hash`: string (indexed, SHA256 hash)
- `user_id`: string (foreign key to User)
- `email`: string (email at time of creation)
- `created_at`: datetime
- `expires_at`: datetime (created_at + 24 hours)
- `used_at`: datetime | null
- `ip_address`: string | null (for security logging)

**Validation Rules**:
- token must be unique
- expires_at must be future datetime at creation
- One active token per user at a time

**State Transitions**:
- pending → used (on successful validation)
- pending → expired (after expires_at)

### 3. DashboardState
Historical dashboard states for recovery and analytics.

**Fields**:
- `id`: string (UUID)
- `user_id`: string (foreign key to User)
- `state_data`: JSON (compressed state object)
- `version`: number (state schema version)
- `device_id`: string | null (optional device identifier)
- `created_at`: datetime
- `is_current`: boolean (only one true per user)

**Validation Rules**:
- state_data max size 100KB uncompressed
- version must be supported version number
- Only one is_current=true per user

**Retention**:
- Current state (is_current=true): Indefinite
- Historical states: 30 days
- Automatic cleanup job daily

### 4. DashboardStateSchema
Defines the structure of dashboard state.

**Current Schema (v1)**:
```json
{
  "version": 1,
  "layout": {
    "sidebarOpen": boolean,
    "activeTab": string,
    "expandedSections": string[]
  },
  "preferences": {
    "sortBy": string,
    "filterBy": string[],
    "itemsPerPage": number,
    "theme": string
  },
  "navigation": {
    "currentPath": string,
    "scrollPositions": {
      "[sectionId]": number
    },
    "recentWebsites": string[]
  },
  "customization": {
    "pinnedItems": string[],
    "hiddenSections": string[],
    "dashboardLayout": string
  },
  "metadata": {
    "lastUpdated": datetime,
    "deviceType": string,
    "browserInfo": string
  }
}
```

## Relationships

```
User (1) ←→ (0..n) EmailValidationToken
  - One user can have multiple tokens (expired/used)
  - Only one active (non-expired, unused) token at a time

User (1) ←→ (0..n) DashboardState
  - One user can have multiple historical states
  - Only one current state (is_current=true)

User (1) ←→ (1) Current Dashboard State (embedded)
  - dashboard_state field contains current state
  - Denormalized for performance
```

## Indexes

### Performance Indexes
- `users.email` (unique) - existing
- `users.email_verified` - for filtering unverified users
- `email_validation_tokens.token_hash` - for token lookup
- `email_validation_tokens.user_id` - for user's tokens
- `email_validation_tokens.expires_at` - for cleanup queries
- `dashboard_states.user_id, is_current` - for current state lookup
- `dashboard_states.created_at` - for cleanup queries

## Data Access Patterns

### Common Queries
1. **Check if email verified**:
   - `SELECT email_verified FROM users WHERE id = ?`

2. **Validate token**:
   - `SELECT * FROM email_validation_tokens WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL`

3. **Get current dashboard state**:
   - `SELECT dashboard_state FROM users WHERE id = ?`

4. **Save dashboard state**:
   - `UPDATE users SET dashboard_state = ?, updated_at = NOW() WHERE id = ?`
   - `INSERT INTO dashboard_states (user_id, state_data, is_current) VALUES (?, ?, true)`

5. **Cleanup expired tokens**:
   - `DELETE FROM email_validation_tokens WHERE expires_at < NOW() - INTERVAL '7 days'`

### Write Patterns
- Dashboard state: Debounced writes (max 1 per 500ms)
- Email tokens: Write on registration and resend
- Verification status: Write once on validation

### Read Patterns
- Dashboard state: Read on every dashboard load
- Email verification: Check on protected actions
- Token validation: Read once per validation attempt

## Migration Strategy

### From Current System
1. Add new fields to existing users file/table
2. Default all existing users to email_verified = true
3. Set dashboard_state to null (will populate on first save)
4. Create new storage for tokens and historical states

### Rollback Plan
1. New fields are optional, system works without them
2. Can disable email validation in config
3. Dashboard works without persisted state (fallback to defaults)

## Security Considerations

1. **Token Security**:
   - Never store raw tokens, only hashes
   - Use timing-safe comparison for token validation
   - Rate limit validation attempts

2. **State Security**:
   - Validate state size to prevent DoS
   - Sanitize state data before storage
   - User can only access their own state

3. **Privacy**:
   - Email tokens contain no sensitive data
   - Dashboard state encrypted at rest
   - PII handling complies with regulations

## Performance Considerations

1. **Caching Strategy**:
   - Cache dashboard state in memory for active sessions
   - Cache email verification status in JWT claims
   - Invalidate cache on state updates

2. **Batch Operations**:
   - Batch dashboard state writes
   - Bulk delete expired tokens daily
   - Compress historical states

3. **Scalability**:
   - Partition dashboard_states by user_id if needed
   - Archive old states to cold storage
   - Consider Redis for active session states

---
*Data model designed following Phase 0 research findings*