import "server-only";
import { isLive } from "./_mode";
import { nextSequentialNumber } from "./_sequences";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockQuotes } from "@/lib/mock";
import type { Currency, Quote, QuoteLine } from "@/types/domain";

function rowToQuoteLine(row: Record<string, unknown>): QuoteLine {
  return {
    id: row.id as string,
    quoteId: row.quote_id as string,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    vatRate: Number(row.vat_rate),
    total: Number(row.total),
  };
}

function rowToQuote(row: Record<string, unknown>, lines: QuoteLine[] = []): Quote {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clientId: row.client_id as string,
    dealId: (row.deal_id as string) ?? undefined,
    number: row.number as string,
    status: row.status as Quote["status"],
    issuedAt: row.issued_at as string,
    validUntil: (row.valid_until as string) ?? undefined,
    currency: (row.currency as Currency) ?? "CHF",
    subtotal: Number(row.subtotal),
    vatAmount: Number(row.vat_amount),
    total: Number(row.total),
    notes: (row.notes as string) ?? undefined,
    lines,
    convertedInvoiceId: (row.converted_invoice_id as string) ?? undefined,
    acceptedAt: (row.accepted_at as string) ?? undefined,
    declinedAt: (row.declined_at as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getQuotes(): Promise<Quote[]> {
  if (!isLive) return mockQuotes;
  const supabase = await createServerSupabase();
  if (!supabase) return mockQuotes;
  const { data, error } = await supabase
    .from("quotes")
    .select("*, quote_lines (*)")
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const lines = ((row as { quote_lines?: Record<string, unknown>[] }).quote_lines ?? []).map(
      rowToQuoteLine,
    );
    return rowToQuote(row as Record<string, unknown>, lines);
  });
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  if (!isLive) return mockQuotes.find((q) => q.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("quotes")
    .select("*, quote_lines (*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const lines = ((data as { quote_lines?: Record<string, unknown>[] }).quote_lines ?? []).map(
    rowToQuoteLine,
  );
  return rowToQuote(data, lines);
}

export async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  return nextSequentialNumber({
    table: "quotes",
    prefix: `DEV-${year}-`,
    numericIndex: 2,
    fallbackNumbers: mockQuotes.map((q) => q.number),
  });
}
