/**
 * SoloPilot — Domain Types
 *
 * Single source of truth for business entities.
 * These mirror the Supabase schema 1:1 (see /supabase/migrations/0001_init.sql).
 *
 * All monetary amounts are stored as numbers in the entity's native `currency`.
 * No conversion happens here — that's a UI/formatter concern.
 */

export type Currency = "CHF" | "EUR" | "USD";

export type ID = string;

/** Confidence tier — used to color and group amounts in cashflow & dashboard. */
export type Confidence = "confirmed" | "probable" | "hypothetical";

// ─────────────────────────────────────────────────────────────────────────────
// CRM
// ─────────────────────────────────────────────────────────────────────────────

export type ClientStatus = "prospect" | "active" | "archived";
export type ClientKind = "company" | "individual";

export interface Client {
  id: ID;
  userId: ID;
  name: string;
  kind: ClientKind;
  status: ClientStatus;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string;
  defaultCurrency: Currency;
  notes?: string;
  createdAt: string; // ISO date
}

export interface Contact {
  id: ID;
  userId: ID;
  clientId?: ID; // optional — a contact can exist standalone
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline
// ─────────────────────────────────────────────────────────────────────────────

/** Deal stages — order matters: it drives the pipeline kanban left-to-right. */
export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

/** Human-readable French labels — used everywhere in UI. */
export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Qualifié",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  lost: "Perdu",
};

export interface Deal {
  id: ID;
  userId: ID;
  /** Nullable — a deal can exist on a prospect that isn't yet a client. */
  clientId?: ID;
  title: string;
  stage: DealStage;
  estimatedAmount: number;
  currency: Currency;
  /** 0–100 — used to compute weighted value. */
  probability: number;
  expectedSignatureDate?: string;
  expectedPaymentDate?: string;
  source?: string;
  notes?: string;
  wonAt?: string;
  lostReason?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "paused" | "done" | "archived";

export interface Project {
  id: ID;
  userId: ID;
  clientId: ID;
  /** Optional — a project can be created without a parent deal. */
  dealId?: ID;
  name: string;
  status: ProjectStatus;
  /** What the client pays. */
  soldBudget: number;
  /** What you allocate internally (subcontractors, time, costs). */
  internalBudget: number;
  currency: Currency;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

export interface InvoiceLine {
  id: ID;
  invoiceId: ID;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Configurable VAT rate (e.g. 8.1 for Switzerland standard).
   *  We make no fiscal assumption — this is user-configured. */
  vatRate: number;
  total: number; // quantity * unitPrice (pre-VAT)
}

export interface Invoice {
  id: ID;
  userId: ID;
  clientId: ID;
  projectId?: ID;
  number: string; // e.g. "2026-0042"
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  currency: Currency;
  /** Pre-VAT total. */
  subtotal: number;
  vatAmount: number;
  /** subtotal + vatAmount */
  total: number;
  amountPaid: number;
  notes?: string;
  lines: InvoiceLine[];
  /** ISO timestamp when the last reminder was sent to the client. */
  lastRemindedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quotes (Devis) — pre-invoice document signed by the client.
// Once accepted, a quote converts into a real invoice (and optionally a project).
// ─────────────────────────────────────────────────────────────────────────────

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  declined: "Refusé",
  expired: "Expiré",
};

export interface QuoteLine {
  id: ID;
  quoteId: ID;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Quote {
  id: ID;
  userId: ID;
  clientId: ID;
  dealId?: ID;
  number: string; // e.g. "DEV-2026-0001"
  status: QuoteStatus;
  issuedAt: string;
  /** Past this date, a sent quote is considered expired (we mark it on view). */
  validUntil?: string;
  currency: Currency;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string;
  lines: QuoteLine[];
  convertedInvoiceId?: ID;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice payments — individual payment records that aggregate into amountPaid.
// The Supabase trigger sync_invoice_payment_totals keeps invoices.amount_paid
// and invoices.status in sync automatically.
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod = "bank_transfer" | "cash" | "card" | "twint" | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Virement bancaire",
  cash: "Espèces",
  card: "Carte",
  twint: "TWINT",
  other: "Autre",
};

export interface InvoicePayment {
  id: ID;
  userId: ID;
  invoiceId: ID;
  amount: number;
  paidOn: string; // ISO date
  method: PaymentMethod;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Expenses
// ─────────────────────────────────────────────────────────────────────────────

export type ExpenseLink =
  | { type: "deal"; id: ID }
  | { type: "client"; id: ID }
  | { type: "project"; id: ID }
  | { type: "none" };

export interface ExpenseCategory {
  id: ID;
  userId: ID;
  name: string;
  /** HSL or hex color for chart legends. */
  color: string;
}

export interface Expense {
  id: ID;
  userId: ID;
  date: string;
  vendor: string;
  description?: string;
  amount: number;
  currency: Currency;
  categoryId?: ID;
  link: ExpenseLink;
  billable: boolean;
  receiptUrl?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budgets
// ─────────────────────────────────────────────────────────────────────────────

export interface Budget {
  id: ID;
  userId: ID;
  /** First day of the month, ISO date. */
  periodMonth: string;
  categoryId: ID;
  plannedAmount: number;
  currency: Currency;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Accounts & Transactions
// ─────────────────────────────────────────────────────────────────────────────

export type AccountKind = "bank" | "cash" | "savings";

export interface Account {
  id: ID;
  userId: ID;
  name: string;
  kind: AccountKind;
  initialBalance: number;
  currency: Currency;
  createdAt: string;
}

export type TransactionKind = "in" | "out";

export interface Transaction {
  id: ID;
  userId: ID;
  accountId: ID;
  date: string;
  amount: number; // always positive — direction is in `kind`
  label: string;
  kind: TransactionKind;
  linkedInvoiceId?: ID;
  linkedExpenseId?: ID;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────────────────────────────────────

export type AlertType =
  | "invoice_overdue"
  | "expense_uncategorized"
  | "budget_near_limit"
  | "budget_exceeded"
  | "deal_stale"
  | "cash_low";

export type AlertSeverity = "info" | "warning" | "danger";

export interface Alert {
  id: ID;
  userId: ID;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  body?: string;
  relatedType?: "invoice" | "expense" | "budget" | "deal" | "account";
  relatedId?: ID;
  resolvedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User / workspace settings
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanySettings {
  id: ID;
  userId: ID;
  companyName: string;
  ownerName: string;
  defaultCurrency: Currency;
  /** Standard VAT rate for new invoice lines — user-configured, no assumption. */
  defaultVatRate: number;
  /** Reserve target — e.g. % of monthly revenue set aside for taxes/AVS.
   *  Treated as a product hypothesis, validated by the user. */
  reservePercent: number;
  iban?: string;
  invoiceFooter?: string;
}
