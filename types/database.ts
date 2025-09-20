export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'developer' | 'admin' | 'superadmin'
          last_login_at: string | null
          failed_login_attempts: number | null
          account_locked_at: string | null
          password_changed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'developer' | 'admin' | 'superadmin'
          last_login_at?: string | null
          failed_login_attempts?: number | null
          account_locked_at?: string | null
          password_changed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'developer' | 'admin' | 'superadmin'
          last_login_at?: string | null
          failed_login_attempts?: number | null
          account_locked_at?: string | null
          password_changed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
            isOneToOne: true
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_owner_id_fkey'
            columns: ['owner_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      sites: {
        Row: {
          id: string
          org_id: string
          domain: string | null
          subdomain: string
          config: Json
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          domain?: string | null
          subdomain: string
          config?: Json
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          domain?: string | null
          subdomain?: string
          config?: Json
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sites_org_id_fkey'
            columns: ['org_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          site_id: string
          tier: string
          status: 'active' | 'cancelled' | 'expired'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site_id: string
          tier: string
          status?: 'active' | 'cancelled' | 'expired'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          site_id?: string
          tier?: string
          status?: 'active' | 'cancelled' | 'expired'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memberships_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memberships_site_id_fkey'
            columns: ['site_id']
            referencedRelation: 'sites'
            referencedColumns: ['id']
          }
        ]
      }
      content: {
        Row: {
          id: string
          site_id: string
          type: 'page' | 'post' | 'program' | 'media'
          title: string
          slug: string
          data: Json
          access_level: string
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          type: 'page' | 'post' | 'program' | 'media'
          title: string
          slug: string
          data?: Json
          access_level?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          type?: 'page' | 'post' | 'program' | 'media'
          title?: string
          slug?: string
          data?: Json
          access_level?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_site_id_fkey'
            columns: ['site_id']
            referencedRelation: 'sites'
            referencedColumns: ['id']
          }
        ]
      }
      ai_prompts: {
        Row: {
          id: string
          user_id: string
          site_id: string | null
          prompt: string
          result: Json
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site_id?: string | null
          prompt: string
          result?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          site_id?: string | null
          prompt?: string
          result?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_prompts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ai_prompts_site_id_fkey'
            columns: ['site_id']
            referencedRelation: 'sites'
            referencedColumns: ['id']
          }
        ]
      }
      authentication_requests: {
        Row: {
          id: string
          correlation_id: string
          user_id: string | null
          email: string
          method: 'password' | 'oauth_google'
          operation: 'login' | 'signup' | 'password_reset' | 'logout'
          ip_address: string
          user_agent: string | null
          session_id: string | null
          timestamp: string
          duration: number | null
          success: boolean
          error_code: string | null
          error_message: string | null
          context: Json
          created_at: string
        }
        Insert: {
          id?: string
          correlation_id: string
          user_id?: string | null
          email: string
          method: 'password' | 'oauth_google'
          operation: 'login' | 'signup' | 'password_reset' | 'logout'
          ip_address: string
          user_agent?: string | null
          session_id?: string | null
          timestamp?: string
          duration?: number | null
          success: boolean
          error_code?: string | null
          error_message?: string | null
          context?: Json
          created_at?: string
        }
        Update: {
          id?: string
          correlation_id?: string
          user_id?: string | null
          email?: string
          method?: 'password' | 'oauth_google'
          operation?: 'login' | 'signup' | 'password_reset' | 'logout'
          ip_address?: string
          user_agent?: string | null
          session_id?: string | null
          timestamp?: string
          duration?: number | null
          success?: boolean
          error_code?: string | null
          error_message?: string | null
          context?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'authentication_requests_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      error_log_entries: {
        Row: {
          id: string
          correlation_id: string
          timestamp: string
          level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
          message: string
          error_type: string | null
          error_code: string | null
          stack_trace: string | null
          user_id: string | null
          session_id: string | null
          route: string | null
          method: string | null
          source: 'frontend' | 'backend' | 'database' | 'external' | null
          context: Json
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          correlation_id: string
          timestamp?: string
          level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
          message: string
          error_type?: string | null
          error_code?: string | null
          stack_trace?: string | null
          user_id?: string | null
          session_id?: string | null
          route?: string | null
          method?: string | null
          source?: 'frontend' | 'backend' | 'database' | 'external' | null
          context?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          correlation_id?: string
          timestamp?: string
          level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
          message?: string
          error_type?: string | null
          error_code?: string | null
          stack_trace?: string | null
          user_id?: string | null
          session_id?: string | null
          route?: string | null
          method?: string | null
          source?: 'frontend' | 'backend' | 'database' | 'external' | null
          context?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'error_log_entries_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      authentication_log_entries: {
        Row: {
          id: string
          user_id: string
          correlation_id: string
          timestamp: string
          event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'account_lockout'
          method: 'password' | 'oauth_google' | 'magic_link'
          ip_address: string
          user_agent: string | null
          location: string | null
          device_fingerprint: string | null
          session_id: string | null
          duration: number | null
          failure_reason: string | null
          risk_score: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          correlation_id: string
          timestamp?: string
          event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'account_lockout'
          method: 'password' | 'oauth_google' | 'magic_link'
          ip_address: string
          user_agent?: string | null
          location?: string | null
          device_fingerprint?: string | null
          session_id?: string | null
          duration?: number | null
          failure_reason?: string | null
          risk_score?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          correlation_id?: string
          timestamp?: string
          event?: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'account_lockout'
          method?: 'password' | 'oauth_google' | 'magic_link'
          ip_address?: string
          user_agent?: string | null
          location?: string | null
          device_fingerprint?: string | null
          session_id?: string | null
          duration?: number | null
          failure_reason?: string | null
          risk_score?: number | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'authentication_log_entries_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      log_access_sessions: {
        Row: {
          id: string
          user_id: string
          api_key_id: string | null
          timestamp: string
          access_type: 'session' | 'api_key' | 'token'
          log_type: 'error' | 'authentication' | 'access' | 'performance' | null
          filters: Json
          record_count: number | null
          ip_address: string
          user_agent: string | null
          duration: number | null
          exported: boolean
          export_format: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_key_id?: string | null
          timestamp?: string
          access_type: 'session' | 'api_key' | 'token'
          log_type?: 'error' | 'authentication' | 'access' | 'performance' | null
          filters?: Json
          record_count?: number | null
          ip_address: string
          user_agent?: string | null
          duration?: number | null
          exported?: boolean
          export_format?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          api_key_id?: string | null
          timestamp?: string
          access_type?: 'session' | 'api_key' | 'token'
          log_type?: 'error' | 'authentication' | 'access' | 'performance' | null
          filters?: Json
          record_count?: number | null
          ip_address?: string
          user_agent?: string | null
          duration?: number | null
          exported?: boolean
          export_format?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'log_access_sessions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'log_access_sessions_api_key_id_fkey'
            columns: ['api_key_id']
            referencedRelation: 'api_keys'
            referencedColumns: ['id']
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          name: string
          permissions: string[] | null
          role: 'developer' | 'admin' | 'superadmin'
          expires_at: string | null
          last_used_at: string | null
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          key_hash: string
          name: string
          permissions?: string[] | null
          role: 'developer' | 'admin' | 'superadmin'
          expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          key_hash?: string
          name?: string
          permissions?: string[] | null
          role?: 'developer' | 'admin' | 'superadmin'
          expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      [table: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: {
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
          isOneToOne?: boolean
        }[]
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
