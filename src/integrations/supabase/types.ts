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
      admin_users: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      agencies: {
        Row: {
          address: string | null
          admin_email: string | null
          admin_first_name: string | null
          admin_last_name: string | null
          admin_license: string | null
          admin_name: string | null
          admin_phone: string | null
          agency_name: string
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          license_number: string | null
          logo_url: string | null
          must_change_password: boolean | null
          postal_code: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          theme_config: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admin_email?: string | null
          admin_first_name?: string | null
          admin_last_name?: string | null
          admin_license?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          agency_name: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          must_change_password?: boolean | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          theme_config?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admin_email?: string | null
          admin_first_name?: string | null
          admin_last_name?: string | null
          admin_license?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          agency_name?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          must_change_password?: boolean | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          theme_config?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          appointment_time: string
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          appointment_time: string
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          appointment_time?: string
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "real_estate_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          agency_id: string | null
          cin: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          id_document_url: string | null
          last_name: string | null
          notifications_enabled: boolean | null
          phone_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          cin?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_url?: string | null
          last_name?: string | null
          notifications_enabled?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          cin?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_url?: string | null
          last_name?: string | null
          notifications_enabled?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          agency_id: string
          created_at: string
          email: string
          firstname: string | null
          id: string
          message: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          email: string
          firstname?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          email?: string
          firstname?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      demande_inscription: {
        Row: {
          address: string | null
          admin_email: string | null
          admin_license: string | null
          admin_name: string | null
          admin_phone: string | null
          agency_name: string
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          license_number: string | null
          logo_url: string | null
          password_hash: string | null
          postal_code: string | null
          primary_color: string | null
          rejection_reason: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["registration_status"] | null
          theme_config: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_email?: string | null
          admin_license?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          agency_name: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          password_hash?: string | null
          postal_code?: string | null
          primary_color?: string | null
          rejection_reason?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["registration_status"] | null
          theme_config?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_email?: string | null
          admin_license?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          agency_name?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          password_hash?: string | null
          postal_code?: string | null
          primary_color?: string | null
          rejection_reason?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["registration_status"] | null
          theme_config?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          client_cin: string | null
          client_id: string
          created_at: string
          document_url: string | null
          effective_end_date: string | null
          id: string
          property_id: string
          rental_end_date: string | null
          rental_start_date: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          client_cin?: string | null
          client_id: string
          created_at?: string
          document_url?: string | null
          effective_end_date?: string | null
          id?: string
          property_id: string
          rental_end_date?: string | null
          rental_start_date?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          client_cin?: string | null
          client_id?: string
          created_at?: string
          document_url?: string | null
          effective_end_date?: string | null
          id?: string
          property_id?: string
          rental_end_date?: string | null
          rental_start_date?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      proprietaire: {
        Row: {
          id: number
          prenom: string
          nom: string
          adresse: string | null
          numero_telephone: string | null
          adresse_email: string | null
        }
        Insert: {
          id?: number
          prenom: string
          nom: string
          adresse?: string | null
          numero_telephone?: string | null
          adresse_email?: string | null
        }
        Update: {
          id?: number
          prenom?: string
          nom?: string
          adresse?: string | null
          numero_telephone?: string | null
          adresse_email?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          agency_id: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          detailed_description: string | null
          id: string
          is_available: boolean | null
          is_furnished: boolean | null
          location_lat: number | null
          location_lng: number | null
          photos: string[] | null
          postal_code: string | null
          preview_description: string | null
          price: number
          property_condition: Database["public"]["Enums"]["property_condition"] | null
          property_offer_type: string | null
          property_status: Database["public"]["Enums"]["property_status"] | null
          property_type: string
          reference_number: string | null
          region: string | null
          surface_area: number | null
          title: string
          updated_at: string
          vefa_availability_date: string | null
          view_count: number | null
          virtual_tour_url: string | null
          year_built: number | null
          zone_id: number | null
          type_location: string | null
          proprio: number | null
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          detailed_description?: string | null
          id?: string
          is_available?: boolean | null
          is_furnished?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          photos?: string[] | null
          postal_code?: string | null
          preview_description?: string | null
          price?: number
          property_condition?: 
            | Database["public"]["Enums"]["property_condition"]
            | null
          property_offer_type?: string | null
          property_status?: 
            | Database["public"]["Enums"]["property_status"]
            | null
          property_type: string
          reference_number?: string | null
          region?: string | null
          surface_area?: number | null
          title: string
          updated_at?: string
          vefa_availability_date?: string | null
          view_count?: number | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zone_id?: number | null
          type_location?: string | null
          proprio?: number | null
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          detailed_description?: string | null
          id?: string
          is_available?: boolean | null
          is_furnished?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          photos?: string[] | null
          postal_code?: string | null
          preview_description?: string | null
          price?: number
          property_condition?: 
            | Database["public"]["Enums"]["property_condition"]
            | null
          property_offer_type?: string | null
          property_status?: 
            | Database["public"]["Enums"]["property_status"]
            | null
          property_type?: string
          reference_number?: string | null
          region?: string | null
          surface_area?: number | null
          title?: string
          updated_at?: string
          vefa_availability_date?: string | null
          view_count?: number | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zone_id?: number | null
          type_location?: string | null
          proprio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_agents: {
        Row: {
          agency_id: string | null
          created_at: string
          email: string | null
          id: string
          is_agency_head: boolean | null
          joined_date: string
          must_change_password: boolean | null
          position: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_agency_head?: boolean | null
          joined_date?: string
          must_change_password?: boolean | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_agency_head?: boolean | null
          joined_date?: string
          must_change_password?: boolean | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      region: {
        Row: {
          id: number
          nom: string
        }
        Insert: {
          id?: number
          nom: string
        }
        Update: {
          id?: number
          nom?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          agency_id: string
          appointment_date: string | null
          client_phone: string
          created_at: string
          id: string
          property_id: string
          rental_end_date: string | null
          rental_start_date: string | null
          reservation_number: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          appointment_date?: string | null
          client_phone: string
          created_at?: string
          id?: string
          property_id: string
          rental_end_date?: string | null
          rental_start_date?: string | null
          reservation_number: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          appointment_date?: string | null
          client_phone?: string
          created_at?: string
          id?: string
          property_id?: string
          rental_end_date?: string | null
          rental_start_date?: string | null
          reservation_number?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_criteria: {
        Row: {
          city: string | null
          client_id: string | null
          created_at: string
          id: string
          max_price: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_price: number | null
          min_surface_area: number | null
          notifications_enabled: boolean | null
          postal_code: string | null
          property_type: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          max_price?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          min_surface_area?: number | null
          notifications_enabled?: boolean | null
          postal_code?: string | null
          property_type?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          max_price?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          min_surface_area?: number | null
          notifications_enabled?: boolean | null
          postal_code?: string | null
          property_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_criteria_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      zone: {
        Row: {
          circle_radius: number | null
          created_at: string | null
          id: number
          latitude: number | null
          longitude: number | null
          nom: string
          region_id: number | null
        }
        Insert: {
          circle_radius?: number | null
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          nom: string
          region_id?: number | null
        }
        Update: {
          circle_radius?: number | null
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          nom?: string
          region_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_force_update_client: {
        Args: {
          p_client_id: string
          p_cin: string
          p_document_url: string
        }
        Returns: boolean
      }
      create_agency_user_and_profile: {
        Args: {
          email: string
          agency_name: string
          agency_slug: string
          license_number: string
          contact_phone: string
          address: string
          city: string
          postal_code: string
          logo_url: string
          primary_color: string
          secondary_color: string
        }
        Returns: string
      }
      generate_reservation_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_client_info: {
        Args: {
          client_id: string
          client_cin: string
          client_doc_url: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status: "RESERVEE" | "ACHETEE" | "ANNULEE"
      property_condition: "VEFA" | "NEUF" | "RENOVE" | "USAGE"
      property_status:
        | "DISPONIBLE"
        | "VENDUE"
        | "ARCHIVEE"
        | "OCCUPEE"
        | "RESERVEE"
      registration_status: "EN_ATTENTE" | "VALIDEE" | "REJETEE"
      theme_type: "LIGHT" | "DARK"
      user_role: "ADMIN" | "AGENCY" | "AGENT" | "CLIENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
