import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Client component Supabase client
export const createSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server component Supabase client
export const createSupabaseServerClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'single' | 'unlimited'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'single' | 'unlimited'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'single' | 'unlimited'
          updated_at?: string
        }
      }
      ftp_connections: {
        Row: {
          id: string
          user_id: string
          name: string
          host: string
          port: number
          username: string
          password_encrypted: string
          protocol: 'ftp' | 'sftp'
          is_active: boolean
          last_connected: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          host: string
          port?: number
          username: string
          password_encrypted: string
          protocol?: 'ftp' | 'sftp'
          is_active?: boolean
          last_connected?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          host?: string
          port?: number
          username?: string
          password_encrypted?: string
          protocol?: 'ftp' | 'sftp'
          is_active?: boolean
          last_connected?: string | null
          updated_at?: string
        }
      }
      file_nodes: {
        Row: {
          id: string
          connection_id: string
          name: string
          path: string
          type: 'file' | 'directory'
          size: number | null
          modified: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          connection_id: string
          name: string
          path: string
          type: 'file' | 'directory'
          size?: number | null
          modified: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          name?: string
          path?: string
          type?: 'file' | 'directory'
          size?: number | null
          modified?: string
          parent_id?: string | null
          updated_at?: string
        }
      }
      edit_history: {
        Row: {
          id: string
          user_id: string
          connection_id: string
          file_path: string
          content: string
          change_type: 'create' | 'update' | 'delete'
          file_size: number
          language: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          connection_id: string
          file_path: string
          content: string
          change_type: 'create' | 'update' | 'delete'
          file_size: number
          language?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          connection_id?: string
          file_path?: string
          content?: string
          change_type?: 'create' | 'update' | 'delete'
          file_size?: number
          language?: string | null
          timestamp?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          updated_at?: string
        }
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          context: any | null
          timestamp: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          context?: any | null
          timestamp?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          context?: any | null
          timestamp?: string
        }
      }
      quote_submissions: {
        Row: {
          id: string
          domain_name: string
          request_details: string
          created_at: string
        }
        Insert: {
          id?: string
          domain_name: string
          request_details: string
          created_at?: string
        }
        Update: {
          id?: string
          domain_name?: string
          request_details?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

