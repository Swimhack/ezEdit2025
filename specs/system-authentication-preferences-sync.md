# System-Wide Authentication with User Preferences & Cross-Device Synchronization

**Version:** 1.0
**Created:** September 17, 2025
**Status:** Specification
**Project:** EzEdit.co - AI-Powered Website & Membership Platform

## Executive Summary

This specification defines a comprehensive system-wide authentication framework with user-based preferences, settings persistence, and real-time cross-device synchronization for the EzEdit platform. The system builds upon the existing Supabase authentication infrastructure to provide a seamless, secure, and personalized user experience across all devices and sessions.

## 1. System-Wide Authentication Framework

### 1.1 OAuth 2.0 / OpenID Connect Integration

#### 1.1.1 Supported Providers
- **Google OAuth 2.0** - Primary social login provider
- **GitHub OAuth** - Developer-focused authentication
- **Microsoft OAuth** - Enterprise compatibility
- **Apple Sign-In** - iOS/macOS ecosystem support
- **Discord OAuth** - Community-focused authentication

#### 1.1.2 OAuth Implementation Requirements
- **PKCE (Proof Key for Code Exchange)** - Enhanced security for all OAuth flows
- **State Parameter Validation** - CSRF protection for OAuth callbacks
- **Scope Management** - Minimal necessary permissions with progressive consent
- **Token Refresh** - Automatic refresh token handling with secure storage
- **Provider Linking** - Allow users to link multiple OAuth providers to single account

#### 1.1.3 OAuth Security Standards
- **OpenID Connect Discovery** - Automatic provider configuration discovery
- **JWT Signature Validation** - Verify all OAuth tokens cryptographically
- **Audience Validation** - Ensure tokens are intended for our application
- **Issuer Validation** - Verify tokens originate from trusted providers
- **Nonce Validation** - Prevent replay attacks

### 1.2 Multi-Factor Authentication (MFA)

#### 1.2.1 MFA Methods
- **TOTP (Time-based One-Time Password)** - Google Authenticator, Authy compatibility
- **SMS Authentication** - Phone number verification via Twilio
- **Email Authentication** - Email-based verification codes
- **WebAuthn/FIDO2** - Hardware security keys and biometric authentication
- **Backup Codes** - Single-use recovery codes (10 codes per user)

#### 1.2.2 MFA Configuration
- **Progressive MFA** - Optional for low-risk operations, required for sensitive actions
- **Device Trust** - Remember trusted devices for 30 days
- **Risk-Based Authentication** - Trigger MFA based on login patterns, location, device
- **MFA Recovery** - Account recovery through verified email and backup codes
- **Admin Override** - Support team can disable MFA for account recovery

#### 1.2.3 MFA Security Requirements
- **FIDO2 Compliance** - Full WebAuthn specification support
- **Rate Limiting** - Protect against brute force attacks on MFA codes
- **Time Window Validation** - 30-second window for TOTP codes
- **Secure Code Generation** - Cryptographically secure random backup codes
- **Audit Logging** - Complete audit trail for all MFA events

### 1.3 Session Management Across Devices

#### 1.3.1 Session Architecture
- **JWT-Based Sessions** - Stateless authentication with secure JWT tokens
- **Refresh Token Rotation** - Automatic rotation of refresh tokens for enhanced security
- **Device Fingerprinting** - Track device characteristics for security monitoring
- **Session Isolation** - Independent sessions per device/browser
- **Concurrent Session Limits** - Configurable limits per subscription tier

#### 1.3.2 Session Security
- **Token Encryption** - All tokens encrypted at rest and in transit
- **Secure Cookie Configuration** - HttpOnly, Secure, SameSite attributes
- **Session Timeout** - Configurable inactivity timeouts (default: 24 hours)
- **Remote Session Termination** - Users can revoke sessions from any device
- **Suspicious Activity Detection** - Automatic session termination for anomalous behavior

#### 1.3.3 Cross-Device Session Synchronization
- **Real-Time Session Events** - Live session status updates via WebSockets
- **Session Handoff** - Seamless transition between devices
- **Active Session Display** - Users can view all active sessions with device info
- **Bulk Session Management** - Terminate all sessions except current device
- **Session Conflict Resolution** - Handle concurrent logins gracefully

### 1.4 Single Sign-On (SSO) Capabilities

#### 1.4.1 Enterprise SSO Support
- **SAML 2.0** - Enterprise identity provider integration
- **Active Directory Integration** - Corporate directory authentication
- **Okta Integration** - Identity-as-a-Service platform support
- **Azure AD Integration** - Microsoft enterprise authentication
- **Custom OIDC Providers** - Generic OpenID Connect provider support

#### 1.4.2 SSO Configuration
- **Domain-Based Routing** - Automatic SSO detection by email domain
- **Just-In-Time Provisioning** - Automatic user creation from SSO claims
- **Attribute Mapping** - Map SSO claims to user profile attributes
- **Role-Based Provisioning** - Automatic role assignment from SSO groups
- **SSO Bypass** - Emergency local authentication for SSO failures

#### 1.4.3 SSO Security & Compliance
- **Metadata Validation** - Verify SSO provider metadata integrity
- **Certificate Management** - Automatic certificate rotation and validation
- **Audit Compliance** - SOC 2, GDPR compliant audit logging
- **Federated Logout** - Coordinate logout across federated systems
- **Security Assertion Validation** - Complete SAML assertion verification

## 2. User Preferences & Settings

### 2.1 UI/UX Preferences

#### 2.1.1 Theme Management
- **Dark/Light Mode** - System-aware automatic theme switching
- **Custom Themes** - User-defined color schemes and branding
- **High Contrast Mode** - Accessibility-focused theme variants
- **Theme Scheduling** - Automatic theme switching based on time of day
- **Per-Application Themes** - Different themes for different EzEdit modules

#### 2.1.2 Layout Preferences
- **Dashboard Layout** - Customizable widget arrangements and sizing
- **Editor Layout** - Panel arrangements, toolbar customization
- **Navigation Preferences** - Sidebar collapsed/expanded, menu organization
- **Content Density** - Compact, comfortable, or spacious viewing modes
- **Window Behavior** - Tab management, modal preferences

#### 2.1.3 Editor Settings
- **Code Editor Preferences** - Font family, size, line height, tab size
- **Syntax Highlighting** - Language-specific color schemes
- **Code Formatting** - Auto-formatting rules and preferences
- **Keybinding Customization** - Custom keyboard shortcuts and mappings
- **Extension Configuration** - User-installed editor extensions and settings

### 2.2 FTP Connection Profiles and Credentials

#### 2.2.1 Connection Profile Management
- **Profile CRUD Operations** - Create, read, update, delete FTP profiles
- **Connection Templates** - Predefined templates for common hosting providers
- **Profile Categories** - Organize profiles by project, client, or environment
- **Quick Connect** - Recent connections and favorites for rapid access
- **Profile Sharing** - Team-based profile sharing with permission controls

#### 2.2.2 Credential Security
- **End-to-End Encryption** - Client-side encryption before database storage
- **Hardware Security Module (HSM)** - Enterprise-grade key management
- **Key Derivation** - User-specific encryption keys derived from authentication
- **Zero-Knowledge Architecture** - Server cannot decrypt user credentials
- **Credential Rotation** - Automated password rotation where supported

#### 2.2.3 Connection Features
- **Connection Pooling** - Efficient connection reuse and management
- **Auto-Reconnection** - Automatic reconnection with exponential backoff
- **Connection Health Monitoring** - Real-time connection status tracking
- **Batch Operations** - Efficient bulk file operations
- **Transfer Resume** - Resume interrupted file transfers

### 2.3 Application Behavior Settings

#### 2.3.1 Workflow Preferences
- **Auto-Save Configuration** - Customizable auto-save intervals and triggers
- **Default File Associations** - Preferred editors for different file types
- **Project Templates** - User-defined project scaffolding templates
- **Backup Preferences** - Local and cloud backup configuration
- **Version Control Integration** - Git workflow preferences and hooks

#### 2.3.2 Performance Settings
- **Cache Management** - Browser cache, file cache configuration
- **Resource Limits** - Memory usage, concurrent operations limits
- **Sync Frequency** - How often to sync settings and data
- **Bandwidth Management** - Upload/download speed limits
- **Background Processing** - CPU priority for background tasks

#### 2.3.3 Privacy Controls
- **Analytics Opt-out** - User control over usage analytics collection
- **Error Reporting** - Opt-in crash reporting and diagnostics
- **Activity Logging** - User control over detailed activity logs
- **Data Retention** - User-defined data retention policies
- **Export Controls** - Data portability and export preferences

### 2.4 Notification Preferences

#### 2.4.1 Notification Channels
- **In-App Notifications** - Real-time notifications within the application
- **Email Notifications** - Configurable email notification types and frequency
- **Browser Push Notifications** - Web push notifications for important events
- **SMS Notifications** - Critical alerts via SMS (premium feature)
- **Webhook Integration** - Custom webhook endpoints for automation

#### 2.4.2 Notification Types
- **System Notifications** - Security alerts, maintenance, system updates
- **Project Notifications** - Build status, deployment updates, collaboration
- **Billing Notifications** - Payment reminders, billing updates, usage alerts
- **Social Notifications** - Team invitations, comments, mentions
- **Custom Notifications** - User-defined notification rules and triggers

#### 2.4.3 Notification Controls
- **Granular Control** - Per-notification type enable/disable controls
- **Scheduling** - Do-not-disturb hours and notification scheduling
- **Priority Levels** - High, medium, low priority notification handling
- **Aggregation Rules** - Bundle similar notifications to reduce noise
- **Device-Specific Settings** - Different notification preferences per device

## 3. Cross-Device Synchronization

### 3.1 Real-Time Settings Sync

#### 3.1.1 Synchronization Architecture
- **Event-Driven Sync** - Real-time synchronization using WebSocket connections
- **Conflict-Free Replicated Data Types (CRDTs)** - Mathematical conflict resolution
- **Operational Transformation** - Real-time collaborative editing support
- **Vector Clocks** - Distributed timestamp system for event ordering
- **Merkle Trees** - Efficient change detection and synchronization

#### 3.1.2 Sync Performance
- **Delta Synchronization** - Only sync changed data, not entire preference sets
- **Compression** - Gzip compression for all sync operations
- **Batch Operations** - Bundle multiple preference changes into single sync
- **Lazy Loading** - Load preferences on-demand to reduce initial sync time
- **Background Sync** - Continue syncing while app is backgrounded

#### 3.1.3 Sync Reliability
- **Retry Logic** - Exponential backoff with jitter for failed sync attempts
- **Offline Queue** - Queue changes when offline, sync when reconnected
- **Sync Verification** - Cryptographic verification of sync integrity
- **Rollback Capability** - Ability to rollback to previous preference state
- **Sync Monitoring** - Real-time sync status and health monitoring

### 3.2 Conflict Resolution for Concurrent Edits

#### 3.2.1 Conflict Detection
- **Timestamp Comparison** - Detect conflicting changes using precise timestamps
- **Checksum Validation** - Detect data corruption during synchronization
- **Version Vectors** - Track causality relationships between changes
- **Semantic Conflict Detection** - Detect conflicts based on setting semantics
- **User Intent Analysis** - Resolve conflicts based on user behavior patterns

#### 3.2.2 Resolution Strategies
- **Last-Write-Wins** - Default strategy for most preference types
- **Merge Strategies** - Intelligent merging for compatible changes
- **User-Prompted Resolution** - Ask user to resolve complex conflicts
- **Preference Hierarchy** - Priority-based conflict resolution
- **Rollback to Safe State** - Revert to last known good state if conflicts unresolvable

#### 3.2.3 Conflict Prevention
- **Optimistic Locking** - Prevent conflicts through version checking
- **Advisory Locking** - Warn users when another device is making changes
- **Change Coordination** - Coordinate simultaneous changes across devices
- **Conflict Prediction** - Predict and prevent likely conflicts
- **User Education** - Guide users to avoid conflict-prone scenarios

### 3.3 Offline Capability with Sync on Reconnect

#### 3.3.1 Offline Storage
- **Local Preference Cache** - Complete preference set cached locally
- **IndexedDB Storage** - Browser-based structured data storage
- **Service Worker Caching** - Offline application functionality
- **Change Journaling** - Log all offline changes for later synchronization
- **Storage Quotas** - Manage local storage limits intelligently

#### 3.3.2 Offline Operations
- **Read Operations** - Full preference access while offline
- **Write Operations** - Local preference changes with sync queue
- **Conflict Detection** - Detect potential conflicts before going online
- **Data Validation** - Validate changes before queuing for sync
- **Storage Cleanup** - Automatic cleanup of old cached data

#### 3.3.3 Reconnection Handling
- **Connection Detection** - Automatic detection of network connectivity
- **Sync Resumption** - Resume interrupted synchronization operations
- **Priority Sync** - Sync critical preferences first upon reconnection
- **Bandwidth Adaptation** - Adjust sync behavior based on connection quality
- **User Notification** - Inform users of sync status and any conflicts

### 3.4 Device-Specific Overrides

#### 3.4.1 Override Architecture
- **Device Profiles** - Per-device preference overrides and configurations
- **Capability Detection** - Automatic detection of device capabilities
- **Context-Aware Settings** - Adjust preferences based on device context
- **Inheritance Hierarchy** - Global → Device → Application preference inheritance
- **Override Validation** - Ensure overrides are compatible with device capabilities

#### 3.4.2 Device Categories
- **Desktop Overrides** - High-performance settings for desktop environments
- **Mobile Overrides** - Touch-optimized settings for mobile devices
- **Tablet Overrides** - Hybrid settings for tablet form factors
- **TV/Large Screen** - Optimized settings for large display devices
- **Low-Power Devices** - Reduced feature sets for constrained devices

#### 3.4.3 Override Management
- **Easy Toggle** - Simple enable/disable for device-specific overrides
- **Bulk Operations** - Apply overrides to multiple preferences simultaneously
- **Override Templates** - Predefined override templates for device types
- **Override Sharing** - Share successful override configurations with team
- **Override Analytics** - Track effectiveness of different override strategies

## 4. Data Persistence & Security

### 4.1 Encrypted Storage of Sensitive Data

#### 4.1.1 Encryption Standards
- **AES-256-GCM** - Advanced Encryption Standard with Galois/Counter Mode
- **PBKDF2** - Password-Based Key Derivation Function with 100,000 iterations
- **Scrypt** - Memory-hard key derivation for enhanced security
- **ChaCha20-Poly1305** - Alternative cipher for performance-critical operations
- **RSA-4096** - Asymmetric encryption for key exchange and digital signatures

#### 4.1.2 Key Management
- **Hardware Security Module (HSM)** - Enterprise-grade key management
- **Key Rotation** - Automatic encryption key rotation every 90 days
- **Key Escrow** - Secure key backup for account recovery scenarios
- **Per-User Keys** - Individual encryption keys derived from user credentials
- **Multi-Factor Key Derivation** - Require MFA for key derivation operations

#### 4.1.3 Encryption Implementation
- **Client-Side Encryption** - Encrypt sensitive data before transmission
- **Field-Level Encryption** - Granular encryption of specific database fields
- **Transparent Data Encryption** - Database-level encryption at rest
- **Encryption in Transit** - TLS 1.3 for all data transmission
- **Zero-Knowledge Architecture** - Server cannot decrypt user's sensitive data

### 4.2 User Data Isolation and Privacy

#### 4.2.1 Data Isolation Architecture
- **Row-Level Security (RLS)** - Database-enforced data access controls
- **Multi-Tenant Architecture** - Logical separation of user data
- **Namespace Isolation** - Prevent data leakage between users
- **API Gateway Controls** - Request-level authorization and validation
- **Database Views** - Filtered data access through secure database views

#### 4.2.2 Privacy Controls
- **Data Minimization** - Collect only necessary user data
- **Purpose Limitation** - Use data only for declared purposes
- **Consent Management** - Granular user consent for data processing
- **Right to Deletion** - Complete data removal upon user request
- **Data Portability** - Export user data in standard formats

#### 4.2.3 Access Controls
- **Role-Based Access Control (RBAC)** - Fine-grained permission system
- **Attribute-Based Access Control (ABAC)** - Dynamic permissions based on context
- **Principle of Least Privilege** - Minimal necessary access rights
- **Access Auditing** - Complete audit trail of all data access
- **Emergency Access** - Secure break-glass procedures for support

### 4.3 GDPR Compliance for Data Handling

#### 4.3.1 Legal Basis and Consent
- **Explicit Consent** - Clear, unambiguous consent for data processing
- **Legitimate Interest** - Document legitimate business interests
- **Consent Withdrawal** - Easy consent withdrawal with immediate effect
- **Consent Records** - Maintain detailed records of all consent interactions
- **Age Verification** - Enhanced protections for users under 16

#### 4.3.2 Data Subject Rights
- **Right to Access** - Users can access all their personal data
- **Right to Rectification** - Users can correct inaccurate data
- **Right to Erasure** - Complete data deletion ("right to be forgotten")
- **Right to Portability** - Export data in machine-readable format
- **Right to Object** - Users can object to certain data processing

#### 4.3.3 GDPR Technical Measures
- **Privacy by Design** - Privacy considerations in all system design
- **Data Protection Impact Assessment (DPIA)** - Systematic privacy risk assessment
- **Breach Notification** - Automatic breach detection and notification system
- **Data Processing Records** - Detailed records of all processing activities
- **International Transfers** - GDPR-compliant mechanisms for data transfers

### 4.4 Backup and Recovery Mechanisms

#### 4.4.1 Backup Strategy
- **Automated Daily Backups** - Full system backups with point-in-time recovery
- **Incremental Backups** - Hourly incremental backups for rapid recovery
- **Cross-Region Replication** - Geographically distributed backup storage
- **Versioned Backups** - Maintain multiple backup versions with retention policies
- **Encrypted Backups** - All backups encrypted with separate key management

#### 4.4.2 Recovery Procedures
- **Recovery Time Objective (RTO)** - Target recovery time of 1 hour for critical data
- **Recovery Point Objective (RPO)** - Maximum data loss of 15 minutes
- **Automated Recovery** - Automated failover to backup systems
- **Granular Recovery** - Recover individual user accounts or specific data
- **Recovery Testing** - Regular testing of backup and recovery procedures

#### 4.4.3 Disaster Recovery
- **Multi-Region Architecture** - Active-passive disaster recovery setup
- **Failover Automation** - Automatic failover with health monitoring
- **Communication Plan** - Automated user communication during outages
- **Business Continuity** - Maintain core services during disaster scenarios
- **Recovery Validation** - Verify data integrity after recovery operations

## 5. Implementation Details

### 5.1 Database Schema for User Profiles and Preferences

#### 5.1.1 Enhanced User Profiles Table
```sql
-- Extend existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ui_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_preferences_sync TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences_version INTEGER DEFAULT 1;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferences_sync ON profiles USING BTREE (last_preferences_sync);
CREATE INDEX IF NOT EXISTS idx_profiles_preferences_version ON profiles USING BTREE (preferences_version);
CREATE INDEX IF NOT EXISTS idx_profiles_preferences_gin ON profiles USING GIN (preferences);
```

#### 5.1.2 User Sessions Table
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- desktop, mobile, tablet
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    UNIQUE(user_id, device_id)
);

-- Indexes and policies
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON user_sessions (last_activity);
```

#### 5.1.3 User Preferences History Table
```sql
CREATE TABLE IF NOT EXISTS user_preferences_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    preference_path VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_source VARCHAR(50) NOT NULL, -- web, mobile, api, sync
    device_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_prefs_history_user_time ON user_preferences_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prefs_history_path ON user_preferences_history (preference_path);
```

#### 5.1.4 OAuth Connections Table
```sql
CREATE TABLE IF NOT EXISTS oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- google, github, microsoft, etc.
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    access_token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    scopes TEXT[],
    token_expires_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(provider, provider_user_id),
    UNIQUE(user_id, provider) WHERE is_primary = true
);
```

#### 5.1.5 MFA Configuration Table
```sql
CREATE TABLE IF NOT EXISTS mfa_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- totp, sms, email, webauthn
    identifier VARCHAR(255), -- phone, email, or key identifier
    secret_encrypted TEXT,
    backup_codes_encrypted TEXT[],
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, type, identifier)
);
```

### 5.2 API Endpoints for Settings Management

#### 5.2.1 User Preferences API
```typescript
// GET /api/user/preferences - Get all user preferences
// GET /api/user/preferences/:category - Get specific preference category
// PUT /api/user/preferences - Update multiple preferences
// PATCH /api/user/preferences/:path - Update specific preference
// DELETE /api/user/preferences/:path - Delete specific preference

interface PreferencesAPI {
  // Core preferences operations
  getPreferences(category?: string): Promise<UserPreferences>;
  updatePreferences(preferences: Partial<UserPreferences>): Promise<void>;
  updatePreference(path: string, value: any): Promise<void>;
  deletePreference(path: string): Promise<void>;

  // Sync operations
  syncPreferences(deviceId: string, lastSync?: Date): Promise<SyncResult>;
  getPreferencesHistory(limit?: number): Promise<PreferenceChange[]>;
  resetPreferences(category?: string): Promise<void>;
}
```

#### 5.2.2 Session Management API
```typescript
// GET /api/user/sessions - Get all active sessions
// DELETE /api/user/sessions/:sessionId - Terminate specific session
// DELETE /api/user/sessions - Terminate all sessions except current
// POST /api/user/sessions/refresh - Refresh current session

interface SessionAPI {
  getSessions(): Promise<UserSession[]>;
  terminateSession(sessionId: string): Promise<void>;
  terminateAllSessions(exceptCurrent?: boolean): Promise<void>;
  refreshSession(): Promise<SessionTokens>;
  updateSessionActivity(): Promise<void>;
}
```

#### 5.2.3 OAuth Management API
```typescript
// GET /api/auth/oauth/connections - Get linked OAuth accounts
// POST /api/auth/oauth/:provider/link - Link new OAuth account
// DELETE /api/auth/oauth/:provider/unlink - Unlink OAuth account
// PUT /api/auth/oauth/:provider/primary - Set as primary login method

interface OAuthAPI {
  getConnections(): Promise<OAuthConnection[]>;
  linkProvider(provider: string, authCode: string): Promise<void>;
  unlinkProvider(provider: string): Promise<void>;
  setPrimaryProvider(provider: string): Promise<void>;
  refreshProviderToken(provider: string): Promise<void>;
}
```

#### 5.2.4 MFA Management API
```typescript
// GET /api/auth/mfa/methods - Get configured MFA methods
// POST /api/auth/mfa/totp/setup - Setup TOTP authentication
// POST /api/auth/mfa/sms/setup - Setup SMS authentication
// DELETE /api/auth/mfa/:type - Remove MFA method
// POST /api/auth/mfa/verify - Verify MFA code

interface MFAAPI {
  getMethods(): Promise<MFAMethod[]>;
  setupTOTP(): Promise<TOTPSetup>;
  setupSMS(phoneNumber: string): Promise<void>;
  setupWebAuthn(): Promise<WebAuthnChallenge>;
  removeMFA(type: string): Promise<void>;
  verifyMFA(type: string, code: string): Promise<boolean>;
  generateBackupCodes(): Promise<string[]>;
}
```

### 5.3 Frontend State Management for Preferences

#### 5.3.1 React Context for Preferences
```typescript
// Preferences Context Provider
interface PreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreference: (path: string, value: any) => Promise<void>;
  resetPreferences: (category?: string) => Promise<void>;
  syncStatus: SyncStatus;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // WebSocket connection for real-time sync
  const { socket } = useWebSocket('/api/preferences/sync');

  // Auto-save with debouncing
  const debouncedSave = useDebouncedCallback(async (prefs: UserPreferences) => {
    try {
      await preferencesAPI.updatePreferences(prefs);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      setError(err.message);
    }
  }, 1000);

  const updatePreference = useCallback(async (path: string, value: any) => {
    const newPreferences = setNestedProperty(preferences, path, value);
    setPreferences(newPreferences);
    setSyncStatus('syncing');
    await debouncedSave(newPreferences);
  }, [preferences, debouncedSave]);

  return (
    <PreferencesContext.Provider value={{
      preferences,
      loading,
      error,
      updatePreference,
      resetPreferences,
      syncStatus
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}
```

#### 5.3.2 Custom Hooks for Preferences
```typescript
// Custom hook for specific preference categories
export function useUIPreferences() {
  const { preferences, updatePreference } = usePreferences();

  return {
    theme: preferences.ui?.theme || 'system',
    setTheme: (theme: string) => updatePreference('ui.theme', theme),

    layout: preferences.ui?.layout || 'default',
    setLayout: (layout: string) => updatePreference('ui.layout', layout),

    density: preferences.ui?.density || 'comfortable',
    setDensity: (density: string) => updatePreference('ui.density', density),
  };
}

// Custom hook for editor preferences
export function useEditorPreferences() {
  const { preferences, updatePreference } = usePreferences();

  return {
    fontSize: preferences.editor?.fontSize || 14,
    setFontSize: (size: number) => updatePreference('editor.fontSize', size),

    tabSize: preferences.editor?.tabSize || 2,
    setTabSize: (size: number) => updatePreference('editor.tabSize', size),

    wordWrap: preferences.editor?.wordWrap || false,
    setWordWrap: (wrap: boolean) => updatePreference('editor.wordWrap', wrap),
  };
}
```

#### 5.3.3 Offline-First State Management
```typescript
// Service Worker for offline preferences
class PreferencesCache {
  private cache: IDBPDatabase;
  private syncQueue: PendingChange[] = [];

  async init() {
    this.cache = await openDB('preferences', 1, {
      upgrade(db) {
        db.createObjectStore('preferences');
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      },
    });
  }

  async getPreferences(): Promise<UserPreferences> {
    return await this.cache.get('preferences', 'current') || {};
  }

  async updatePreference(path: string, value: any) {
    const prefs = await this.getPreferences();
    const updated = setNestedProperty(prefs, path, value);

    await this.cache.put('preferences', updated, 'current');

    // Add to sync queue for when online
    const change: PendingChange = {
      id: Date.now(),
      path,
      value,
      timestamp: new Date(),
    };

    await this.cache.put('syncQueue', change);
  }

  async syncWhenOnline() {
    if (!navigator.onLine) return;

    const changes = await this.cache.getAll('syncQueue');

    for (const change of changes) {
      try {
        await preferencesAPI.updatePreference(change.path, change.value);
        await this.cache.delete('syncQueue', change.id);
      } catch (error) {
        console.error('Failed to sync preference change:', error);
        break; // Stop syncing on first error
      }
    }
  }
}
```

### 5.4 Security Patterns for Sensitive Data

#### 5.4.1 Client-Side Encryption for FTP Credentials
```typescript
// Encryption utility for sensitive data
class ClientSideEncryption {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptCredentials(
    credentials: FTPCredentials,
    userPassword: string
  ): Promise<EncryptedCredentials> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(userPassword, salt);

    const data = new TextEncoder().encode(JSON.stringify(credentials));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      data: Array.from(new Uint8Array(encrypted)),
      salt: Array.from(salt),
      iv: Array.from(iv),
    };
  }

  static async decryptCredentials(
    encrypted: EncryptedCredentials,
    userPassword: string
  ): Promise<FTPCredentials> {
    const salt = new Uint8Array(encrypted.salt);
    const iv = new Uint8Array(encrypted.iv);
    const key = await this.deriveKey(userPassword, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      new Uint8Array(encrypted.data)
    );

    const json = new TextDecoder().decode(decrypted);
    return JSON.parse(json);
  }
}
```

#### 5.4.2 Secure Token Management
```typescript
// Secure token storage and management
class SecureTokenManager {
  private static readonly TOKEN_KEY = 'ezedit_auth_token';
  private static readonly REFRESH_KEY = 'ezedit_refresh_token';

  static async storeTokens(tokens: AuthTokens): Promise<void> {
    // Encrypt tokens before storing
    const encryptedAccess = await this.encryptToken(tokens.accessToken);
    const encryptedRefresh = await this.encryptToken(tokens.refreshToken);

    // Store in secure storage (localStorage with encryption)
    localStorage.setItem(this.TOKEN_KEY, encryptedAccess);
    localStorage.setItem(this.REFRESH_KEY, encryptedRefresh);

    // Set up automatic refresh
    this.scheduleTokenRefresh(tokens.expiresIn);
  }

  static async getAccessToken(): Promise<string | null> {
    const encrypted = localStorage.getItem(this.TOKEN_KEY);
    if (!encrypted) return null;

    try {
      return await this.decryptToken(encrypted);
    } catch (error) {
      // Token corrupted, clear storage
      this.clearTokens();
      return null;
    }
  }

  private static async encryptToken(token: string): Promise<string> {
    // Use browser crypto API for token encryption
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Store key securely (simplified for example)
    // In practice, derive from user session or use secure storage
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(token)
    );

    return btoa(JSON.stringify({
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
    }));
  }
}
```

#### 5.4.3 Request Security and Rate Limiting
```typescript
// API client with built-in security
class SecureAPIClient {
  private rateLimiter: Map<string, number[]> = new Map();
  private csrfToken: string | null = null;

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Check rate limits
    if (!this.checkRateLimit(endpoint)) {
      throw new Error('Rate limit exceeded');
    }

    // Get fresh CSRF token if needed
    if (!this.csrfToken) {
      await this.refreshCSRFToken();
    }

    // Add security headers
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': this.csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };

    // Add authentication if available
    const token = await SecureTokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'same-origin', // Include cookies for additional security
    });

    // Handle token refresh
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        return this.request(endpoint, options);
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const window = 60000; // 1 minute
    const limit = 100; // 100 requests per minute

    const requests = this.rateLimiter.get(endpoint) || [];
    const recentRequests = requests.filter(time => now - time < window);

    if (recentRequests.length >= limit) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimiter.set(endpoint, recentRequests);
    return true;
  }
}
```

## 6. Functional Requirements Summary

### 6.1 Authentication Requirements
- **REQ-AUTH-001**: Support OAuth 2.0 with Google, GitHub, Microsoft, Apple, Discord
- **REQ-AUTH-002**: Implement TOTP, SMS, email, and WebAuthn MFA methods
- **REQ-AUTH-003**: Provide enterprise SSO with SAML 2.0 and OIDC
- **REQ-AUTH-004**: Support concurrent sessions with device management
- **REQ-AUTH-005**: Implement session security with automatic timeout

### 6.2 Preferences Requirements
- **REQ-PREF-001**: Provide comprehensive UI/UX customization options
- **REQ-PREF-002**: Secure storage and management of FTP credentials
- **REQ-PREF-003**: Granular notification preferences and controls
- **REQ-PREF-004**: Application behavior and performance settings
- **REQ-PREF-005**: Privacy controls and data management options

### 6.3 Synchronization Requirements
- **REQ-SYNC-001**: Real-time preference synchronization across devices
- **REQ-SYNC-002**: Intelligent conflict resolution for concurrent edits
- **REQ-SYNC-003**: Offline capability with automatic sync on reconnect
- **REQ-SYNC-004**: Device-specific overrides and configurations
- **REQ-SYNC-005**: Sync performance optimization with delta updates

### 6.4 Security Requirements
- **REQ-SEC-001**: End-to-end encryption for sensitive data
- **REQ-SEC-002**: GDPR compliance with user rights implementation
- **REQ-SEC-003**: Comprehensive audit logging and monitoring
- **REQ-SEC-004**: Automated backup and disaster recovery
- **REQ-SEC-005**: Zero-knowledge architecture for user data

## 7. Technical Implementation Roadmap

### 7.1 Phase 1: Foundation (Weeks 1-4)
- Enhance existing Supabase authentication with OAuth providers
- Implement basic preference storage and retrieval
- Set up WebSocket infrastructure for real-time sync
- Create core API endpoints for preferences management

### 7.2 Phase 2: Security & MFA (Weeks 5-8)
- Implement MFA with TOTP and WebAuthn support
- Add client-side encryption for sensitive data
- Enhance session management with device tracking
- Implement comprehensive audit logging

### 7.3 Phase 3: Synchronization (Weeks 9-12)
- Build real-time sync with conflict resolution
- Implement offline support with local caching
- Add device-specific override capabilities
- Create sync monitoring and health checks

### 7.4 Phase 4: Enterprise Features (Weeks 13-16)
- Add enterprise SSO with SAML 2.0
- Implement advanced security features
- Create admin dashboards and controls
- Add compliance reporting and data export

### 7.5 Phase 5: Optimization & Polish (Weeks 17-20)
- Performance optimization and caching
- Advanced UI/UX preference options
- Mobile app synchronization support
- Load testing and security auditing

## 8. Success Metrics

### 8.1 Performance Metrics
- **Sync Latency**: < 500ms for preference updates across devices
- **Authentication Speed**: < 2 seconds for OAuth login flows
- **Offline Capability**: 100% preference access while offline
- **Conflict Resolution**: < 1% of sync operations require user intervention

### 8.2 Security Metrics
- **Zero Security Breaches**: No unauthorized access to user data
- **Encryption Coverage**: 100% of sensitive data encrypted at rest and in transit
- **Audit Compliance**: 100% of security events logged and monitored
- **Recovery Time**: < 1 hour for disaster recovery scenarios

### 8.3 User Experience Metrics
- **Preference Persistence**: 99.9% reliability for preference sync
- **Cross-Device Consistency**: < 5 seconds for preference propagation
- **User Satisfaction**: > 4.5/5 rating for authentication experience
- **Feature Adoption**: > 80% of users customize at least 5 preferences

This specification provides a comprehensive framework for implementing a robust, secure, and user-friendly authentication system with advanced preference management and cross-device synchronization capabilities for the EzEdit platform.