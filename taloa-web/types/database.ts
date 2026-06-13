// ════════════════════════════════════════════════════════════
// TALOA — Tipos do banco (gerados pelo Supabase)
// NAO editar a mao. Regenerar com:
//   supabase gen types typescript --project-id loopcoxvtboytwwjwoeg
// ════════════════════════════════════════════════════════════

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
      ai_conversations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          messages: Json | null
          session_id: string | null
          tag_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          session_id?: string | null
          tag_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          session_id?: string | null
          tag_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      found_reports: {
        Row: {
          created_at: string | null
          finder_phone: string | null
          found_area: string | null
          found_at: string | null
          id: string
          location_granted: boolean | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          photo_url: string | null
          status: string | null
          tag_code: string | null
        }
        Insert: {
          created_at?: string | null
          finder_phone?: string | null
          found_area?: string | null
          found_at?: string | null
          id?: string
          location_granted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photo_url?: string | null
          status?: string | null
          tag_code?: string | null
        }
        Update: {
          created_at?: string | null
          finder_phone?: string | null
          found_area?: string | null
          found_at?: string | null
          id?: string
          location_granted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photo_url?: string | null
          status?: string | null
          tag_code?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          commission_estimate: number | null
          created_at: string | null
          id: string
          notes: string | null
          owner_id: string | null
          partner_id: string | null
          pet_id: string | null
          service_type: string
          status: string | null
          tag_code: string | null
          updated_at: string | null
        }
        Insert: {
          commission_estimate?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          partner_id?: string | null
          pet_id?: string | null
          service_type: string
          status?: string | null
          tag_code?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_estimate?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          partner_id?: string | null
          pet_id?: string | null
          service_type?: string
          status?: string | null
          tag_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_seen_area: string | null
          last_seen_at: string | null
          pet_id: string | null
          photo_url: string | null
          status: string | null
          tag_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_seen_area?: string | null
          last_seen_at?: string | null
          pet_id?: string | null
          photo_url?: string | null
          status?: string | null
          tag_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_seen_area?: string | null
          last_seen_at?: string | null
          pet_id?: string | null
          photo_url?: string | null
          status?: string | null
          tag_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_profiles: {
        Row: {
          allergies: string | null
          behaviour: string | null
          created_at: string | null
          dislikes: string | null
          emergency_notes: string | null
          id: string
          likes: string | null
          medication: string | null
          pet_id: string | null
          private_notes: string | null
          public_notes: string | null
          show_email: boolean | null
          show_phone: boolean | null
          updated_at: string | null
          vet_name: string | null
          vet_phone: string | null
        }
        Insert: {
          allergies?: string | null
          behaviour?: string | null
          created_at?: string | null
          dislikes?: string | null
          emergency_notes?: string | null
          id?: string
          likes?: string | null
          medication?: string | null
          pet_id?: string | null
          private_notes?: string | null
          public_notes?: string | null
          show_email?: boolean | null
          show_phone?: boolean | null
          updated_at?: string | null
          vet_name?: string | null
          vet_phone?: string | null
        }
        Update: {
          allergies?: string | null
          behaviour?: string | null
          created_at?: string | null
          dislikes?: string | null
          emergency_notes?: string | null
          id?: string
          likes?: string | null
          medication?: string | null
          pet_id?: string | null
          private_notes?: string | null
          public_notes?: string | null
          show_email?: boolean | null
          show_phone?: boolean | null
          updated_at?: string | null
          vet_name?: string | null
          vet_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_profiles_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_years: number | null
          breed_or_morph: string | null
          colour: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          microchip: string | null
          name: string
          owner_id: string | null
          photo_url: string | null
          sex: string | null
          species: string
          updated_at: string | null
        }
        Insert: {
          age_years?: number | null
          breed_or_morph?: string | null
          colour?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          microchip?: string | null
          name: string
          owner_id?: string | null
          photo_url?: string | null
          sex?: string | null
          species?: string
          updated_at?: string | null
        }
        Update: {
          age_years?: number | null
          breed_or_morph?: string | null
          colour?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          microchip?: string | null
          name?: string
          owner_id?: string | null
          photo_url?: string | null
          sex?: string | null
          species?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          action_taken: string | null
          id: string
          ip_hash: string | null
          location_granted: boolean | null
          location_lat: number | null
          location_lng: number | null
          scanned_at: string | null
          tag_code: string
          user_agent: string | null
        }
        Insert: {
          action_taken?: string | null
          id?: string
          ip_hash?: string | null
          location_granted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          scanned_at?: string | null
          tag_code: string
          user_agent?: string | null
        }
        Update: {
          action_taken?: string | null
          id?: string
          ip_hash?: string | null
          location_granted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          scanned_at?: string | null
          tag_code?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          activated_at: string | null
          batch_id: string | null
          created_at: string | null
          id: string
          owner_id: string | null
          pet_id: string | null
          status: string
          tag_code: string
          tag_type: string | null
          tag_url: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          batch_id?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string | null
          pet_id?: string | null
          status?: string
          tag_code: string
          tag_type?: string | null
          tag_url: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          batch_id?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string | null
          pet_id?: string | null
          status?: string
          tag_code?: string
          tag_type?: string | null
          tag_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address_private: string | null
          created_at: string | null
          eircode_private: string | null
          email: string
          emergency_phone: string | null
          gdpr_consent: boolean | null
          gdpr_consent_at: string | null
          id: string
          name: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          address_private?: string | null
          created_at?: string | null
          eircode_private?: string | null
          email: string
          emergency_phone?: string | null
          gdpr_consent?: boolean | null
          gdpr_consent_at?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          address_private?: string | null
          created_at?: string | null
          eircode_private?: string | null
          email?: string
          emergency_phone?: string | null
          gdpr_consent?: boolean | null
          gdpr_consent_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vet_clinics: {
        Row: {
          address: string | null
          area: string | null
          created_at: string | null
          emergency_24h: boolean | null
          hours: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          name: string
          notes: string | null
          phone: string
          species_supported: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          emergency_24h?: boolean | null
          hours?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name: string
          notes?: string | null
          phone: string
          species_supported?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          emergency_24h?: boolean | null
          hours?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          species_supported?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
