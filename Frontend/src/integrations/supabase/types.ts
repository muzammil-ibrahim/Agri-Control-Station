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
      alerts: {
        Row: {
          created_at: string
          id: number
          message: string
          resolved: boolean
          severity: string
          task_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          resolved?: boolean
          severity?: string
          task_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          resolved?: boolean
          severity?: string
          task_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_log_tags: {
        Row: {
          crop_log_id: number
          log_tag_id: number
        }
        Insert: {
          crop_log_id: number
          log_tag_id: number
        }
        Update: {
          crop_log_id?: number
          log_tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "crop_log_tags_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_log_tags_log_tag_id_fkey"
            columns: ["log_tag_id"]
            isOneToOne: false
            referencedRelation: "log_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_logs: {
        Row: {
          crop_season_id: number | null
          field_id: number
          id: number
          is_auto_generated: boolean
          log_type: string
          logged_at: string
          logged_by: string | null
          notes: string | null
          task_execution_id: number | null
          title: string
        }
        Insert: {
          crop_season_id?: number | null
          field_id: number
          id?: number
          is_auto_generated?: boolean
          log_type: string
          logged_at?: string
          logged_by?: string | null
          notes?: string | null
          task_execution_id?: number | null
          title: string
        }
        Update: {
          crop_season_id?: number | null
          field_id?: number
          id?: number
          is_auto_generated?: boolean
          log_type?: string
          logged_at?: string
          logged_by?: string | null
          notes?: string | null
          task_execution_id?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_logs_crop_season_id_fkey"
            columns: ["crop_season_id"]
            isOneToOne: false
            referencedRelation: "crop_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_logs_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_logs_task_execution_id_fkey"
            columns: ["task_execution_id"]
            isOneToOne: false
            referencedRelation: "task_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_seasons: {
        Row: {
          actual_harvest_date: string | null
          crop_type: string
          expected_harvest: string | null
          field_id: number
          growth_stage: string | null
          id: number
          sowing_date: string | null
          status: string
          variety: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          crop_type: string
          expected_harvest?: string | null
          field_id: number
          growth_stage?: string | null
          id?: number
          sowing_date?: string | null
          status?: string
          variety?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          crop_type?: string
          expected_harvest?: string | null
          field_id?: number
          growth_stage?: string | null
          id?: number
          sowing_date?: string | null
          status?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_seasons_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_records: {
        Row: {
          crop_log_id: number
          disease_name: string | null
          id: number
          severity: string | null
          spread_pct: number | null
          spread_rate: string | null
          symptoms: string | null
          treatment_done: boolean
        }
        Insert: {
          crop_log_id: number
          disease_name?: string | null
          id?: number
          severity?: string | null
          spread_pct?: number | null
          spread_rate?: string | null
          symptoms?: string | null
          treatment_done?: boolean
        }
        Update: {
          crop_log_id?: number
          disease_name?: string | null
          id?: number
          severity?: string | null
          spread_pct?: number | null
          spread_rate?: string | null
          symptoms?: string | null
          treatment_done?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "disease_records_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          created_at: string
          geo_file_url: string | null
          id: number
          name: string
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          geo_file_url?: string | null
          id?: number
          name: string
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          geo_file_url?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      fields: {
        Row: {
          area_hectares: number | null
          created_at: string
          farm_id: number
          id: number
          name: string
          soil_type: string | null
        }
        Insert: {
          area_hectares?: number | null
          created_at?: string
          farm_id: number
          id?: number
          name: string
          soil_type?: string | null
        }
        Update: {
          area_hectares?: number | null
          created_at?: string
          farm_id?: number
          id?: number
          name?: string
          soil_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fields_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_points: {
        Row: {
          field_id: number
          id: number
          lat: number
          lng: number
          sequence_order: number
        }
        Insert: {
          field_id: number
          id?: number
          lat: number
          lng: number
          sequence_order: number
        }
        Update: {
          field_id?: number
          id?: number
          lat?: number
          lng?: number
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "geo_points_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_observations: {
        Row: {
          bbch_stage: string | null
          canopy_cover_pct: number | null
          crop_log_id: number
          id: number
          leaf_count: number | null
          plant_height_cm: number | null
          vigor_rating: string | null
        }
        Insert: {
          bbch_stage?: string | null
          canopy_cover_pct?: number | null
          crop_log_id: number
          id?: number
          leaf_count?: number | null
          plant_height_cm?: number | null
          vigor_rating?: string | null
        }
        Update: {
          bbch_stage?: string | null
          canopy_cover_pct?: number | null
          crop_log_id?: number
          id?: number
          leaf_count?: number | null
          plant_height_cm?: number | null
          vigor_rating?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_observations_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      harvest_records: {
        Row: {
          crop_log_id: number
          harvested_area_ha: number | null
          id: number
          moisture_content_pct: number | null
          notes: string | null
          quality_grade: string | null
          storage_location: string | null
          yield_kg: number | null
          yield_per_ha: number | null
        }
        Insert: {
          crop_log_id: number
          harvested_area_ha?: number | null
          id?: number
          moisture_content_pct?: number | null
          notes?: string | null
          quality_grade?: string | null
          storage_location?: string | null
          yield_kg?: number | null
          yield_per_ha?: number | null
        }
        Update: {
          crop_log_id?: number
          harvested_area_ha?: number | null
          id?: number
          moisture_content_pct?: number | null
          notes?: string | null
          quality_grade?: string | null
          storage_location?: string | null
          yield_kg?: number | null
          yield_per_ha?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_records_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_media: {
        Row: {
          caption: string | null
          crop_log_id: number
          file_url: string
          id: number
          media_type: string | null
          uploaded_at: string
        }
        Insert: {
          caption?: string | null
          crop_log_id: number
          file_url: string
          id?: number
          media_type?: string | null
          uploaded_at?: string
        }
        Update: {
          caption?: string | null
          crop_log_id?: number
          file_url?: string
          id?: number
          media_type?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_media_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_tags: {
        Row: {
          color: string | null
          id: number
          name: string
        }
        Insert: {
          color?: string | null
          id?: number
          name: string
        }
        Update: {
          color?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      pest_records: {
        Row: {
          affected_area_pct: number | null
          crop_log_id: number
          id: number
          pest_category: string | null
          pest_name: string | null
          recommended_action: string | null
          severity: string | null
          treatment_done: boolean
        }
        Insert: {
          affected_area_pct?: number | null
          crop_log_id: number
          id?: number
          pest_category?: string | null
          pest_name?: string | null
          recommended_action?: string | null
          severity?: string | null
          treatment_done?: boolean
        }
        Update: {
          affected_area_pct?: number | null
          crop_log_id?: number
          id?: number
          pest_category?: string | null
          pest_name?: string | null
          recommended_action?: string | null
          severity?: string | null
          treatment_done?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pest_records_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          field_id: number | null
          id: number
          reading_type: string
          recorded_at: string
          unit: string | null
          value: number | null
          vehicle_id: number
        }
        Insert: {
          field_id?: number | null
          id?: number
          reading_type: string
          recorded_at?: string
          unit?: string | null
          value?: number | null
          vehicle_id: number
        }
        Update: {
          field_id?: number | null
          id?: number
          reading_type?: string
          recorded_at?: string
          unit?: string | null
          value?: number | null
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      soil_tests: {
        Row: {
          crop_log_id: number
          ec_ds_per_m: number | null
          id: number
          moisture_pct: number | null
          nitrogen_ppm: number | null
          organic_matter_pct: number | null
          ph: number | null
          phosphorus_ppm: number | null
          potassium_ppm: number | null
          temp_celsius: number | null
        }
        Insert: {
          crop_log_id: number
          ec_ds_per_m?: number | null
          id?: number
          moisture_pct?: number | null
          nitrogen_ppm?: number | null
          organic_matter_pct?: number | null
          ph?: number | null
          phosphorus_ppm?: number | null
          potassium_ppm?: number | null
          temp_celsius?: number | null
        }
        Update: {
          crop_log_id?: number
          ec_ds_per_m?: number | null
          id?: number
          moisture_pct?: number | null
          nitrogen_ppm?: number | null
          organic_matter_pct?: number | null
          ph?: number | null
          phosphorus_ppm?: number | null
          potassium_ppm?: number | null
          temp_celsius?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soil_tests_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      task_executions: {
        Row: {
          actual_quantity: number | null
          completed_at: string | null
          failure_reason: string | null
          id: number
          outcome: string | null
          started_at: string | null
          task_id: number
          unit: string | null
          vehicle_id: number | null
        }
        Insert: {
          actual_quantity?: number | null
          completed_at?: string | null
          failure_reason?: string | null
          id?: number
          outcome?: string | null
          started_at?: string | null
          task_id: number
          unit?: string | null
          vehicle_id?: number | null
        }
        Update: {
          actual_quantity?: number | null
          completed_at?: string | null
          failure_reason?: string | null
          id?: number
          outcome?: string | null
          started_at?: string | null
          task_id?: number
          unit?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_executions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_executions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string | null
          field_id: number
          id: number
          recurrence_rule: string | null
          scheduled_at: string | null
          status: string
          target_quantity: number | null
          task_type: string
          unit: string | null
          vehicle_id: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_id: number
          id?: number
          recurrence_rule?: string | null
          scheduled_at?: string | null
          status?: string
          target_quantity?: number | null
          task_type: string
          unit?: string | null
          vehicle_id?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_id?: number
          id?: number
          recurrence_rule?: string | null
          scheduled_at?: string | null
          status?: string
          target_quantity?: number | null
          task_type?: string
          unit?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_records: {
        Row: {
          application_method: string | null
          applied_by: string | null
          crop_log_id: number
          dose_per_ha: number | null
          id: number
          product_name: string | null
          total_quantity: number | null
          treatment_type: string | null
          unit: string | null
          weather_conditions: string | null
        }
        Insert: {
          application_method?: string | null
          applied_by?: string | null
          crop_log_id: number
          dose_per_ha?: number | null
          id?: number
          product_name?: string | null
          total_quantity?: number | null
          treatment_type?: string | null
          unit?: string | null
          weather_conditions?: string | null
        }
        Update: {
          application_method?: string | null
          applied_by?: string | null
          crop_log_id?: number
          dose_per_ha?: number | null
          id?: number
          product_name?: string | null
          total_quantity?: number | null
          treatment_type?: string | null
          unit?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_records_crop_log_id_fkey"
            columns: ["crop_log_id"]
            isOneToOne: false
            referencedRelation: "crop_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_resources: {
        Row: {
          capacity: number | null
          current_level: number | null
          id: number
          resource_type: string
          unit: string | null
          updated_at: string
          vehicle_id: number
        }
        Insert: {
          capacity?: number | null
          current_level?: number | null
          id?: number
          resource_type: string
          unit?: string | null
          updated_at?: string
          vehicle_id: number
        }
        Update: {
          capacity?: number | null
          current_level?: number | null
          id?: number
          resource_type?: string
          unit?: string | null
          updated_at?: string
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_resources_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          battery_pct: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: number
          last_seen: string | null
          model: string | null
          name: string
          speed_kmh: number | null
          status: string
        }
        Insert: {
          battery_pct?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: number
          last_seen?: string | null
          model?: string | null
          name: string
          speed_kmh?: number | null
          status?: string
        }
        Update: {
          battery_pct?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: number
          last_seen?: string | null
          model?: string | null
          name?: string
          speed_kmh?: number | null
          status?: string
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
