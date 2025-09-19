/**
 * API Contracts for System Authentication User Login Setup
 *
 * This file defines the interfaces and contracts for the authentication system.
 * All implementations must adhere to these contracts for consistency and testability.
 */

// Base response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Authentication request/response types
export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
  acceptedTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceFingerprint?: string;
}

export interface AuthResponse {
  user: UserProfile;
  session: SessionInfo;
  preferences: UserPreferences;
  requiresTwoFactor?: boolean;
  backupCodes?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SessionInfo {
  id: string;
  expiresAt: string;
  isRememberMe: boolean;
  deviceInfo: {
    platform: string;
    browser: string;
    location?: string;
  };
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
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
    panelLayout: string;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    securityAlerts: boolean;
    marketingUpdates: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    rememberDevice: boolean;
  };
}

export interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

// OAuth types
export interface OAuthProvider {
  id: string;
  name: string;
  connected: boolean;
  connectedAt?: string;
  email?: string;
  lastUsed?: string;
}

export interface OAuthConnectionRequest {
  provider: 'google' | 'github' | 'microsoft';
  redirectUrl?: string;
}

export interface OAuthCallbackRequest {
  provider: string;
  code: string;
  state: string;
}

// Password management
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Session management
export interface ActiveSession {
  id: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
  };
  createdAt: string;
  lastActivity: string;
  current: boolean;
}

// Audit logs
export interface AuthEvent {
  id: string;
  eventType: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
  };
  createdAt: string;
  details?: Record<string, any>;
}

export interface AuditLogQuery {
  eventType?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Two-factor authentication
export interface EnableTwoFactorResponse {
  qrCode: string;
  backupCodes: string[];
  secret: string;
}

export interface VerifyTwoFactorRequest {
  code: string;
  backupCode?: string;
}

// Account management
export interface UpdateProfileRequest {
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirmation: string; // Must be "DELETE"
}

// Rate limiting
export interface RateLimitInfo {
  remaining: number;
  resetTime: string;
  retryAfter?: number;
}

// API Endpoint Contracts

/**
 * Authentication Endpoints
 */
export interface AuthEndpoints {
  // Registration
  'POST /api/auth/register': {
    request: RegisterRequest;
    response: ApiResponse<AuthResponse>;
    errors: {
      400: 'Invalid email or password';
      409: 'Email already exists';
      429: 'Too many registration attempts';
    };
  };

  // Login
  'POST /api/auth/login': {
    request: LoginRequest;
    response: ApiResponse<AuthResponse>;
    errors: {
      400: 'Invalid credentials';
      401: 'Authentication failed';
      423: 'Account locked';
      429: 'Too many login attempts';
    };
  };

  // Logout
  'POST /api/auth/logout': {
    request: {};
    response: ApiResponse<{}>;
    errors: {
      401: 'Not authenticated';
    };
  };

  // OAuth initialization
  'POST /api/auth/oauth/{provider}': {
    request: OAuthConnectionRequest;
    response: ApiResponse<{ authUrl: string; state: string }>;
    errors: {
      400: 'Invalid provider';
      500: 'OAuth configuration error';
    };
  };

  // OAuth callback
  'GET /api/auth/oauth/callback': {
    request: OAuthCallbackRequest;
    response: ApiResponse<AuthResponse>;
    errors: {
      400: 'Invalid OAuth response';
      401: 'OAuth authentication failed';
    };
  };

  // Password reset
  'POST /api/auth/reset-password': {
    request: PasswordResetRequest;
    response: ApiResponse<{ message: string }>;
    errors: {
      429: 'Too many reset attempts';
    };
  };

  // Password reset confirmation
  'POST /api/auth/reset-password/confirm': {
    request: PasswordResetConfirmRequest;
    response: ApiResponse<{}>;
    errors: {
      400: 'Invalid or expired token';
      422: 'Weak password';
    };
  };

  // Get current user
  'GET /api/auth/me': {
    request: {};
    response: ApiResponse<UserProfile>;
    errors: {
      401: 'Not authenticated';
    };
  };
}

/**
 * User Preferences Endpoints
 */
export interface PreferencesEndpoints {
  // Get preferences
  'GET /api/auth/preferences': {
    request: {};
    response: ApiResponse<UserPreferences>;
    errors: {
      401: 'Not authenticated';
    };
  };

  // Update preferences
  'PUT /api/auth/preferences': {
    request: UpdatePreferencesRequest;
    response: ApiResponse<UserPreferences>;
    errors: {
      400: 'Invalid preferences';
      401: 'Not authenticated';
    };
  };
}

/**
 * Session Management Endpoints
 */
export interface SessionEndpoints {
  // List active sessions
  'GET /api/auth/sessions': {
    request: {};
    response: ApiResponse<ActiveSession[]>;
    errors: {
      401: 'Not authenticated';
    };
  };

  // Revoke specific session
  'DELETE /api/auth/sessions/{sessionId}': {
    request: {};
    response: ApiResponse<{}>;
    errors: {
      401: 'Not authenticated';
      404: 'Session not found';
    };
  };

  // Revoke all other sessions
  'DELETE /api/auth/sessions/others': {
    request: {};
    response: ApiResponse<{ revokedCount: number }>;
    errors: {
      401: 'Not authenticated';
    };
  };
}

/**
 * OAuth Management Endpoints
 */
export interface OAuthEndpoints {
  // List connected OAuth providers
  'GET /api/auth/oauth/connections': {
    request: {};
    response: ApiResponse<OAuthProvider[]>;
    errors: {
      401: 'Not authenticated';
    };
  };

  // Disconnect OAuth provider
  'DELETE /api/auth/oauth/{provider}': {
    request: {};
    response: ApiResponse<{}>;
    errors: {
      400: 'Cannot disconnect last authentication method';
      401: 'Not authenticated';
      404: 'Provider not connected';
    };
  };
}

/**
 * Account Management Endpoints
 */
export interface AccountEndpoints {
  // Update profile
  'PUT /api/auth/profile': {
    request: UpdateProfileRequest;
    response: ApiResponse<UserProfile>;
    errors: {
      400: 'Invalid profile data';
      401: 'Not authenticated';
    };
  };

  // Change password
  'PUT /api/auth/password': {
    request: ChangePasswordRequest;
    response: ApiResponse<{}>;
    errors: {
      400: 'Invalid current password';
      401: 'Not authenticated';
      422: 'Weak password';
    };
  };

  // Enable two-factor authentication
  'POST /api/auth/2fa/enable': {
    request: {};
    response: ApiResponse<EnableTwoFactorResponse>;
    errors: {
      401: 'Not authenticated';
      409: 'Two-factor already enabled';
    };
  };

  // Verify and confirm two-factor setup
  'POST /api/auth/2fa/verify': {
    request: VerifyTwoFactorRequest;
    response: ApiResponse<{ verified: boolean }>;
    errors: {
      400: 'Invalid verification code';
      401: 'Not authenticated';
    };
  };

  // Disable two-factor authentication
  'DELETE /api/auth/2fa': {
    request: VerifyTwoFactorRequest;
    response: ApiResponse<{}>;
    errors: {
      400: 'Invalid verification code';
      401: 'Not authenticated';
    };
  };

  // Delete account
  'DELETE /api/auth/account': {
    request: DeleteAccountRequest;
    response: ApiResponse<{}>;
    errors: {
      400: 'Invalid password or confirmation';
      401: 'Not authenticated';
    };
  };
}

/**
 * Audit Log Endpoints (Admin only)
 */
export interface AuditEndpoints {
  // Get authentication events
  'GET /api/auth/audit-logs': {
    request: AuditLogQuery;
    response: PaginatedResponse<AuthEvent>;
    errors: {
      401: 'Not authenticated';
      403: 'Insufficient permissions';
    };
  };

  // Get user's own activity
  'GET /api/auth/activity': {
    request: AuditLogQuery;
    response: PaginatedResponse<AuthEvent>;
    errors: {
      401: 'Not authenticated';
    };
  };
}

// Combined contract interface
export interface AuthSystemAPI extends
  AuthEndpoints,
  PreferencesEndpoints,
  SessionEndpoints,
  OAuthEndpoints,
  AccountEndpoints,
  AuditEndpoints {}

// Error response types
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError extends AuthError {
  field: string;
  value: any;
}

// Webhook types (for external integrations)
export interface AuthWebhookPayload {
  event: string;
  userId: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookEvent {
  'user.registered': {
    user: UserProfile;
    method: 'email' | 'oauth';
    provider?: string;
  };
  'user.login': {
    user: UserProfile;
    session: SessionInfo;
    method: 'password' | 'oauth' | '2fa';
  };
  'user.logout': {
    userId: string;
    sessionId: string;
  };
  'user.account_locked': {
    userId: string;
    reason: string;
    lockedUntil: string;
  };
  'user.security_alert': {
    userId: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high';
    details: Record<string, any>;
  };
}

// Type guards for runtime validation
export function isAuthResponse(obj: any): obj is AuthResponse {
  return obj &&
    typeof obj.user === 'object' &&
    typeof obj.session === 'object' &&
    typeof obj.preferences === 'object';
}

export function isUserPreferences(obj: any): obj is UserPreferences {
  return obj &&
    ['light', 'dark', 'system'].includes(obj.theme) &&
    typeof obj.language === 'string' &&
    typeof obj.editorSettings === 'object';
}

// Rate limiting constants
export const RATE_LIMITS = {
  LOGIN: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  REGISTER: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
  PASSWORD_RESET: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
  PROFILE_UPDATE: { requests: 10, window: 60 * 60 * 1000 }, // 10 requests per hour
} as const;