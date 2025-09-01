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
      map_configs: {
        Row: {
          id: string
          name: string
          label: string
          type: 'vtc' | 'wmts' | 'wms'
          style: string | null
          original_style: string | null
          country: string
          flag: string
          layers: string[] | null
          metadata: Json | null
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          preview_image_url: string | null
        }
        Insert: {
          id?: string
          name: string
          label: string
          type: 'vtc' | 'wmts' | 'wms'
          style?: string | null
          original_style?: string | null
          country?: string
          flag?: string
          layers?: string[] | null
          metadata?: Json | null
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          preview_image_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          label?: string
          type?: 'vtc' | 'wmts' | 'wms'
          style?: string | null
          original_style?: string | null
          country?: string
          flag?: string
          layers?: string[] | null
          metadata?: Json | null
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          preview_image_url?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          provider: string
          key_name: string
          encrypted_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: string
          key_name: string
          encrypted_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          key_name?: string
          encrypted_key?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
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