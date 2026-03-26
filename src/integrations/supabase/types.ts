export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          has_openings: boolean
          id: string
          kanban_stage: string
          name: string
          notes: string | null
          plan_id: string
          relevance_score: number | null
          segment: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_openings?: boolean
          id?: string
          kanban_stage?: string
          name: string
          notes?: string | null
          plan_id: string
          relevance_score?: number | null
          segment: string
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_openings?: boolean
          id?: string
          kanban_stage?: string
          name?: string
          notes?: string | null
          plan_id?: string
          relevance_score?: number | null
          segment?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_mappings: {
        Row: {
          company: string | null
          created_at: string
          current_position: string | null
          id: string
          linkedin_url: string | null
          name: string
          notes: string | null
          plan_id: string
          status: string
          tier: string
          type: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          current_position?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          notes?: string | null
          plan_id: string
          status?: string
          tier?: string
          type?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          current_position?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          plan_id?: string
          status?: string
          tier?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_mappings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_documents: {
        Row: {
          extracted_text: string | null
          file_name: string
          file_url: string
          id: string
          plan_id: string
          type: string
          uploaded_at: string
        }
        Insert: {
          extracted_text?: string | null
          file_name: string
          file_url: string
          id?: string
          plan_id: string
          type: string
          uploaded_at?: string
        }
        Update: {
          extracted_text?: string | null
          file_name?: string
          file_url?: string
          id?: string
          plan_id?: string
          type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_documents_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      job_title_variations: {
        Row: {
          created_at: string
          id: string
          is_ai_generated: boolean
          plan_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          plan_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          plan_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_title_variations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_plans: {
        Row: {
          available_cities: Json | null
          city: string
          created_at: string
          current_area: string
          current_position: string
          current_situation: string
          general_notes: string | null
          id: string
          linkedin_goals: Json
          mentee_name: string
          region_preference: string
          state: string
          status: string
          target_positions: Json | null
          updated_at: string
          user_id: string
          wants_career_change: boolean
          work_model: string
        }
        Insert: {
          available_cities?: Json | null
          city: string
          created_at?: string
          current_area: string
          current_position: string
          current_situation?: string
          general_notes?: string | null
          id?: string
          linkedin_goals?: Json
          mentee_name: string
          region_preference?: string
          state: string
          status?: string
          target_positions?: Json | null
          updated_at?: string
          user_id: string
          wants_career_change?: boolean
          work_model?: string
        }
        Update: {
          available_cities?: Json | null
          city?: string
          created_at?: string
          current_area?: string
          current_position?: string
          current_situation?: string
          general_notes?: string | null
          id?: string
          linkedin_goals?: Json
          mentee_name?: string
          region_preference?: string
          state?: string
          status?: string
          target_positions?: Json | null
          updated_at?: string
          user_id?: string
          wants_career_change?: boolean
          work_model?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          created_at: string
          id: string
          is_ai_generated: boolean
          plan_id: string
          template: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          plan_id: string
          template: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          plan_id?: string
          template?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_access_tokens: {
        Row: {
          access_count: number
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          mentee_name: string | null
          plan_id: string
          token: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          mentee_name?: string | null
          plan_id: string
          token: string
        }
        Update: {
          access_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          mentee_name?: string | null
          plan_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_access_tokens_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_activities: {
        Row: {
          activity: string
          category: string
          completed_at: string | null
          created_at: string
          day_of_week: string
          id: string
          is_completed: boolean
          plan_id: string
          week_number: number
        }
        Insert: {
          activity: string
          category: string
          completed_at?: string | null
          created_at?: string
          day_of_week: string
          id?: string
          is_completed?: boolean
          plan_id: string
          week_number: number
        }
        Update: {
          activity?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          day_of_week?: string
          id?: string
          is_completed?: boolean
          plan_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_activities_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_plan: { Args: { plan_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
