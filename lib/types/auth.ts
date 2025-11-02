/**
 * Enterprise Authentication System Types
 * Comprehensive type definitions for robust authentication with Supabase integration
 */

import { z } from 'zod'

// === User Account Types ===

export interface UserAccount {
  id: string
  email: string
  verification_status: VerificationStatus
  created_at: string
  updated_at: string
  last_login_at: string | null
  login_attempts: number
  account_locked_until: string | null
  mfa_enabled: boolean
  mfa_secret: string | null
}

export type VerificationStatus = 'unverified' | 'verified' | 'pending'

// === Authentication Session Types ===

export type SessionStatus = 'active' | 'expired' | 'revoked'

export interface AuthenticationSession {
  id: string
  user_id: string
  session_token: string
  status: SessionStatus
  created_at: string
  updated_at: string
  expires_at: string
  last_activity_at: string | null
  revoked_at: string | null
  revocation_reason: string | null
  ip_address: string | null
  ip_changed_at: string | null
  user_agent_hash: string | null
  device_fingerprint: string | null
  mfa_verified_at: string | null
}

export interface DeviceInfo {
  browser: string
  os: string
  device: string
  fingerprint: string
}

export type LogoutReason = 'user_logout' | 'timeout' | 'security_logout' | 'admin_logout'

// === Security Event Log Types ===

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical'

export type SecurityEventType =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'email_verification'
  | 'account_locked'
  | 'account_unlocked'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'suspicious_activity'
  | 'session_created'
  | 'session_expired'
  | 'session_revoked'
  | 'permission_denied'
  | 'data_access'
  | 'configuration_change'
  | 'security_policy_violation'

export type EventOutcome = 'success' | 'failure' | 'blocked'

export interface SecurityEventInput {
  event_type: SecurityEventType
  severity_level: SecurityLevel
  event_description: string
  user_id?: string
  session_id?: string
  source_ip?: string
  user_agent?: string
  additional_context?: Record<string, any>
  correlation_ids?: Record<string, string>
}


export interface SecurityEventLog {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: SecurityEventType
  severity_level: SecurityLevel
  event_description: string
  source_ip?: string | null
  user_agent?: string | null
  ip_address?: string | null
  created_at: string
  updated_at: string
  additional_context?: string | null
  correlation_ids?: string | null
  correlation_id?: string | null
  event_outcome?: EventOutcome
  risk_score?: number
}
// === Password Reset Token Types ===

export type TokenStatus = 'active' | 'used' | 'revoked'

export interface PasswordResetToken {
  id: string
  user_id: string
  reset_token: string
  status: TokenStatus
  created_at: string
  updated_at: string
  expires_at: string
  attempts_remaining: number
  created_ip: string | null
  used_ip: string | null
  last_attempted_at: string | null
  used_at: string | null
  revoked_at: string | null
  revocation_reason: string | null
  rate_limited_until: string | null
}

// === Email Verification Types ===

export interface EmailVerificationToken {
  id: string
  user_id: string
  email: string
  verification_token: string
  status: EmailVerificationStatus | 'revoked'
  created_at: string
  updated_at: string
  expires_at: string
  attempts_remaining: number
  resent_count: number
  last_attempted_at: string | null
  last_resent_at: string | null
  created_ip: string | null
  verified_ip: string | null
  verified_at: string | null
  failed_at: string | null
  failure_reason: string | null
  revoked_at: string | null
  revocation_reason: string | null
  rate_limited_until: string | null
}
export type EmailVerificationStatus = 'pending' | 'verified' | 'expired' | 'failed'

// === API Request/Response Types ===

export interface SignupRequest {
  email: string
  password: string
  confirmPassword?: string
  acceptTerms?: boolean
}

export interface SignupResponse {
  success: boolean
  message: string
  user: Pick<UserAccount, 'id' | 'email' | 'verification_status'>
  requiresVerification: boolean
}

export interface SigninRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SigninResponse {
  success: boolean
  message: string
  user: Pick<UserAccount, 'id' | 'email' | 'verification_status'>
  session: Pick<AuthenticationSession, 'id' | 'expires_at'>
  requiresMfa?: boolean
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface EmailVerificationRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

// === Error Types ===

export interface AuthSessionPayload {
  access_token: string
  refresh_token: string
  expires_at: number
  user: any
}

export interface AuthSuccessData {
  user: any
  session: AuthSessionPayload | null
  verification_required?: boolean
  verification_token?: string | null
  next_step?: string
}

export interface AuthResult {
  success: boolean
  data?: AuthSuccessData
  error?: AuthError
}

export interface AuthError {
  error: string
  message: string
  details?: Record<string, any>
  field?: string
}

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
// === Validation Schemas ===

export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  )

export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().optional(),
  acceptTerms: z.boolean().optional()
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
)

export const signinRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export const passwordResetRequestSchema = z.object({
  email: emailSchema
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
)

export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
})

export const resendVerificationSchema = z.object({
  email: emailSchema
})

// === Utility Types ===

export interface AuthContextType {
  user: any | null
  session: AuthenticationSession | null
  loading: boolean
  error: AuthError | null
  signup: (data: SignupRequest) => Promise<SignupResponse>
  signin: (data: SigninRequest) => Promise<SigninResponse>
  signout: () => Promise<void>
  resetPassword: (data: PasswordResetRequest) => Promise<void>
  confirmPasswordReset: (data: PasswordResetConfirmRequest) => Promise<void>
  verifyEmail: (data: EmailVerificationRequest) => Promise<void>
  resendVerification: (data: ResendVerificationRequest) => Promise<void>
  clearError: () => void
}

export interface AuthOptions {
  maxLoginAttempts: number
  lockoutDuration: number
  sessionDuration: number
  passwordResetExpiry: number
  emailVerificationExpiry: number
  enableMfa: boolean
  enableRateLimit: boolean
}

export interface NetworkRetryOptions {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  retryCondition: (error: any) => boolean
}

export interface SecurityEventContext {
  ipAddress: string
  userAgent: string
  correlationId: string
  riskScore?: number
  additionalData?: Record<string, any>
}

// === Type Guards ===

export function isAuthError(value: any): value is AuthError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.error === 'string' &&
    typeof value.message === 'string'
  )
}

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success
}

// === Constants ===

export const AUTH_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_DURATION_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  MAX_RESET_REQUESTS_PER_DAY: 3,
  MAX_VERIFICATION_ATTEMPTS: 5,
  RISK_SCORE_THRESHOLD: 70,

  // Network retry configuration
  NETWORK_RETRY_MAX_ATTEMPTS: 3,
  NETWORK_RETRY_DELAY_MS: 1000,
  NETWORK_BACKOFF_MULTIPLIER: 2
} as const

export type AuthConstants = typeof AUTH_CONSTANTS


























