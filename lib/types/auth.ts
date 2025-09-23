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

export interface AuthenticationSession {
  id: string
  user_id: string
  session_token: string
  device_info: DeviceInfo
  ip_address: string
  user_agent: string
  created_at: string
  expires_at: string
  last_activity_at: string
  is_active: boolean
  logout_reason: LogoutReason | null
}

export interface DeviceInfo {
  browser: string
  os: string
  device: string
  fingerprint: string
}

export type LogoutReason = 'user_logout' | 'timeout' | 'security_logout' | 'admin_logout'

// === Security Event Log Types ===

export interface SecurityEventLog {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: SecurityEventType
  event_outcome: EventOutcome
  ip_address: string
  user_agent: string
  event_details: Record<string, any>
  risk_score: number
  timestamp: string
  correlation_id: string
}

export type SecurityEventType =
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset'
  | 'account_locked'
  | 'mfa_enabled'
  | 'failed_login'
  | 'email_verification'
  | 'session_expired'

export type EventOutcome = 'success' | 'failure' | 'blocked'

// === Password Reset Token Types ===

export interface PasswordResetToken {
  id: string
  user_id: string
  token_hash: string
  created_at: string
  expires_at: string
  used_at: string | null
  ip_address: string
  is_used: boolean
  email_sent_at: string
}

// === Email Verification Types ===

export interface EmailVerification {
  id: string
  user_id: string
  email: string
  token_hash: string
  created_at: string
  expires_at: string
  verified_at: string | null
  attempts: number
  status: EmailVerificationStatus
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
  user: UserAccount | null
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