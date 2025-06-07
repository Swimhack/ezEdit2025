import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase, auth } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabase: SupabaseClient;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any | null; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data?: any }>;
  signOut: () => Promise<{ error: any | null }>;
  resetPassword: (email: string) => Promise<{ error: any | null; data?: any }>;
  updatePassword: (password: string) => Promise<{ error: any | null; data?: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and user
    setLoading(true);
    
    const initAuth = async () => {
      const { data: sessionData } = await auth.getSession();
      if (sessionData.session) {
        setSession(sessionData.session);
        const { data: userData } = await auth.getUser();
        setUser(userData.user);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      // Get the user on auth state change
      if (session) {
        const { data } = await auth.getUser();
        setUser(data.user);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setLoading(true);
    const response = await auth.signUp(email, password, metadata ? { metadata } : undefined);
    setLoading(false);
    return response;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const response = await auth.signIn(email, password);
    setLoading(false);
    return response;
  };

  const signOut = async () => {
    setLoading(true);
    const response = await auth.signOut();
    setLoading(false);
    return response;
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    const response = await auth.resetPassword(email);
    setLoading(false);
    return response;
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    const response = await auth.updatePassword(password);
    setLoading(false);
    return response;
  };

  const value = {
    user,
    session,
    loading,
    supabase,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
