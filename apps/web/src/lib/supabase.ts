import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Authentication helper functions
export const auth = {
  /**
   * Sign up a new user
   */
  signUp: async (email: string, password: string, options?: { metadata: Record<string, any> }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    return { data, error };
  },

  /**
   * Sign in a user
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get the current authenticated user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  /**
   * Get the current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  /**
   * Send a password reset email
   */
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  /**
   * Update user password
   */
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    return { data, error };
  },

  /**
   * Setup auth state change listener
   */
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
