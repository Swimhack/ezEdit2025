import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: Date | null;
  features: {
    canSave: boolean;
    canDeploy: boolean;
    maxSites: number;
    hasAI: boolean;
    hasSupport: boolean;
    hasPrioritySupport: boolean;
  };
  setTier: (tier: SubscriptionTier) => void;
  checkFeature: (feature: keyof SubscriptionState['features']) => boolean;
  isExpired: () => boolean;
}

const getFeaturesByTier = (tier: SubscriptionTier) => {
  switch (tier) {
    case 'pro':
      return {
        canSave: true,
        canDeploy: true,
        maxSites: 999,
        hasAI: false,
        hasSupport: true,
        hasPrioritySupport: false,
      };
    case 'enterprise':
      return {
        canSave: true,
        canDeploy: true,
        maxSites: 9999,
        hasAI: true,
        hasSupport: true,
        hasPrioritySupport: true,
      };
    case 'free':
    default:
      return {
        canSave: false,
        canDeploy: false,
        maxSites: 0,
        hasAI: false,
        hasSupport: false,
        hasPrioritySupport: false,
      };
  }
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      expiresAt: null,
      features: getFeaturesByTier('free'),
      
      setTier: (tier: SubscriptionTier) => {
        const features = getFeaturesByTier(tier);
        const expiresAt = tier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null; // 30 days
        set({ tier, features, expiresAt });
      },
      
      checkFeature: (feature: keyof SubscriptionState['features']) => {
        const state = get();
        if (state.isExpired()) return false;
        return state.features[feature] as boolean;
      },
      
      isExpired: () => {
        const { tier, expiresAt } = get();
        if (tier === 'free') return false;
        if (!expiresAt) return true;
        return new Date() > new Date(expiresAt);
      },
    }),
    {
      name: 'ezedit-subscription',
    }
  )
);
