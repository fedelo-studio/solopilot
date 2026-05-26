// Auto-generated from the Supabase schema.
// Regenerate with: pnpm supabase:types  (see app/README.md)
// Do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          initial_balance: number;
          kind: Database["public"]["Enums"]["account_kind"];
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          initial_balance?: number;
          kind?: Database["public"]["Enums"]["account_kind"];
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          initial_balance?: number;
          kind?: Database["public"]["Enums"]["account_kind"];
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          related_id: string | null;
          related_type: string | null;
          resolved_at: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
          title: string;
          type: Database["public"]["Enums"]["alert_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          related_id?: string | null;
          related_type?: string | null;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
          title: string;
          type: Database["public"]["Enums"]["alert_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          related_id?: string | null;
          related_type?: string | null;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
          title?: string;
          type?: Database["public"]["Enums"]["alert_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          category_id: string;
          created_at: string;
          currency: string;
          id: string;
          notes: string | null;
          period_month: string;
          planned_amount: number;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          period_month: string;
          planned_amount?: number;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          period_month?: string;
          planned_amount?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          address: string | null;
          created_at: string;
          default_currency: string;
          email: string | null;
          id: string;
          kind: Database["public"]["Enums"]["client_kind"];
          name: string;
          notes: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["client_status"];
          updated_at: string;
          user_id: string;
          vat_number: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          name: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      company_settings: {
        Row: {
          company_name: string;
          created_at: string;
          default_currency: string;
          default_vat_rate: number;
          iban: string | null;
          id: string;
          invoice_footer: string | null;
          owner_name: string;
          reserve_percent: number;
          updated_at: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_settings"]["Row"]> & {
          company_name: string;
          owner_name: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Row"]>;
        Relationships: [];
      };
      contacts: {
        Row: {
          client_id: string | null;
          created_at: string;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string;
          notes: string | null;
          phone: string | null;
          role: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contacts"]["Row"]> & {
          first_name: string;
          last_name: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Row"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          client_id: string | null;
          created_at: string;
          currency: string;
          estimated_amount: number;
          expected_payment_date: string | null;
          expected_signature_date: string | null;
          id: string;
          lost_reason: string | null;
          notes: string | null;
          probability: number;
          source: string | null;
          stage: Database["public"]["Enums"]["deal_stage"];
          title: string;
          updated_at: string;
          user_id: string;
          won_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["deals"]["Row"]> & {
          title: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Row"]>;
        Relationships: [];
      };
      expense_categories: {
        Row: { color: string; created_at: string; id: string; name: string; user_id: string };
        Insert: Partial<Database["public"]["Tables"]["expense_categories"]["Row"]> & {
          name: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["expense_categories"]["Row"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          billable: boolean;
          category_id: string | null;
          created_at: string;
          currency: string;
          date: string;
          description: string | null;
          id: string;
          link_id: string | null;
          link_type: Database["public"]["Enums"]["expense_link_type"];
          receipt_url: string | null;
          updated_at: string;
          user_id: string;
          vendor: string;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]> & {
          amount: number;
          vendor: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
        Relationships: [];
      };
      invoice_lines: {
        Row: {
          description: string;
          id: string;
          invoice_id: string;
          quantity: number;
          total: number | null;
          unit_price: number;
          vat_rate: number;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_lines"]["Row"]> & {
          description: string;
          invoice_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_lines"]["Row"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          amount_paid: number;
          client_id: string;
          created_at: string;
          currency: string;
          due_date: string;
          id: string;
          issued_at: string;
          notes: string | null;
          number: string;
          project_id: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string;
          vat_amount: number;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          client_id: string;
          due_date: string;
          number: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          client_id: string;
          created_at: string;
          currency: string;
          deal_id: string | null;
          end_date: string | null;
          id: string;
          internal_budget: number;
          name: string;
          notes: string | null;
          sold_budget: number;
          start_date: string | null;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          client_id: string;
          name: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          created_at: string;
          date: string;
          id: string;
          kind: Database["public"]["Enums"]["transaction_kind"];
          label: string;
          linked_expense_id: string | null;
          linked_invoice_id: string | null;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          account_id: string;
          amount: number;
          kind: Database["public"]["Enums"]["transaction_kind"];
          label: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      account_kind: "bank" | "cash" | "savings";
      alert_severity: "info" | "warning" | "danger";
      alert_type:
        | "invoice_overdue"
        | "expense_uncategorized"
        | "budget_near_limit"
        | "budget_exceeded"
        | "deal_stale"
        | "cash_low";
      client_kind: "company" | "individual";
      client_status: "prospect" | "active" | "archived";
      deal_stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
      expense_link_type: "deal" | "client" | "project" | "none";
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
      project_status: "active" | "paused" | "done" | "archived";
      transaction_kind: "in" | "out";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
