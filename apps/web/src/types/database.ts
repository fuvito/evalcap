/**
 * Database types for EvalCap
 * These mirror the Supabase schema — update when schema changes
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string | null
          job_title: string | null
          department: string | null
          manager_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string | null
          job_title?: string | null
          department?: string | null
          manager_name?: string | null
        }
        Update: {
          full_name?: string | null
          role?: string | null
          job_title?: string | null
          department?: string | null
          manager_name?: string | null
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
          check_in_type: 'daily' | 'weekly'
          prompt_used?: string | null
        }
        Update: {
          content?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
export type Summary = Database['public']['Tables']['summaries']['Row']
