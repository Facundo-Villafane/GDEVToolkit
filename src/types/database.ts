// Tipos generados para Supabase - actualizar con `supabase gen types`
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'user' | 'pro' | 'admin'
          xp_total: number
          xp_level: number
          preferred_engine: string | null
          preferred_genres: string[] | null
          timezone: string | null
          onboarding_completed: boolean
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'pro' | 'admin'
          xp_total?: number
          xp_level?: number
          preferred_engine?: string | null
          preferred_genres?: string[] | null
          timezone?: string | null
          onboarding_completed?: boolean
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'pro' | 'admin'
          xp_total?: number
          xp_level?: number
          preferred_engine?: string | null
          preferred_genres?: string[] | null
          timezone?: string | null
          onboarding_completed?: boolean
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string
          icon: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          icon?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          icon?: string | null
          description?: string | null
          created_at?: string
        }
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          level: 'novice' | 'intermediate' | 'advanced' | 'expert'
          endorsed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          level?: 'novice' | 'intermediate' | 'advanced' | 'expert'
          endorsed_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
          level?: 'novice' | 'intermediate' | 'advanced' | 'expert'
          endorsed_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          thumbnail_url: string | null
          status: 'draft' | 'active' | 'completed' | 'archived'
          is_jam_project: boolean
          jam_name: string | null
          jam_theme: string | null
          jam_start_date: string | null
          jam_end_date: string | null
          jam_total_hours: number | null
          engine: string | null
          genre: string | null
          art_style: string | null
          scope_score: number | null
          risk_level: 'green' | 'yellow' | 'red' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          thumbnail_url?: string | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          is_jam_project?: boolean
          jam_name?: string | null
          jam_theme?: string | null
          jam_start_date?: string | null
          jam_end_date?: string | null
          jam_total_hours?: number | null
          engine?: string | null
          genre?: string | null
          art_style?: string | null
          scope_score?: number | null
          risk_level?: 'green' | 'yellow' | 'red' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          is_jam_project?: boolean
          jam_name?: string | null
          jam_theme?: string | null
          jam_start_date?: string | null
          jam_end_date?: string | null
          jam_total_hours?: number | null
          engine?: string | null
          genre?: string | null
          art_style?: string | null
          scope_score?: number | null
          risk_level?: 'green' | 'yellow' | 'red' | null
          created_at?: string
          updated_at?: string
        }
      }
      project_contexts: {
        Row: {
          id: string
          project_id: string
          gdd: Json
          scope_report: Json
          oracle_concepts: Json
          ai_preferences: Json
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          gdd?: Json
          scope_report?: Json
          oracle_concepts?: Json
          ai_preferences?: Json
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          gdd?: Json
          scope_report?: Json
          oracle_concepts?: Json
          ai_preferences?: Json
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_to: string | null
          role_required: string | null
          estimated_hours: number | null
          actual_hours: number | null
          is_ai_generated: boolean
          ai_suggestion: string | null
          ai_risk_flag: boolean
          position: number
          parent_task_id: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          role_required?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          is_ai_generated?: boolean
          ai_suggestion?: string | null
          ai_risk_flag?: boolean
          position?: number
          parent_task_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          role_required?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          is_ai_generated?: boolean
          ai_suggestion?: string | null
          ai_risk_flag?: boolean
          position?: number
          parent_task_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          project_id: string
          name: string
          type: 'sprite' | 'model_3d' | 'audio' | 'music' | 'ui' | 'animation' | 'shader' | 'other'
          description: string | null
          technical_spec: Json
          ai_prompt: string | null
          style_reference: string | null
          is_completed: boolean
          assigned_to: string | null
          is_mvp: boolean
          priority: 'low' | 'medium' | 'high' | 'critical'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: 'sprite' | 'model_3d' | 'audio' | 'music' | 'ui' | 'animation' | 'shader' | 'other'
          description?: string | null
          technical_spec?: Json
          ai_prompt?: string | null
          style_reference?: string | null
          is_completed?: boolean
          assigned_to?: string | null
          is_mvp?: boolean
          priority?: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: 'sprite' | 'model_3d' | 'audio' | 'music' | 'ui' | 'animation' | 'shader' | 'other'
          description?: string | null
          technical_spec?: Json
          ai_prompt?: string | null
          style_reference?: string | null
          is_completed?: boolean
          assigned_to?: string | null
          is_mvp?: boolean
          priority?: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
