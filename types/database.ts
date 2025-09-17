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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
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
      }
      sites: {
        Row: {
          id: string
          org_id: string
          domain: string
          subdomain: string
          config: Json
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          domain?: string
          subdomain: string
          config?: Json
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          domain?: string
          subdomain?: string
          config?: Json
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
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