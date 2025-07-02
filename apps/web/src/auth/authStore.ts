import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { createSupabaseClient } from '../../../../packages/supabase-client/src';

export type Plan = 'free' | 'pro' | 'admin';

interface AuthState {
  user: User | null;
  session: Session | null;
  plan: Plan | null;
  onboardingComplete: boolean;
  // actions
  setAuth: (user: User | null, session: Session | null) => void;
  clearAuth: () => void;
}

/**
 * Centralised Zustand auth store used throughout the web-app.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      plan: null,
      onboardingComplete: false,
      setAuth: (user, session) => {
        const plan: Plan =
          user?.user_metadata?.role === 'admin'
            ? 'admin'
            : (user?.user_metadata?.plan as Plan) || 'free';
        set({ user, session, plan });
      },
      clearAuth: () => set({ user: null, session: null, plan: null, onboardingComplete: false }),
    }),
    { name: 'ezEdit-auth' }
  )
);

// Initialise a singleton Supabase client for the browser runtime.
export const supabase = createSupabaseClient();

// Sync auth changes from Supabase into Zustand.
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    useAuthStore.getState().setAuth(session.user, session);
  } else {
    useAuthStore.getState().clearAuth();
  }
});
