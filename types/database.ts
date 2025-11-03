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
      tickets: {
        Row: {
          id: string
          customer_email: string
          customer_name: string | null
          domain: string
          has_existing_website: boolean
          detected_platform: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown' | null
          platform_confidence: number | null
          detection_method: 'api' | 'custom' | 'manual' | null
          request_description: string
          status: 'submitted' | 'admin_review' | 'quoted' | 'customer_accepted' | 'in_progress' | 'completed' | 'cancelled'
          quoted_price: number | null
          quoted_timeline: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
          submitted_by: string | null
        }
        Insert: {
          id?: string
          customer_email: string
          customer_name?: string | null
          domain: string
          has_existing_website?: boolean
          detected_platform?: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown' | null
          platform_confidence?: number | null
          detection_method?: 'api' | 'custom' | 'manual' | null
          request_description: string
          status?: 'submitted' | 'admin_review' | 'quoted' | 'customer_accepted' | 'in_progress' | 'completed' | 'cancelled'
          quoted_price?: number | null
          quoted_timeline?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
          submitted_by?: string | null
        }
        Update: {
          id?: string
          customer_email?: string
          customer_name?: string | null
          domain?: string
          has_existing_website?: boolean
          detected_platform?: 'wordpress' | 'shopify' | 'wix' | 'ftp' | 'sftp' | 'unknown' | null
          platform_confidence?: number | null
          detection_method?: 'api' | 'custom' | 'manual' | null
          request_description?: string
          status?: 'submitted' | 'admin_review' | 'quoted' | 'customer_accepted' | 'in_progress' | 'completed' | 'cancelled'
          quoted_price?: number | null
          quoted_timeline?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_submitted_by_fkey'
            columns: ['submitted_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      ticket_credentials: {
        Row: {
          id: string
          ticket_id: string
          credential_type: 'ftp' | 'sftp' | 'wordpress_api' | 'shopify_api' | 'wix_api'
          host: string | null
          port: number | null
          username: string | null
          password: string | null
          api_key: string | null
          api_secret: string | null
          path: string | null
          encrypted_data: Json | null
          encrypted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          credential_type: 'ftp' | 'sftp' | 'wordpress_api' | 'shopify_api' | 'wix_api'
          host?: string | null
          port?: number | null
          username?: string | null
          password?: string | null
          api_key?: string | null
          api_secret?: string | null
          path?: string | null
          encrypted_data?: Json | null
          encrypted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          credential_type?: 'ftp' | 'sftp' | 'wordpress_api' | 'shopify_api' | 'wix_api'
          host?: string | null
          port?: number | null
          username?: string | null
          password?: string | null
          api_key?: string | null
          api_secret?: string | null
          path?: string | null
          encrypted_data?: Json | null
          encrypted_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_credentials_ticket_id_fkey'
            columns: ['ticket_id']
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          }
        ]
      }
      ticket_comments: {
        Row: {
          id: string
          ticket_id: string
          author_id: string | null
          author_role: 'customer' | 'admin'
          author_email: string | null
          comment: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id?: string | null
          author_role: 'customer' | 'admin'
          author_email?: string | null
          comment: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          author_id?: string | null
          author_role?: 'customer' | 'admin'
          author_email?: string | null
          comment?: string
          is_internal?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_comments_ticket_id_fkey'
            columns: ['ticket_id']
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_comments_author_id_fkey'
            columns: ['author_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      platform_detections: {
        Row: {
          id: string
          domain: string
          detected_platform: string | null
          detection_data: Json
          last_checked: string
          created_at: string
        }
        Insert: {
          id?: string
          domain: string
          detected_platform?: string | null
          detection_data?: Json
          last_checked?: string
          created_at?: string
        }
        Update: {
          id?: string
          domain?: string
          detected_platform?: string | null
          detection_data?: Json
          last_checked?: string
          created_at?: string
        }
        Relationships: []
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
