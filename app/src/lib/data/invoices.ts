import "server-only";
import { isLive } from "./_mode";
import { nextSequentialNumber } from "./_sequences";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockInvoicePayments, mockInvoices } from "@/lib/mock";
import type { Currency, Invoice, InvoiceLine, InvoicePayment, PaymentMethod } from "@/types/domain";

function rowToInvoiceLine(row: Record<string, unknown>): InvoiceLine {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    vatRate: Number(row.vat_rate),
    total: Number(row.total),
  };
}

function rowToInvoice(row: Record<string, unknown>, lines: InvoiceLine[] = []): Invoice {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clientId: row.client_id as string,
    projectId: (row.project_id as string) ?? undefined,
    number: row.number as string,
    status: row.status as Invoice["status"],
    issuedAt: row.issued_at as string,
    dueDate: row.due_date as string,
    currency: (row.currency as Currency) ?? "CHF",
    subtotal: Number(row.subtotal),
    vatAmount: Number(row.vat_amount),
    total: Number(row.total),
    amountPaid: Number(row.amount_paid),
    notes: (row.notes as string) ?? undefined,
    lines,
    lastRemindedAt: (row.last_reminded_at as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToPayment(row: Record<string, unknown>): InvoicePayment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    invoiceId: row.invoice_id as string,
    amount: Number(row.amount),
    paidOn: row.paid_on as string,
    method: row.method as PaymentMethod,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!isLive) return mockInvoices;
  const supabase = await createServerSupabase();
  if (!supabase) return mockInvoices;
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_lines (*)")
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const lines = ((row as { invoice_lines?: Record<string, unknown>[] }).invoice_lines ?? []).map(
      rowToInvoiceLine,
    );
    return rowToInvoice(row as Record<string, unknown>, lines);
  });
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!isLive) return mockInvoices.find((i) => i.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_lines (*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const lines = ((data as { invoice_lines?: Record<string, unknown>[] }).invoice_lines ?? []).map(
    rowToInvoiceLine,
  );
  return rowToInvoice(data, lines);
}

/** Payments attached to a given invoice, newest first. */
export async function getPaymentsByInvoice(invoiceId: string): Promise<InvoicePayment[]> {
  if (!isLive) {
    return mockInvoicePayments
      .filter((p) => p.invoiceId === invoiceId)
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  }
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("invoice_payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToPayment);
}

/** Compute the next invoice number for the current year, format YYYY-NNNN. */
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  return nextSequentialNumber({
    table: "invoices",
    prefix: `${year}-`,
    numericIndex: 1,
    fallbackNumbers: mockInvoices.map((i) => i.number),
  });
}
