# Data Model: System Authentication User Login Setup

**Date**: 2025-09-17
**Feature**: System Authentication User Login Setup
**Phase**: Design Phase 1

## Core Entities

### 1. User Account (extends Supabase auth.users)
Extension of existing Supabase authentication user table with additional profile data.

**Purpose**: Core user identity and authentication credentials
**Lifecycle**: Created on registration, deleted on account termination

**Existing Supabase Fields**:
- `id`: UUID - Unique user identifier
- `email`: string - Primary email address
- `encrypted_password`: string - Bcrypt hashed password
- `email_confirmed_at`: timestamp - Email verification status
- `created_at`: timestamp - Account creation time
- `updated_at`: timestamp - Last modification time

**Extended Profile Fields** (in public.user_profiles):
- `user_id`: UUID - Foreign key to auth.users
- `display_name`: string - User's preferred display name
- `avatar_url`: string - Profile picture URL
- `phone_number`: string - Optional phone for 2FA
- `account_status`: enum - active, suspended, deleted
- `last_login_at`: timestamp - Most recent successful login
- `failed_login_count`: integer - Track failed attempts
- `locked_until`: timestamp - Account lockout expiration

**Validation Rules**:
- Email must be unique and valid format
- Password minimum 8 characters with complexity requirements
- Display name 3-50 characters, alphanumeric plus spaces
- Account can only transition: active → suspended → deleted

### 2. User Preferences
Flexible storage for user-specific application settings and personalization.

**Purpose**: Persist user preferences across sessions and devices
**Lifecycle**: Created on first preference save, maintained throughout account lifetime

**Attributes**:
- `user_id`: UUID - Primary key, foreign key to auth.users
- `preferences`: JSONB - Flexible preference storage
- `created_at`: timestamp - First preference saved
- `updated_at`: timestamp - Last modification time

**Preference Structure**:
```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string; // ISO 639-1 code
  timezone: string; // IANA timezone
  editorSettings: {
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    wordWrap: boolean;
    showLineNumbers: boolean;
  };
  workspaceLayout: {
    sidebarPosition: 'left' | 'right';
    sidebarWidth: number;
    panelLayout: string; // Serialized layout config
  };
  notifications: {
    email: boolean;
    browser: boolean;
    securityAlerts: boolean;
    marketingUpdates: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // minutes
    rememberDevice: boolean;
  };
}
```

**Validation Rules**:
- Preferences JSON must conform to schema
- Theme values restricted to enum
- Numeric values within reasonable ranges
- Timezone must be valid IANA identifier

### 3. OAuth Connections
Linked social login accounts and OAuth provider relationships.

**Purpose**: Manage external authentication provider connections
**Lifecycle**: Created when user links OAuth account, removed on disconnection

**Attributes**:
- `id`: UUID - Primary key
- `user_id`: UUID - Foreign key to auth.users
- `provider`: string - OAuth provider name (google, github, microsoft)
- `provider_user_id`: string - User ID from OAuth provider
- `provider_email`: string - Email from OAuth provider
- `access_token`: string (encrypted) - OAuth access token
- `refresh_token`: string (encrypted) - OAuth refresh token
- `token_expires_at`: timestamp - Access token expiration
- `scopes`: string[] - Granted OAuth scopes
- `raw_user_metadata`: JSONB - Provider-specific user data
- `connected_at`: timestamp - Connection establishment time
- `last_used_at`: timestamp - Most recent login via this provider

**Validation Rules**:
- One connection per provider per user
- Tokens must be encrypted at rest
- Provider must be from approved list
- Email conflicts handled by merge prompt

### 4. Authentication Sessions
Active user sessions across devices and browsers.

**Purpose**: Track and manage active authentication sessions
**Lifecycle**: Created on login, expired on logout or timeout

**Attributes**:
- `id`: UUID - Session identifier
- `user_id`: UUID - Foreign key to auth.users
- `session_token`: string - Unique session token (hashed)
- `device_fingerprint`: string - Browser/device identification
- `ip_address`: INET - IP address of session origin
- `user_agent`: string - Browser user agent string
- `location`: JSONB - Geolocation data if available
- `created_at`: timestamp - Session start time
- `last_activity_at`: timestamp - Most recent activity
- `expires_at`: timestamp - Session expiration time
- `is_remember_me`: boolean - Extended session flag
- `revoked_at`: timestamp - Manual revocation time

**Validation Rules**:
- Session token must be cryptographically secure
- Expiration based on activity and absolute limits
- IP address changes trigger security check
- Maximum sessions per user configurable

### 5. Authentication Events (Audit Log)
Comprehensive audit trail of all authentication-related activities.

**Purpose**: Security monitoring, troubleshooting, and compliance
**Lifecycle**: Created on every auth event, retained per policy, archived/deleted after retention period

**Attributes**:
- `id`: UUID - Event identifier
- `event_type`: string - Type of authentication event
- `user_id`: UUID - Foreign key to auth.users (nullable)
- `session_id`: UUID - Associated session (if applicable)
- `ip_address`: INET - Client IP address
- `user_agent`: string - Browser information
- `event_data`: JSONB - Event-specific details
- `success`: boolean - Whether event succeeded
- `failure_reason`: string - If failed, why
- `risk_score`: integer - Calculated risk level (0-100)
- `created_at`: timestamp - Event timestamp

**Event Types**:
- `login_attempt` - Login initiated
- `login_success` - Successful authentication
- `login_failure` - Failed authentication
- `logout` - User logged out
- `password_reset_request` - Reset initiated
- `password_reset_complete` - Password changed
- `oauth_connect` - OAuth provider linked
- `oauth_disconnect` - OAuth provider unlinked
- `session_expired` - Session timeout
- `account_locked` - Too many failures
- `account_unlocked` - Lock removed
- `preference_updated` - Settings changed
- `security_alert` - Suspicious activity detected

**Event Data Structure**:
```typescript
interface EventData {
  method?: 'password' | 'oauth' | 'magic_link';
  provider?: string; // OAuth provider
  device_info?: {
    platform: string;
    browser: string;
    version: string;
  };
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
  metadata?: Record<string, any>;
}
```

**Validation Rules**:
- All events must have type and timestamp
- User ID required except for pre-auth events
- IP address mandatory for security events
- Event data must be sanitized (no passwords)

### 6. Account Recovery
Password reset tokens and account recovery mechanisms.

**Purpose**: Secure account recovery and password reset workflows
**Lifecycle**: Created on recovery request, consumed on use or expired

**Attributes**:
- `id`: UUID - Recovery request identifier
- `user_id`: UUID - Foreign key to auth.users
- `token`: string - Secure recovery token (hashed)
- `type`: enum - password_reset, email_change, account_recovery
- `email`: string - Target email for recovery
- `used_at`: timestamp - When token was consumed
- `expires_at`: timestamp - Token expiration
- `ip_address`: INET - Request origin IP
- `created_at`: timestamp - Token generation time

**Validation Rules**:
- Tokens expire after 1 hour
- One active token per type per user
- Token can only be used once
- Rate limited per email address

## Entity Relationships

```
User Account (auth.users)
    ↓ 1:1
User Profile ←→ User Preferences
    ↓ 1:many        ↓ 1:many
OAuth Connections   Authentication Sessions
    ↓ logs               ↓ logs
Authentication Events ← Account Recovery
```

## Database Schema

### SQL Table Definitions

```sql
-- User Profile Extension
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50),
  avatar_url TEXT,
  phone_number VARCHAR(20),
  account_status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  failed_login_count INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Connections
CREATE TABLE public.oauth_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  raw_user_metadata JSONB,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_user_id)
);

-- Authentication Sessions
CREATE TABLE public.auth_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_fingerprint VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_remember_me BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ
);

-- Authentication Events (Audit Log)
CREATE TABLE public.auth_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES auth_sessions(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  risk_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for audit logs
CREATE TABLE auth_events_2025_09 PARTITION OF auth_events
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- Account Recovery
CREATE TABLE public.account_recovery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_status ON user_profiles(account_status);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX idx_auth_events_type ON auth_events(event_type);
CREATE INDEX idx_auth_events_created ON auth_events(created_at);
CREATE INDEX idx_recovery_email ON account_recovery(email);
CREATE INDEX idx_recovery_expires ON account_recovery(expires_at);
```

## Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own OAuth connections"
  ON oauth_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON auth_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all events"
  ON auth_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND account_status = 'admin'
    )
  );
```

## Data Retention Policies

| Entity | Retention Period | Deletion Method |
|--------|-----------------|-----------------|
| User Account | Until deletion request | Soft delete, then hard delete after 30 days |
| User Preferences | With account | Cascade delete with user |
| OAuth Connections | With account | Cascade delete with user |
| Active Sessions | Until expiration | Automatic cleanup job |
| Auth Events | 12 months | Partition drop monthly |
| Account Recovery | 7 days after expiration | Scheduled cleanup job |

## Performance Considerations

### Expected Scale
- 10,000 active users
- 100,000 authentication events per day
- 50,000 active sessions
- 1,000 concurrent login attempts

### Optimization Strategies
- Partition auth_events table by month
- Index frequently queried fields
- Cache user preferences in Redis
- Async write for audit logs
- Connection pooling for database

---

**Data Model Complete**: Ready for API contract generation