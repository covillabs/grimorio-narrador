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
      items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          owner_id: string | null
          owner_type: string | null
          rules_bonus: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          owner_id?: string | null
          owner_type?: string | null
          rules_bonus?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string | null
          owner_type?: string | null
          rules_bonus?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          controller_npc_id: string | null
          created_at: string
          description_public: string | null
          id: string
          image_url: string | null
          master_secrets: string | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          controller_npc_id?: string | null
          created_at?: string
          description_public?: string | null
          id?: string
          image_url?: string | null
          master_secrets?: string | null
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          controller_npc_id?: string | null
          created_at?: string
          description_public?: string | null
          id?: string
          image_url?: string | null
          master_secrets?: string | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_controller_npc_id_fkey"
            columns: ["controller_npc_id"]
            isOneToOne: false
            referencedRelation: "npcs"
            referencedColumns: ["id"]
          },
        ]
      }
      myth_discoveries: {
        Row: {
          discovered_at: string
          id: string
          myth_id: string
          player_id: string
        }
        Insert: {
          discovered_at?: string
          id?: string
          myth_id: string
          player_id: string
        }
        Update: {
          discovered_at?: string
          id?: string
          myth_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "myth_discoveries_myth_id_fkey"
            columns: ["myth_id"]
            isOneToOne: false
            referencedRelation: "myths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "myth_discoveries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      myths: {
        Row: {
          created_at: string
          hidden_truth: string | null
          id: string
          mortal_vision: string | null
          supernatural_vision: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hidden_truth?: string | null
          id?: string
          mortal_vision?: string | null
          supernatural_vision?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hidden_truth?: string | null
          id?: string
          mortal_vision?: string | null
          supernatural_vision?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      npcs: {
        Row: {
          appearance: string | null
          blood_potency: number | null
          clan: string | null
          created_at: string
          disciplines: string | null
          health: number | null
          history: string | null
          id: string
          image_url: string | null
          master_secrets: string | null
          mental_pool: number | null
          motivations: string | null
          name: string
          physical_pool: number | null
          social_pool: number | null
          specialties: string | null
          species_faction: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appearance?: string | null
          blood_potency?: number | null
          clan?: string | null
          created_at?: string
          disciplines?: string | null
          health?: number | null
          history?: string | null
          id?: string
          image_url?: string | null
          master_secrets?: string | null
          mental_pool?: number | null
          motivations?: string | null
          name: string
          physical_pool?: number | null
          social_pool?: number | null
          specialties?: string | null
          species_faction?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appearance?: string | null
          blood_potency?: number | null
          clan?: string | null
          created_at?: string
          disciplines?: string | null
          health?: number | null
          history?: string | null
          id?: string
          image_url?: string | null
          master_secrets?: string | null
          mental_pool?: number | null
          motivations?: string | null
          name?: string
          physical_pool?: number | null
          social_pool?: number | null
          specialties?: string | null
          species_faction?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_touchstones: {
        Row: {
          description: string | null
          id: string
          npc_id: string
          player_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          npc_id: string
          player_id: string
        }
        Update: {
          description?: string | null
          id?: string
          npc_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_touchstones_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_touchstones_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          character_name: string
          clan: string | null
          created_at: string
          disciplines: string | null
          embrace_story: string | null
          flaws: string | null
          generation: number | null
          health_current: number
          health_max: number
          human_history: string | null
          humanity: number
          hunger: number
          id: string
          image_url: string | null
          merits: string | null
          player_name: string | null
          sire: string | null
          updated_at: string
          willpower_current: number
          willpower_max: number
        }
        Insert: {
          character_name: string
          clan?: string | null
          created_at?: string
          disciplines?: string | null
          embrace_story?: string | null
          flaws?: string | null
          generation?: number | null
          health_current?: number
          health_max?: number
          human_history?: string | null
          humanity?: number
          hunger?: number
          id?: string
          image_url?: string | null
          merits?: string | null
          player_name?: string | null
          sire?: string | null
          updated_at?: string
          willpower_current?: number
          willpower_max?: number
        }
        Update: {
          character_name?: string
          clan?: string | null
          created_at?: string
          disciplines?: string | null
          embrace_story?: string | null
          flaws?: string | null
          generation?: number | null
          health_current?: number
          health_max?: number
          human_history?: string | null
          humanity?: number
          hunger?: number
          id?: string
          image_url?: string | null
          merits?: string | null
          player_name?: string | null
          sire?: string | null
          updated_at?: string
          willpower_current?: number
          willpower_max?: number
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          id: string
          relationship_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_type?: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship_type?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      session_mentions: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          session_id: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          session_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_mentions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          session_date: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          summary?: string | null
          title?: string
          updated_at?: string
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
