import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseClient: SupabaseClient | null = null;

// Lazy-loaded admin client to avoid build-time errors
export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
};

// Lazy-loaded client for public operations
export const getSupabaseClient = () => {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
};

// Backwards compatibility exports (deprecated)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  }
});

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

// Type definitions
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  service_type?: string;
  message: string;
  status?: 'new' | 'in_progress' | 'completed' | 'archived';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
