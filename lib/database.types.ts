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
      ai_reports: {
        Row: {
          analysis: Json
          generated_at: string
          id: string
          metrics: Json
          model: string
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["report_period"]
          user_id: string
        }
        Insert: {
          analysis?: Json
          generated_at?: string
          id?: string
          metrics?: Json
          model: string
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["report_period"]
          user_id: string
        }
        Update: {
          analysis?: Json
          generated_at?: string
          id?: string
          metrics?: Json
          model?: string
          period_end?: string
          period_start?: string
          period_type?: Database["public"]["Enums"]["report_period"]
          user_id?: string
        }
        Relationships: []
      }
      free_trials: {
        Row: {
          card_label: string
          charge_date: string
          created_at: string
          duration_days: number
          id: string
          notes: string | null
          remind_one_day: boolean
          remind_two_days: boolean
          service_name: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_label: string
          charge_date: string
          created_at?: string
          duration_days: number
          id?: string
          notes?: string | null
          remind_one_day?: boolean
          remind_two_days?: boolean
          service_name: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_label?: string
          charge_date?: string
          created_at?: string
          duration_days?: number
          id?: string
          notes?: string | null
          remind_one_day?: boolean
          remind_two_days?: boolean
          service_name?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          active: boolean
          amount_cents: number
          category: string
          created_at: string
          due_day: number
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount_cents: number
          category: string
          created_at?: string
          due_day: number
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount_cents?: number
          category?: string
          created_at?: string
          due_day?: number
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          created_at: string
          id: string
          paid_date: string
          period_start: string
          recurring_expense_id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paid_date: string
          period_start: string
          recurring_expense_id: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paid_date?: string
          period_start?: string
          recurring_expense_id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_payments_recurring_expense_id_fkey"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          merchant: string | null
          notes: string | null
          recurring_expense_id: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          merchant?: string | null
          notes?: string | null
          recurring_expense_id?: string | null
          transaction_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          merchant?: string | null
          notes?: string | null
          recurring_expense_id?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_recurring_expense_id_fkey"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_notification_deliveries: {
        Row: {
          charge_date: string
          created_at: string
          free_trial_id: string
          id: string
          push_subscription_id: string
          reminder_days: number
          sent_at: string | null
          user_id: string
        }
        Insert: {
          charge_date: string
          created_at?: string
          free_trial_id: string
          id?: string
          push_subscription_id: string
          reminder_days: number
          sent_at?: string | null
          user_id: string
        }
        Update: {
          charge_date?: string
          created_at?: string
          free_trial_id?: string
          id?: string
          push_subscription_id?: string
          reminder_days?: number
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_notification_deliveries_free_trial_id_fkey"
            columns: ["free_trial_id"]
            isOneToOne: false
            referencedRelation: "free_trials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_notification_deliveries_push_subscription_id_fkey"
            columns: ["push_subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_analysis_enabled: boolean
          created_at: string
          currency: string
          daily_analysis_enabled: boolean
          monthly_analysis_enabled: boolean
          monthly_budget_cents: number | null
          starting_balance_cents: number
          timezone: string
          updated_at: string
          user_id: string
          weekly_analysis_enabled: boolean
        }
        Insert: {
          ai_analysis_enabled?: boolean
          created_at?: string
          currency?: string
          daily_analysis_enabled?: boolean
          monthly_analysis_enabled?: boolean
          monthly_budget_cents?: number | null
          starting_balance_cents?: number
          timezone?: string
          updated_at?: string
          user_id: string
          weekly_analysis_enabled?: boolean
        }
        Update: {
          ai_analysis_enabled?: boolean
          created_at?: string
          currency?: string
          daily_analysis_enabled?: boolean
          monthly_analysis_enabled?: boolean
          monthly_budget_cents?: number | null
          starting_balance_cents?: number
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_analysis_enabled?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_recurring_expense_paid: {
        Args: {
          p_paid_date?: string
          p_period_start: string
          p_recurring_expense_id: string
        }
        Returns: string
      }
    }
    Enums: {
      report_period: "daily" | "weekly" | "monthly"
      transaction_kind: "income" | "expense"
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
      report_period: ["daily", "weekly", "monthly"],
      transaction_kind: ["income", "expense"],
    },
  },
} as const
