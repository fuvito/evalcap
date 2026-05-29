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
          role?: string | null
          job_title?: string | null
          department?: string | null
          manager_name?: string | null
          default_check_in_type?: 'daily' | 'weekly'
          onboarding_completed?: boolean
          status?: 'active' | 'suspended' | null
        }
        Update: {
          full_name?: string | null
          role?: string | null
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
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
export type Summary = Database['public']['Tables']['summaries']['Row']
export type PerformanceCycle = Database['public']['Tables']['performance_cycles']['Row']
