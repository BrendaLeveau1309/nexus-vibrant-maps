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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      blood_requests: {
        Row: {
          blood_group: string
          closed_at: string | null
          code: string
          created_at: string
          establishment_id: string
          id: string
          patient_document: string
          patient_name: string
          requester_id: string | null
          rh_factor: string
          searching: boolean
          status: Database["public"]["Enums"]["request_status"]
          units_fulfilled: number
          units_required: number
          urgency: string
        }
        Insert: {
          blood_group: string
          closed_at?: string | null
          code: string
          created_at?: string
          establishment_id: string
          id?: string
          patient_document: string
          patient_name: string
          requester_id?: string | null
          rh_factor: string
          searching?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          units_fulfilled?: number
          units_required: number
          urgency: string
        }
        Update: {
          blood_group?: string
          closed_at?: string | null
          code?: string
          created_at?: string
          establishment_id?: string
          id?: string
          patient_document?: string
          patient_name?: string
          requester_id?: string | null
          rh_factor?: string
          searching?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          units_fulfilled?: number
          units_required?: number
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "health_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          blood_pressure: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          donor_id: string
          estimated_arrival: string | null
          fitness: string | null
          fitness_reason: string | null
          hemoglobin: number | null
          id: string
          pulse: number | null
          request_id: string
          status: Database["public"]["Enums"]["donation_status"]
        }
        Insert: {
          blood_pressure?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          donor_id: string
          estimated_arrival?: string | null
          fitness?: string | null
          fitness_reason?: string | null
          hemoglobin?: number | null
          id?: string
          pulse?: number | null
          request_id: string
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Update: {
          blood_pressure?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          donor_id?: string
          estimated_arrival?: string | null
          fitness?: string | null
          fitness_reason?: string | null
          hemoglobin?: number | null
          id?: string
          pulse?: number | null
          request_id?: string
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      health_establishments: {
        Row: {
          active: boolean
          address: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          active?: boolean
          address: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blood_group: string | null
          created_at: string
          document_number: string
          document_type: string
          donor_available: boolean
          donor_fitness: string
          email: string
          establishment_id: string | null
          first_names: string
          id: string
          last_names: string
          notifications: Json
          phone: string
          rh_factor: string | null
          updated_at: string
        }
        Insert: {
          blood_group?: string | null
          created_at?: string
          document_number: string
          document_type: string
          donor_available?: boolean
          donor_fitness?: string
          email: string
          establishment_id?: string | null
          first_names: string
          id: string
          last_names: string
          notifications?: Json
          phone: string
          rh_factor?: string | null
          updated_at?: string
        }
        Update: {
          blood_group?: string | null
          created_at?: string
          document_number?: string
          document_type?: string
          donor_available?: boolean
          donor_fitness?: string
          email?: string
          establishment_id?: string | null
          first_names?: string
          id?: string
          last_names?: string
          notifications?: Json
          phone?: string
          rh_factor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "health_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hospital_staff" | "user"
      donation_status:
        | "matching_aceptado"
        | "en_camino"
        | "en_establecimiento"
        | "en_tamizaje"
        | "donacion_realizada"
        | "exitosa"
        | "cancelada"
        | "no_concretada"
      request_status: "en_proceso" | "atendida" | "cancelada"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "hospital_staff", "user"],
      donation_status: [
        "matching_aceptado",
        "en_camino",
        "en_establecimiento",
        "en_tamizaje",
        "donacion_realizada",
        "exitosa",
        "cancelada",
        "no_concretada",
      ],
      request_status: ["en_proceso", "atendida", "cancelada"],
    },
  },
} as const
