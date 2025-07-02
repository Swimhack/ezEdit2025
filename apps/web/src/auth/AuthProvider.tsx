import { ReactNode, useEffect } from 'react';
import { supabase, useAuthStore } from './authStore';

interface Props {
  children: ReactNode;
}

/**
 * Simple context-like wrapper that hydrates auth state on page refresh.
 * Place this high in the React tree, e.g. inside App.tsx.
 */
export function AuthProvider({ children }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const currentSession = supabase.auth.session();
    if (currentSession?.user) {
      setAuth(currentSession.user, currentSession);
    }
  }, [setAuth]);

  return <>{children}</>;
}
