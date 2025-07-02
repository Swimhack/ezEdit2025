import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Role definitions for Supabase client helper.
 */
export type SupabaseClientRole = 'anon' | 'service';

/**
 * Options for creating a Supabase client instance.
 */
export interface CreateSupabaseClientOptions {
  /**
   * Choose which key to use. Defaults to "anon".
   */
  role?: SupabaseClientRole;
  /**
   * Explicit service key – used only when role === 'service'.
   * Falls back to SUPABASE_SERVICE_KEY env var when omitted.
   */
  serviceKey?: string;
}

/**
 * Centralised factory for Supabase clients.
 * Ensures we never litter `createClient()` calls throughout the codebase.
 *
 * Usage (browser):
 *   import { supabaseClient } from 'packages/supabase-client';
 *
 * Usage (server / API route):
 *   import { createSupabaseClient } from 'packages/supabase-client';
 *   const supabase = createSupabaseClient({ role: 'service' });
 */
export function createSupabaseClient(
  options: CreateSupabaseClientOptions = {}
): SupabaseClient {
  const {
    role = 'anon',
    serviceKey = process.env.SUPABASE_SERVICE_KEY,
  } = options;

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('[supabase-client] SUPABASE_URL env var is missing');
  }

  const anonKey =
    role === 'service'
      ? serviceKey
      : process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error('[supabase-client] Supabase key env var is missing');
  }

  // Note: By default, we enable `persistSession` & `autoRefreshToken` (browser) via defaults.
  return createClient(supabaseUrl, anonKey, {
    persistSession: true,
    autoRefreshToken: true,
  });
}

/**
 * Singleton client for frontend usage.  This should be imported for any
 * browser/runtime code that does NOT need elevated service privileges.
 */
export const supabaseClient: SupabaseClient = createSupabaseClient();

export default supabaseClient;
