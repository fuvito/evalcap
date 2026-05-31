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
          check_in_type: 'daily' | 'weekly'
          prompt_used?: string | null
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      evaluation_goals: {
        Row: {
          id: string
          user_id: string
          cycle_id: string | null
          title: string
          description: string | null
          status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          cycle_id?: string | null
          title: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
        }
        Update: {
          cycle_id?: string | null
          title?: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
        }
        Relationships: []
      }
      personal_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: 'promotion' | 'certification' | 'skill' | 'habit' | 'other' | null
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          description?: string | null
          category?: 'promotion' | 'certification' | 'skill' | 'habit' | 'other' | null
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          status?: 'active' | 'completed' | 'cancelled'
        }
        Update: {
          title?: string
          description?: string | null
          category?: 'promotion' | 'certification' | 'skill' | 'habit' | 'other' | null
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          status?: 'active' | 'completed' | 'cancelled'
        }
        Relationships: []
      }
      performance_cycles: {
        Row: {
          id: string
          user_id: string
          name: string
          start_date: string
          end_date: string
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          start_date: string
          end_date: string
          status?: 'active' | 'archived'
        }
        Update: {
          name?: string
          start_date?: string
          end_date?: string
          status?: 'active' | 'archived'
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
export type Profile          = Database['public']['Tables']['profiles']['Row']
export type JournalEntry     = Database['public']['Tables']['journal_entries']['Row']
export type Summary          = Database['public']['Tables']['summaries']['Row']
export type PerformanceCycle = Database['public']['Tables']['performance_cycles']['Row']
export type EvaluationGoal   = Database['public']['Tables']['evaluation_goals']['Row']
export type PersonalGoal     = Database['public']['Tables']['personal_goals']['Row']
