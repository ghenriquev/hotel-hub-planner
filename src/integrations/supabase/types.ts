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
      agent_configs: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          llm_model: string
          materials_config: string[]
          module_id: number
          module_title: string
          output_type: string | null
          prompt: string
          secondary_materials_config: number[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          llm_model?: string
          materials_config?: string[]
          module_id: number
          module_title: string
          output_type?: string | null
          prompt: string
          secondary_materials_config?: number[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          llm_model?: string
          materials_config?: string[]
          module_id?: number
          module_title?: string
          output_type?: string | null
          prompt?: string
          secondary_materials_config?: number[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_results: {
        Row: {
          created_at: string | null
          generated_at: string | null
          hotel_id: string
          id: string
          llm_model_used: string | null
          module_id: number
          presentation_status: string | null
          presentation_url: string | null
          result: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          hotel_id: string
          id?: string
          llm_model_used?: string | null
          module_id: number
          presentation_status?: string | null
          presentation_url?: string | null
          result?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          hotel_id?: string
          id?: string
          llm_model_used?: string | null
          module_id?: number
          presentation_status?: string | null
          presentation_url?: string | null
          result?: string | null
          status?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key_type: string
          name: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_type: string
          name: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_type?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gamma_settings: {
        Row: {
          additional_instructions: string | null
          card_dimensions: string | null
          card_split: string | null
          created_at: string | null
          format: string | null
          id: string
          image_model: string | null
          image_source: string | null
          image_style: string | null
          num_cards: number | null
          text_amount: string | null
          text_audience: string | null
          text_language: string | null
          text_mode: string | null
          text_tone: string | null
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          additional_instructions?: string | null
          card_dimensions?: string | null
          card_split?: string | null
          created_at?: string | null
          format?: string | null
          id?: string
          image_model?: string | null
          image_source?: string | null
          image_style?: string | null
          num_cards?: number | null
          text_amount?: string | null
          text_audience?: string | null
          text_language?: string | null
          text_mode?: string | null
          text_tone?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_instructions?: string | null
          card_dimensions?: string | null
          card_split?: string | null
          created_at?: string | null
          format?: string | null
          id?: string
          image_model?: string | null
          image_source?: string | null
          image_style?: string | null
          num_cards?: number | null
          text_amount?: string | null
          text_audience?: string | null
          text_language?: string | null
          text_mode?: string | null
          text_tone?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hotel_competitor_data: {
        Row: {
          analysis_status: string | null
          competitor_number: number
          competitor_url: string
          crawled_at: string | null
          crawled_content: Json | null
          created_at: string | null
          error_message: string | null
          generated_analysis: string | null
          hotel_id: string
          id: string
          llm_model_used: string | null
          manus_task_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_status?: string | null
          competitor_number: number
          competitor_url: string
          crawled_at?: string | null
          crawled_content?: Json | null
          created_at?: string | null
          error_message?: string | null
          generated_analysis?: string | null
          hotel_id: string
          id?: string
          llm_model_used?: string | null
          manus_task_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_status?: string | null
          competitor_number?: number
          competitor_url?: string
          crawled_at?: string | null
          crawled_content?: Json | null
          created_at?: string | null
          error_message?: string | null
          generated_analysis?: string | null
          hotel_id?: string
          id?: string
          llm_model_used?: string | null
          manus_task_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_competitor_data_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_manual_data: {
        Row: {
          access_credentials: Json | null
          accommodations: Json | null
          address: string | null
          ads_marketing: Json | null
          cnpj: string | null
          contractor_email: string | null
          contractor_name: string | null
          created_at: string | null
          current_step: number | null
          department_contacts: Json | null
          differentials: Json | null
          foundation_year: string | null
          gastronomy: Json | null
          hotel_id: string
          id: string
          input_method: string | null
          internet_info: Json | null
          is_complete: boolean | null
          legal_name: string | null
          leisure: Json | null
          mailing_submitted: boolean | null
          main_structure: string | null
          neighborhood: string | null
          other_social_media: string | null
          parking: Json | null
          policies: Json | null
          room_count: string | null
          site_info: Json | null
          state: string | null
          submitted_at: string | null
          updated_at: string | null
          uploaded_file_name: string | null
          uploaded_file_url: string | null
          witness_email: string | null
          witness_name: string | null
          zip_code: string | null
        }
        Insert: {
          access_credentials?: Json | null
          accommodations?: Json | null
          address?: string | null
          ads_marketing?: Json | null
          cnpj?: string | null
          contractor_email?: string | null
          contractor_name?: string | null
          created_at?: string | null
          current_step?: number | null
          department_contacts?: Json | null
          differentials?: Json | null
          foundation_year?: string | null
          gastronomy?: Json | null
          hotel_id: string
          id?: string
          input_method?: string | null
          internet_info?: Json | null
          is_complete?: boolean | null
          legal_name?: string | null
          leisure?: Json | null
          mailing_submitted?: boolean | null
          main_structure?: string | null
          neighborhood?: string | null
          other_social_media?: string | null
          parking?: Json | null
          policies?: Json | null
          room_count?: string | null
          site_info?: Json | null
          state?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          uploaded_file_name?: string | null
          uploaded_file_url?: string | null
          witness_email?: string | null
          witness_name?: string | null
          zip_code?: string | null
        }
        Update: {
          access_credentials?: Json | null
          accommodations?: Json | null
          address?: string | null
          ads_marketing?: Json | null
          cnpj?: string | null
          contractor_email?: string | null
          contractor_name?: string | null
          created_at?: string | null
          current_step?: number | null
          department_contacts?: Json | null
          differentials?: Json | null
          foundation_year?: string | null
          gastronomy?: Json | null
          hotel_id?: string
          id?: string
          input_method?: string | null
          internet_info?: Json | null
          is_complete?: boolean | null
          legal_name?: string | null
          leisure?: Json | null
          mailing_submitted?: boolean | null
          main_structure?: string | null
          neighborhood?: string | null
          other_social_media?: string | null
          parking?: Json | null
          policies?: Json | null
          room_count?: string | null
          site_info?: Json | null
          state?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          uploaded_file_name?: string | null
          uploaded_file_url?: string | null
          witness_email?: string | null
          witness_name?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_manual_data_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_manual_data_history: {
        Row: {
          changes: Json
          edit_type: string
          edited_at: string
          edited_by: string | null
          hotel_id: string
          hotel_manual_data_id: string
          id: string
          previous_values: Json | null
        }
        Insert: {
          changes?: Json
          edit_type?: string
          edited_at?: string
          edited_by?: string | null
          hotel_id: string
          hotel_manual_data_id: string
          id?: string
          previous_values?: Json | null
        }
        Update: {
          changes?: Json
          edit_type?: string
          edited_at?: string
          edited_by?: string | null
          hotel_id?: string
          hotel_manual_data_id?: string
          id?: string
          previous_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_manual_data_history_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_manual_data_history_hotel_manual_data_id_fkey"
            columns: ["hotel_manual_data_id"]
            isOneToOne: false
            referencedRelation: "hotel_manual_data"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_materials: {
        Row: {
          created_at: string | null
          file_name: string
          file_url: string
          hotel_id: string
          id: string
          material_type: string
          text_content: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_url: string
          hotel_id: string
          id?: string
          material_type: string
          text_content?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_url?: string
          hotel_id?: string
          id?: string
          material_type?: string
          text_content?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_materials_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_milestones: {
        Row: {
          created_at: string | null
          end_date: string
          end_week: number
          hotel_id: string
          id: string
          milestone_key: string
          name: string
          start_date: string
          start_week: number
        }
        Insert: {
          created_at?: string | null
          end_date: string
          end_week: number
          hotel_id: string
          id?: string
          milestone_key: string
          name: string
          start_date: string
          start_week: number
        }
        Update: {
          created_at?: string | null
          end_date?: string
          end_week?: number
          hotel_id?: string
          id?: string
          milestone_key?: string
          name?: string
          start_date?: string
          start_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "hotel_milestones_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_project_data: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          meeting_final_url: string | null
          meeting_kickoff_url: string | null
          meeting_phase1_url: string | null
          meeting_phase2_url: string | null
          phase1_presentation_url: string | null
          phase2_generated_at: string | null
          phase2_presentation_url: string | null
          phase2_status: string | null
          phase2_summary: string | null
          phase34_deliverables: Json | null
          phase5_generated_at: string | null
          phase5_presentation_url: string | null
          phase5_report: string | null
          phase5_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          meeting_final_url?: string | null
          meeting_kickoff_url?: string | null
          meeting_phase1_url?: string | null
          meeting_phase2_url?: string | null
          phase1_presentation_url?: string | null
          phase2_generated_at?: string | null
          phase2_presentation_url?: string | null
          phase2_status?: string | null
          phase2_summary?: string | null
          phase34_deliverables?: Json | null
          phase5_generated_at?: string | null
          phase5_presentation_url?: string | null
          phase5_report?: string | null
          phase5_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          meeting_final_url?: string | null
          meeting_kickoff_url?: string | null
          meeting_phase1_url?: string | null
          meeting_phase2_url?: string | null
          phase1_presentation_url?: string | null
          phase2_generated_at?: string | null
          phase2_presentation_url?: string | null
          phase2_status?: string | null
          phase2_summary?: string | null
          phase34_deliverables?: Json | null
          phase5_generated_at?: string | null
          phase5_presentation_url?: string | null
          phase5_report?: string | null
          phase5_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_project_data_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_reviews_data: {
        Row: {
          crawl_progress: number | null
          crawled_at: string | null
          created_at: string
          error_message: string | null
          hotel_id: string
          id: string
          items_collected: number | null
          progress_message: string | null
          reviews_count: number | null
          reviews_data: Json | null
          source: string
          source_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          crawl_progress?: number | null
          crawled_at?: string | null
          created_at?: string
          error_message?: string | null
          hotel_id: string
          id?: string
          items_collected?: number | null
          progress_message?: string | null
          reviews_count?: number | null
          reviews_data?: Json | null
          source: string
          source_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          crawl_progress?: number | null
          crawled_at?: string | null
          created_at?: string
          error_message?: string | null
          hotel_id?: string
          id?: string
          items_collected?: number | null
          progress_message?: string | null
          reviews_count?: number | null
          reviews_data?: Json | null
          source?: string
          source_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_reviews_data_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_website_data: {
        Row: {
          crawled_at: string | null
          crawled_content: Json | null
          created_at: string | null
          error_message: string | null
          hotel_id: string
          id: string
          status: string | null
          updated_at: string | null
          website_url: string
        }
        Insert: {
          crawled_at?: string | null
          crawled_content?: Json | null
          created_at?: string | null
          error_message?: string | null
          hotel_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          website_url: string
        }
        Update: {
          crawled_at?: string | null
          crawled_content?: Json | null
          created_at?: string | null
          error_message?: string | null
          hotel_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          website_url?: string
        }
        Relationships: []
      }
      hotels: {
        Row: {
          booking_url: string | null
          category: string | null
          city: string
          competitor_site_1: string | null
          competitor_site_2: string | null
          competitor_site_3: string | null
          contact: string | null
          created_at: string | null
          created_by: string | null
          decolar_url: string | null
          expedia_url: string | null
          google_business_url: string | null
          has_no_website: boolean | null
          id: string
          instagram_url: string | null
          manual_form_token: string | null
          name: string
          project_start_date: string | null
          slug: string | null
          tripadvisor_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          booking_url?: string | null
          category?: string | null
          city: string
          competitor_site_1?: string | null
          competitor_site_2?: string | null
          competitor_site_3?: string | null
          contact?: string | null
          created_at?: string | null
          created_by?: string | null
          decolar_url?: string | null
          expedia_url?: string | null
          google_business_url?: string | null
          has_no_website?: boolean | null
          id?: string
          instagram_url?: string | null
          manual_form_token?: string | null
          name: string
          project_start_date?: string | null
          slug?: string | null
          tripadvisor_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          booking_url?: string | null
          category?: string | null
          city?: string
          competitor_site_1?: string | null
          competitor_site_2?: string | null
          competitor_site_3?: string | null
          contact?: string | null
          created_at?: string | null
          created_by?: string | null
          decolar_url?: string | null
          expedia_url?: string | null
          google_business_url?: string | null
          has_no_website?: boolean | null
          id?: string
          instagram_url?: string | null
          manual_form_token?: string | null
          name?: string
          project_start_date?: string | null
          slug?: string | null
          tripadvisor_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      manual_form_template: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      research_settings: {
        Row: {
          competitor_crawler_type: string | null
          competitor_llm_model: string | null
          competitor_max_depth: number | null
          competitor_max_pages: number | null
          competitor_prompt: string | null
          created_at: string | null
          id: string
          reviews_max_months: number | null
          updated_at: string | null
          website_crawler_type: string | null
          website_max_depth: number | null
          website_max_pages: number | null
        }
        Insert: {
          competitor_crawler_type?: string | null
          competitor_llm_model?: string | null
          competitor_max_depth?: number | null
          competitor_max_pages?: number | null
          competitor_prompt?: string | null
          created_at?: string | null
          id?: string
          reviews_max_months?: number | null
          updated_at?: string | null
          website_crawler_type?: string | null
          website_max_depth?: number | null
          website_max_pages?: number | null
        }
        Update: {
          competitor_crawler_type?: string | null
          competitor_llm_model?: string | null
          competitor_max_depth?: number | null
          competitor_max_pages?: number | null
          competitor_prompt?: string | null
          created_at?: string | null
          id?: string
          reviews_max_months?: number | null
          updated_at?: string | null
          website_crawler_type?: string | null
          website_max_depth?: number | null
          website_max_pages?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_hotel_slug: { Args: { hotel_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
