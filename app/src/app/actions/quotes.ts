"use server";

import { z } from "zod";
import {
  deleteOwnedRow,
  fail,
  firstError,
  getAuthedSession,
  ok,
  parseInput,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { nextQuoteNumber } from "@/lib/data/quotes";
import { nextInvoiceNumber } from "@/lib/data/invoices";
import { computeLineTotals } from "@/lib/finance/lines";
import { mockQuotesStore } from "@/lib/mock/quotes";
import { mockInvoicesStore } from "@/lib/mock/invoices";
import { mockId, nowIso } from "@/lib/mock/_store";
import type { Quote, QuoteLine, Invoice, InvoiceLine } from "@/types/domain";

function buildQuoteLines(
  quoteId: string,
  raw: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number }>,
): QuoteLine[] {
  return raw.map((l, idx) => ({
    id: `${quoteId}-l${idx}`,
    quoteId,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    total: l.quantity * l.unitPrice,
  }));
}

const LineSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  vatRate: z.coerce.number().min(0).max(100),
});

const QuoteCreateSchema = z.object({
  clientId: z.string().min(1, "Sélectionne un client"),
  dealId: z.string().optional(),
  number: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(["draft", "sent"]).default("draft"),
  notes: z.string().optional(),
  lines: z.array(LineSchema).min(1, "Au moins une ligne"),
});

export type QuoteCreateInput = z.input<typeof QuoteCreateSchema>;

export async function createQuote(input: QuoteCreateInput): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(QuoteCreateSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const number = parsed.data.number?.trim() || (await nextQuoteNumber());
  const { subtotal, vatAmount, total } = computeLineTotals(parsed.data.lines);

  if (session.session.mode === "mock") {
    const id = mockId("q");
    const quote: Quote = {
      id,
      userId: session.session.userId,
      clientId: parsed.data.clientId,
      dealId: parsed.data.dealId || undefined,
      number,
      status: parsed.data.status,
      issuedAt: nowIso().slice(0, 10),
      validUntil: parsed.data.validUntil || undefined,
      currency: "CHF",
      subtotal,
      vatAmount,
      total,
      notes: parsed.data.notes || undefined,
      lines: buildQuoteLines(id, parsed.data.lines),
      createdAt: nowIso(),
    };
    mockQuotesStore.add(quote);
    revalidateMany(["/devis"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      user_id: userId,
      client_id: parsed.data.clientId,
      deal_id: parsed.data.dealId || null,
      number,
      status: parsed.data.status,
      valid_until: parsed.data.validUntil || null,
      subtotal,
      vat_amount: vatAmount,
      total,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (quoteError) return fail(quoteError.message);

  const quoteId = quote.id as string;

  const { error: linesError } = await supabase.from("quote_lines").insert(
    parsed.data.lines.map((line) => ({
      quote_id: quoteId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      vat_rate: line.vatRate,
    })),
  );
  if (linesError) return fail(linesError.message);

  revalidateMany(["/devis"]);
  return ok({ id: quoteId });
}

const StatusSchema = z.object({
  quoteId: z.string().min(1),
  status: z.enum(["draft", "sent", "accepted", "declined", "expired"]),
});

export async function setQuoteStatus(input: z.input<typeof StatusSchema>): Promise<ActionResult> {
  const parsed = parseInput(StatusSchema, input);
  if (!parsed.success) return fail("Statut invalide");

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const pathsToRevalidate = [`/devis/${parsed.data.quoteId}`, "/devis"];

  if (session.session.mode === "mock") {
    if (!mockQuotesStore.get(parsed.data.quoteId)) return fail("Devis introuvable");
    const patch: Partial<Quote> = { status: parsed.data.status };
    if (parsed.data.status === "accepted") patch.acceptedAt = nowIso();
    if (parsed.data.status === "declined") patch.declinedAt = nowIso();
    mockQuotesStore.update(parsed.data.quoteId, patch);
    revalidateMany(pathsToRevalidate);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.status === "accepted") updates.accepted_at = new Date().toISOString();
  if (parsed.data.status === "declined") updates.declined_at = new Date().toISOString();

  const { error } = await supabase
    .from("quotes")
    .update(updates)
    .eq("id", parsed.data.quoteId)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(pathsToRevalidate);
  return ok(null);
}

const ConvertSchema = z.object({
  quoteId: z.string().min(1),
  dueInDays: z.coerce.number().int().min(0).default(30),
});

/** Convert an accepted quote into an invoice (and stamp the link both ways).
 *  The new invoice copies the lines and the totals; the quote keeps its history. */
export async function convertQuoteToInvoice(
  input: z.input<typeof ConvertSchema>,
): Promise<ActionResult<{ invoiceId: string }>> {
  const parsed = parseInput(ConvertSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const quote = mockQuotesStore.get(parsed.data.quoteId);
    if (!quote) return fail("Devis introuvable.");
    if (quote.convertedInvoiceId) return fail("Ce devis est déjà converti en facture.");

    const invoiceId = mockId("i");
    const issuedAt = nowIso().slice(0, 10);
    const dueDate = new Date(Date.now() + parsed.data.dueInDays * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const invoiceLines: InvoiceLine[] = quote.lines.map((l, idx) => ({
      id: `${invoiceId}-l${idx}`,
      invoiceId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      total: l.total,
    }));

    const newInvoice: Invoice = {
      id: invoiceId,
      userId: session.session.userId,
      clientId: quote.clientId,
      projectId: undefined,
      number: await nextInvoiceNumber(),
      status: "draft",
      issuedAt,
      dueDate,
      currency: quote.currency,
      subtotal: quote.subtotal,
      vatAmount: quote.vatAmount,
      total: quote.total,
      amountPaid: 0,
      notes: quote.notes,
      lines: invoiceLines,
      createdAt: nowIso(),
    };
    mockInvoicesStore.add(newInvoice);

    mockQuotesStore.update(parsed.data.quoteId, {
      status: "accepted",
      acceptedAt: nowIso(),
      convertedInvoiceId: invoiceId,
    });

    revalidateMany(["/devis", `/devis/${parsed.data.quoteId}`, "/factures", "/dashboard"]);
    return ok({ invoiceId });
  }

  const { userId, supabase } = session.session;
  // 1. Fetch the quote + its lines.
  const { data: quoteRow, error: fetchError } = await supabase
    .from("quotes")
    .select("*, quote_lines (*)")
    .eq("id", parsed.data.quoteId)
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchError) return fail(fetchError.message);
  if (!quoteRow) return fail("Devis introuvable.");
  if (quoteRow.converted_invoice_id) {
    return fail("Ce devis est déjà converti en facture.");
  }

  const lines = (quoteRow as { quote_lines: Array<Record<string, unknown>> }).quote_lines ?? [];

  // 2. Compute the new invoice's number + due date.
  const number = await nextInvoiceNumber();
  const issuedAt = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + parsed.data.dueInDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  // 3. Create the invoice.
  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      client_id: quoteRow.client_id,
      project_id: null,
      number,
      status: "draft",
      issued_at: issuedAt,
      due_date: dueDate,
      currency: quoteRow.currency,
      subtotal: quoteRow.subtotal,
      vat_amount: quoteRow.vat_amount,
      total: quoteRow.total,
      amount_paid: 0,
      notes: quoteRow.notes,
    })
    .select("id")
    .single();
  if (invoiceError) return fail(invoiceError.message);
  const invoiceId = invoiceRow.id as string;

  // 4. Copy the lines.
  if (lines.length > 0) {
    const { error: linesError } = await supabase.from("invoice_lines").insert(
      lines.map((l) => ({
        invoice_id: invoiceId,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        vat_rate: l.vat_rate,
      })),
    );
    if (linesError) return fail(linesError.message);
  }

  // 5. Stamp the quote — accepted + convert linkage.
  const { error: quoteUpdateError } = await supabase
    .from("quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      converted_invoice_id: invoiceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.quoteId);
  if (quoteUpdateError) return fail(quoteUpdateError.message);

  revalidateMany(["/devis", "/factures"]);
  return ok({ invoiceId });
}

export async function deleteQuote(id: string): Promise<ActionResult> {
  return deleteOwnedRow({ table: "quotes", id, paths: ["/devis"] });
}

const QuoteUpdateSchema = QuoteCreateSchema.extend({ id: z.string().min(1) });

export async function updateQuote(
  input: z.input<typeof QuoteUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(QuoteUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  let subtotal = 0;
  let vatAmount = 0;
  for (const line of parsed.data.lines) {
    const lineTotal = line.quantity * line.unitPrice;
    subtotal += lineTotal;
    vatAmount += (lineTotal * line.vatRate) / 100;
  }
  const total = subtotal + vatAmount;

  const paths = [`/devis/${parsed.data.id}`, "/devis"];

  if (session.session.mode === "mock") {
    if (!mockQuotesStore.get(parsed.data.id)) return fail("Devis introuvable");
    mockQuotesStore.update(parsed.data.id, {
      clientId: parsed.data.clientId,
      dealId: parsed.data.dealId || undefined,
      validUntil: parsed.data.validUntil || undefined,
      status: parsed.data.status,
      subtotal,
      vatAmount,
      total,
      notes: parsed.data.notes || undefined,
      lines: buildQuoteLines(parsed.data.id, parsed.data.lines),
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      client_id: parsed.data.clientId,
      valid_until: parsed.data.validUntil || null,
      status: parsed.data.status,
      subtotal,
      vat_amount: vatAmount,
      total,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (updateError) return fail(updateError.message);

  await supabase.from("quote_lines").delete().eq("quote_id", parsed.data.id);
  const { error: linesError } = await supabase.from("quote_lines").insert(
    parsed.data.lines.map((l) => ({
      quote_id: parsed.data.id,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      vat_rate: l.vatRate,
    })),
  );
  if (linesError) return fail(linesError.message);

  revalidateMany(paths);
  return ok(null);
}
