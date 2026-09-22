// Auto-generated from the Supabase schema.
// Regenerate with: pnpm supabase:types  (see app/README.md)
// Do not edit by hand.

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
      accounts: {
        Row: {
          created_at: string
          currency: string
          id: string
          initial_balance: number
          kind: Database["public"]["Enums"]["account_kind"]
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          initial_balance?: number
          kind?: Database["public"]["Enums"]["account_kind"]
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          initial_balance?: number
          kind?: Database["public"]["Enums"]["account_kind"]
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          related_id: string | null
          related_type: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          related_id?: string | null
          related_type?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          related_id?: string | null
          related_type?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          period_month: string
          planned_amount: number
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_month: string
          planned_amount?: number
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_month?: string
          planned_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          default_currency: string
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["client_kind"]
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          default_currency?: string
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          default_currency?: string
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          created_at: string
          default_currency: string
          default_vat_rate: number
          iban: string | null
          id: string
          invoice_footer: string | null
          owner_name: string
          reserve_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          default_currency?: string
          default_vat_rate?: number
          iban?: string | null
          id?: string
          invoice_footer?: string | null
          owner_name: string
          reserve_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          default_currency?: string
          default_vat_rate?: number
          iban?: string | null
          id?: string
          invoice_footer?: string | null
          owner_name?: string
          reserve_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string
          estimated_amount: number
          expected_payment_date: string | null
          expected_signature_date: string | null
          id: string
          lost_reason: string | null
          notes: string | null
          probability: number
          source: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          user_id: string
          won_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string
          estimated_amount?: number
          expected_payment_date?: string | null
          expected_signature_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          user_id: string
          won_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string
          estimated_amount?: number
          expected_payment_date?: string | null
          expected_signature_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          user_id?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          billable: boolean
          category_id: string | null
          created_at: string
          currency: string
          date: string
          description: string | null
          id: string
          link_id: string | null
          link_type: Database["public"]["Enums"]["expense_link_type"]
          receipt_url: string | null
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          amount: number
          billable?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          id?: string
          link_id?: string | null
          link_type?: Database["public"]["Enums"]["expense_link_type"]
          receipt_url?: string | null
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          amount?: number
          billable?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          id?: string
          link_id?: string | null
          link_type?: Database["public"]["Enums"]["expense_link_type"]
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number | null
          unit_price: number
          vat_rate: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number | null
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number | null
          unit_price?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_on: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_on?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string
          currency: string
          due_date: string
          id: string
          issued_at: string
          last_reminded_at: string | null
          notes: string | null
          number: string
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
          vat_amount: number
        }
        Insert: {
          amount_paid?: number
          client_id: string
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          issued_at?: string
          last_reminded_at?: string | null
          notes?: string | null
          number: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
          vat_amount?: number
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          issued_at?: string
          last_reminded_at?: string | null
          notes?: string | null
          number?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          billable_rate: number
          cost_rate: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          weekly_capacity_hours: number
        }
        Insert: {
          billable_rate?: number
          cost_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
          weekly_capacity_hours?: number
        }
        Update: {
          billable_rate?: number
          cost_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          weekly_capacity_hours?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          billing_type: Database["public"]["Enums"]["project_billing_type"]
          budget_hours: number | null
          client_id: string
          created_at: string
          currency: string
          deal_id: string | null
          description: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          internal_budget: number
          name: string
          notes: string | null
          sold_budget: number
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_type?: Database["public"]["Enums"]["project_billing_type"]
          budget_hours?: number | null
          client_id: string
          created_at?: string
          currency?: string
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          internal_budget?: number
          name: string
          notes?: string | null
          sold_budget?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["project_billing_type"]
          budget_hours?: number | null
          client_id?: string
          created_at?: string
          currency?: string
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          internal_budget?: number
          name?: string
          notes?: string | null
          sold_budget?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_lines: {
        Row: {
          description: string
          id: string
          quantity: number
          quote_id: string
          total: number | null
          unit_price: number
          vat_rate: number
        }
        Insert: {
          description: string
          id?: string
          quantity?: number
          quote_id: string
          total?: number | null
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          total?: number | null
          unit_price?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_id: string
          converted_invoice_id: string | null
          created_at: string
          currency: string
          deal_id: string | null
          declined_at: string | null
          id: string
          issued_at: string
          notes: string | null
          number: string
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
          valid_until: string | null
          vat_amount: number
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          converted_invoice_id?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          declined_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          number: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
          vat_amount?: number
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          converted_invoice_id?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          declined_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          billable: boolean
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          billable?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          billable?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean
          created_at: string
          date: string
          description: string | null
          duration_minutes: number
          id: string
          invoice_id: string | null
          person_id: string
          project_id: string
          start_time: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes: number
          id?: string
          invoice_id?: string | null
          person_id: string
          project_id: string
          start_time?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          invoice_id?: string | null
          person_id?: string
          project_id?: string
          start_time?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          date: string
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          label: string
          linked_expense_id: string | null
          linked_invoice_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          date?: string
          id?: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          label: string
          linked_expense_id?: string | null
          linked_invoice_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          date?: string
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          label?: string
          linked_expense_id?: string | null
          linked_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_linked_expense_id_fkey"
            columns: ["linked_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_kind: "bank" | "cash" | "savings"
      alert_severity: "info" | "warning" | "danger"
      alert_type:
        | "invoice_overdue"
        | "expense_uncategorized"
        | "budget_near_limit"
        | "budget_exceeded"
        | "deal_stale"
        | "cash_low"
        | "project_hours_near_limit"
        | "project_hours_exceeded"
        | "project_deadline_approaching"
        | "person_capacity_exceeded"
        | "unbilled_time_stale"
      client_kind: "company" | "individual"
      client_status: "prospect" | "active" | "archived"
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      expense_link_type: "deal" | "client" | "project" | "none"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      payment_method: "bank_transfer" | "cash" | "card" | "twint" | "other"
      project_billing_type:
        | "hourly"
        | "fixed_price"
        | "retainer"
        | "non_billable"
      project_status: "active" | "paused" | "done" | "archived"
      quote_status: "draft" | "sent" | "accepted" | "declined" | "expired"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "blocked" | "done"
      transaction_kind: "in" | "out"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

