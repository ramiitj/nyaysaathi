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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          event_type: string
          id: string
          language: string | null
          legal_domain: string | null
          location_state: string | null
          metadata: Json | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          language?: string | null
          legal_domain?: string | null
          location_state?: string | null
          metadata?: Json | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          language?: string | null
          legal_domain?: string | null
          location_state?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          ip_hash: string | null
          language: string
          legal_domain: string | null
          location_city: string | null
          location_state: string | null
          message_count: number | null
          rating: number | null
          session_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          updated_at: string | null
          use_for_training: boolean | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          language?: string
          legal_domain?: string | null
          location_city?: string | null
          location_state?: string | null
          message_count?: number | null
          rating?: number | null
          session_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          use_for_training?: boolean | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          language?: string
          legal_domain?: string | null
          location_city?: string | null
          location_state?: string | null
          message_count?: number | null
          rating?: number | null
          session_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          use_for_training?: boolean | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "user_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          processed_at: string | null
          rules_extracted: Json | null
          status: Database["public"]["Enums"]["document_status"] | null
          topics_extracted: Json | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          processed_at?: string | null
          rules_extracted?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          topics_extracted?: Json | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          processed_at?: string | null
          rules_extracted?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          topics_extracted?: Json | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      legal_acts: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sections: Json | null
          short_name: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sections?: Json | null
          short_name?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sections?: Json | null
          short_name?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_url: string | null
          citations: Json | null
          confidence_score: number | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          audio_url?: string | null
          citations?: Json | null
          confidence_score?: number | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          audio_url?: string | null
          citations?: Json | null
          confidence_score?: number | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_hash: string | null
          level: Database["public"]["Enums"]["log_level"] | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_hash?: string | null
          level?: Database["public"]["Enums"]["log_level"] | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_hash?: string | null
          level?: Database["public"]["Enums"]["log_level"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_visitors: {
        Row: {
          created_at: string | null
          device_info: Json | null
          fingerprint_hash: string
          first_visit_at: string | null
          id: string
          ip_hash: string | null
          last_visit_at: string | null
          location_data: Json | null
          onboarding_complete: boolean | null
          updated_at: string | null
          visit_count: number | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          fingerprint_hash: string
          first_visit_at?: string | null
          id?: string
          ip_hash?: string | null
          last_visit_at?: string | null
          location_data?: Json | null
          onboarding_complete?: boolean | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          fingerprint_hash?: string
          first_visit_at?: string | null
          id?: string
          ip_hash?: string | null
          last_visit_at?: string | null
          location_data?: Json | null
          onboarding_complete?: boolean | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analytics_data: { Args: { days_back?: number }; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_documents: {
        Args: { match_count?: number; query_text: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      conversation_status: "open" | "resolved"
      document_status: "pending" | "processing" | "processed" | "failed"
      log_level: "info" | "warning" | "error"
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
      app_role: ["admin", "moderator", "user"],
      conversation_status: ["open", "resolved"],
      document_status: ["pending", "processing", "processed", "failed"],
      log_level: ["info", "warning", "error"],
    },
  },
} as const
