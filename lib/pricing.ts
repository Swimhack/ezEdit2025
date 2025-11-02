/**
 * Pricing utilities and feature checking
 */

export type PlanType = 'FREE' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'

export interface PlanLimits {
  websites: number // -1 for unlimited
  aiRequests: number // -1 for unlimited
  fileSizeMB: number // -1 for unlimited
  historyDays: number // -1 for unlimited
}

export interface PlanFeatures {
  advancedAI: boolean
  prioritySupport: boolean
  teamCollaboration: boolean
  apiAccess: boolean
  customBranding: boolean
  sso: boolean
}

/**
 * Get plan limits based on subscription tier
 */
export function getPlanLimits(tier: string): PlanLimits {
  const tierUpper = tier.toUpperCase()
  
  switch (tierUpper) {
    case 'PROFESSIONAL':
      return {
        websites: 3,
        aiRequests: 500,
        fileSizeMB: 100,
        historyDays: -1
      }
    case 'AGENCY':
      return {
        websites: 15,
        aiRequests: 2000,
        fileSizeMB: 500,
        historyDays: -1
      }
    case 'ENTERPRISE':
      return {
        websites: -1,
        aiRequests: -1,
        fileSizeMB: -1,
        historyDays: -1
      }
    case 'FREE':
    default:
      return {
        websites: 1,
        aiRequests: 50,
        fileSizeMB: 10,
        historyDays: 7
      }
  }
}

/**
 * Check if user can add more websites
 */
export function canAddWebsite(currentCount: number, tier: string): boolean {
  const limits = getPlanLimits(tier)
  if (limits.websites === -1) return true
  return currentCount < limits.websites
}

/**
 * Check if user can use AI feature (based on request count)
 */
export function canUseAI(currentRequests: number, tier: string): boolean {
  const limits = getPlanLimits(tier)
  if (limits.aiRequests === -1) return true
  return currentRequests < limits.aiRequests
}

/**
 * Check if file size is within limits
 */
export function isFileSizeAllowed(fileSizeMB: number, tier: string): boolean {
  const limits = getPlanLimits(tier)
  if (limits.fileSizeMB === -1) return true
  return fileSizeMB <= limits.fileSizeMB
}

/**
 * Get plan features based on tier
 */
export function getPlanFeatures(tier: string): PlanFeatures {
  const tierUpper = tier.toUpperCase()
  
  return {
    advancedAI: tierUpper !== 'FREE',
    prioritySupport: tierUpper === 'PROFESSIONAL' || tierUpper === 'AGENCY' || tierUpper === 'ENTERPRISE',
    teamCollaboration: tierUpper === 'AGENCY' || tierUpper === 'ENTERPRISE',
    apiAccess: tierUpper === 'AGENCY' || tierUpper === 'ENTERPRISE',
    customBranding: tierUpper === 'AGENCY' || tierUpper === 'ENTERPRISE',
    sso: tierUpper === 'ENTERPRISE'
  }
}

/**
 * Format plan name for display
 */
export function formatPlanName(tier: string): string {
  const tierUpper = tier.toUpperCase()
  const names: Record<string, string> = {
    'FREE': 'Starter',
    'PROFESSIONAL': 'Professional',
    'AGENCY': 'Agency',
    'ENTERPRISE': 'Enterprise'
  }
  return names[tierUpper] || tier
}

