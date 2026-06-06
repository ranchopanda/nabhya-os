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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          category: string | null
          created_at: string
          date_applied: string | null
          id: string
          name: string
          organizer: string | null
          remarks: string | null
          result: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          date_applied?: string | null
          id?: string
          name: string
          organizer?: string | null
          remarks?: string | null
          result?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          date_applied?: string | null
          id?: string
          name?: string
          organizer?: string | null
          remarks?: string | null
          result?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_posts: {
        Row: {
          comments: number | null
          created_at: string
          format: string | null
          id: string
          likes: number | null
          platform: string
          publish_date: string | null
          reach: number | null
          saves: number | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          comments?: number | null
          created_at?: string
          format?: string | null
          id?: string
          likes?: number | null
          platform: string
          publish_date?: string | null
          reach?: number | null
          saves?: number | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          comments?: number | null
          created_at?: string
          format?: string | null
          id?: string
          likes?: number | null
          platform?: string
          publish_date?: string | null
          reach?: number | null
          saves?: number | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          category: string | null
          company: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          designation: string | null
          email: string | null
          follow_up_date: string | null
          id: string
          next_action: string | null
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          designation?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          next_action?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          designation?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          next_action?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          occurred_on: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          occurred_on: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          occurred_on?: string
          title?: string
        }
        Relationships: []
      }
      pilots: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          kpis: string | null
          name: string
          objectives: string | null
          organization: string | null
          progress: number
          results: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          kpis?: string | null
          name: string
          objectives?: string | null
          organization?: string | null
          progress?: number
          results?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          kpis?: string | null
          name?: string
          objectives?: string | null
          organization?: string | null
          progress?: number
          results?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_updates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          feature: string
          id: string
          impact: string | null
          occurred_on: string
          owner_name: string | null
          problem_solved: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature: string
          id?: string
          impact?: string | null
          occurred_on?: string
          owner_name?: string | null
          problem_solved?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature?: string
          id?: string
          impact?: string | null
          occurred_on?: string
          owner_name?: string | null
          problem_solved?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proof_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          kind: string
          mime_type: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          current_focus: string | null
          id: string
          linkedin: string | null
          name: string
          responsibilities: string | null
          role: string | null
          skills: string | null
          updated_at: string
          user_id: string | null
          wins_this_month: string | null
        }
        Insert: {
          created_at?: string
          current_focus?: string | null
          id?: string
          linkedin?: string | null
          name: string
          responsibilities?: string | null
          role?: string | null
          skills?: string | null
          updated_at?: string
          user_id?: string | null
          wins_this_month?: string | null
        }
        Update: {
          created_at?: string
          current_focus?: string | null
          id?: string
          linkedin?: string | null
          name?: string
          responsibilities?: string | null
          role?: string | null
          skills?: string | null
          updated_at?: string
          user_id?: string | null
          wins_this_month?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "founder" | "team" | "investor"
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
    Enums: {
      app_role: ["founder", "team", "investor"],
    },
  },
} as const
