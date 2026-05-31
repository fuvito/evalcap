export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          job_title: string | null
          department: string | null
          manager_name: string | null
          default_check_in_type: 'daily' | 'weekly'
          onboarding_completed: boolean
          status: 'active' | 'suspended' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          job_title?: string | null
          department?: string | null
          manager_name?: string | null
          default_check_in_type?: 'daily' | 'weekly'
          onboarding_completed?: boolean
          status?: 'active' | 'suspended' | null
        }
        Update: {
          full_name?: string | null
          job_title?: string | null
          department?: string | null
          manager_name?: string | null
          default_check_in_type?: 'daily' | 'weekly'
          onboarding_completed?: boolean
          status?: 'active' | 'suspended' | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          content: string
          check_in_type: 'daily' | 'weekly'
          prompt_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          content: string
          check_in_type?: 'daily' | 'weekly'
          prompt_used?: string | null
        }
        Update: {
          content?: string
          check_in_type?: 'daily' | 'weekly'
        }
        Relationships: []
      }
      summaries: {
        Row: {
          id: string
          user_id: string
          content: string
          timeframe_start: string
          timeframe_end: string
          user_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          content: string
          timeframe_start: string
          timeframe_end: string
          user_instructions?: string | null
        }
        Update: {
          content?: string
          user_instructions?: string | null
        }
        Relationships: []
      }
      credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          allocated_per_month: number
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          allocated_per_month?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          allocated_per_month?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_events: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          delta: number
          reason: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          admin_id?: string | null
          delta: number
          reason?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          target_user_id: string | null
          detail: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          admin_id?: string | null
          action: string
          target_user_id?: string | null
          detail?: Record<string, unknown> | null
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Admin         = Database['public']['Tables']['admins']['Row']
export type Profile       = Database['public']['Tables']['profiles']['Row']
export type JournalEntry  = Database['public']['Tables']['journal_entries']['Row']
export type Credit        = Database['public']['Tables']['credits']['Row']
export type CreditEvent   = Database['public']['Tables']['credit_events']['Row']
export type AdminAuditLog = Database['public']['Tables']['admin_audit_log']['Row']
