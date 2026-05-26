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
import { nextInvoiceNumber } from "@/lib/data/invoices";
import { computeLineTotals } from "@/lib/finance/lines";
import { mockInvoicesStore } from "@/lib/mock/invoices";
import { mockInvoicePaymentsStore } from "@/lib/mock/payments";
import { mockId, nowIso } from "@/lib/mock/_store";
import type { Invoice, InvoiceLine } from "@/types/domain";

function buildLinesForInvoice(
  invoiceId: string,
  raw: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number }>,
): InvoiceLine[] {
  return raw.map((l, idx) => ({
    id: `${invoiceId}-l${idx}`,
    invoiceId,
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

const InvoiceCreateSchema = z.object({
  clientId: z.string().min(1, "Sélectionne un client"),
  projectId: z.string().optional(),
  number: z.string().optional(),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  status: z.enum(["draft", "sent"]).default("draft"),
  notes: z.string().optional(),
  lines: z.array(LineSchema).min(1, "Au moins une ligne"),
});

export type InvoiceCreateInput = z.input<typeof InvoiceCreateSchema>;

export async function createInvoice(input: InvoiceCreateInput): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(InvoiceCreateSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const number = parsed.data.number?.trim() || (await nextInvoiceNumber());
  const { subtotal, vatAmount, total } = computeLineTotals(parsed.data.lines);

  if (session.session.mode === "mock") {
    const id = mockId("i");
    const invoice: Invoice = {
      id,
      userId: session.session.userId,
      clientId: parsed.data.clientId,
      projectId: parsed.data.projectId || undefined,
      number,
      status: parsed.data.status,
      issuedAt: nowIso().slice(0, 10),
      dueDate: parsed.data.dueDate,
      currency: "CHF",
      subtotal,
      vatAmount,
      total,
      amountPaid: 0,
      notes: parsed.data.notes || undefined,
      lines: buildLinesForInvoice(id, parsed.data.lines),
      createdAt: nowIso(),
    };
    mockInvoicesStore.add(invoice);
    revalidateMany(["/factures", "/dashboard", "/cashflow"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId || null,
      number,
      due_date: parsed.data.dueDate,
      status: parsed.data.status,
      subtotal,
      vat_amount: vatAmount,
      total,
      amount_paid: 0,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (invoiceError) return fail(invoiceError.message);
  const invoiceId = invoice.id as string;

  const { error: linesError } = await supabase.from("invoice_lines").insert(
    parsed.data.lines.map((line) => ({
      invoice_id: invoiceId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      vat_rate: line.vatRate,
    })),
  );

  if (linesError) return fail(linesError.message);

  revalidateMany(["/factures"]);
  return ok({ id: invoiceId });
}

// ─────────────────────────────────────────────────────────────────────────────
// V5 — Status transitions, payments, reminders
// ─────────────────────────────────────────────────────────────────────────────

const PaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  paidOn: z.string().min(10, "Date requise"),
  method: z.enum(["bank_transfer", "cash", "card", "twint", "other"]).default("bank_transfer"),
  notes: z.string().optional(),
});

export type PaymentInput = z.input<typeof PaymentSchema>;

/** Record a new payment against an invoice. The Supabase trigger
 *  `sync_invoice_payment_totals` automatically updates amount_paid and status. */
export async function recordPayment(input: PaymentInput): Promise<ActionResult> {
  const parsed = parseInput(PaymentSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const pathsToRevalidate = [`/factures/${parsed.data.invoiceId}`, "/factures", "/dashboard"];

  if (session.session.mode === "mock") {
    const invoice = mockInvoicesStore.get(parsed.data.invoiceId);
    if (!invoice) return fail("Facture introuvable");
    const paymentId = mockId("ip");
    mockInvoicePaymentsStore.add({
      id: paymentId,
      userId: session.session.userId,
      invoiceId: parsed.data.invoiceId,
      amount: parsed.data.amount,
      paidOn: parsed.data.paidOn,
      method: parsed.data.method,
      notes: parsed.data.notes || undefined,
      createdAt: nowIso(),
    });
    // Mirror the Supabase trigger sync_invoice_payment_totals: bump amount_paid
    // and flip to "paid" once the total is covered.
    const nextPaid = invoice.amountPaid + parsed.data.amount;
    mockInvoicesStore.update(parsed.data.invoiceId, {
      amountPaid: nextPaid,
      status: nextPaid >= invoice.total ? "paid" : invoice.status === "draft" ? "sent" : invoice.status,
    });
    revalidateMany(pathsToRevalidate);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase.from("invoice_payments").insert({
    user_id: userId,
    invoice_id: parsed.data.invoiceId,
    amount: parsed.data.amount,
    paid_on: parsed.data.paidOn,
    method: parsed.data.method,
    notes: parsed.data.notes || null,
  });
  if (error) return fail(error.message);

  revalidateMany(pathsToRevalidate);
  return ok(null);
}

const StatusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

/** Manually transition an invoice's status (e.g., mark as sent or cancelled).
 *  Note: 'paid' is normally set by the trigger when payments reach the total —
 *  but the user can still force it here, e.g. for legacy data. */
export async function setInvoiceStatus(input: z.input<typeof StatusSchema>): Promise<ActionResult> {
  const parsed = parseInput(StatusSchema, input);
  if (!parsed.success) return fail("Statut invalide");

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const pathsToRevalidate = [`/factures/${parsed.data.invoiceId}`, "/factures"];

  if (session.session.mode === "mock") {
    if (!mockInvoicesStore.get(parsed.data.invoiceId)) return fail("Facture introuvable");
    mockInvoicesStore.update(parsed.data.invoiceId, { status: parsed.data.status });
    revalidateMany(pathsToRevalidate);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("invoices")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.invoiceId)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(pathsToRevalidate);
  return ok(null);
}

/** Delete an invoice. Cascades to invoice_lines + invoice_payments via FK ON DELETE CASCADE.
 *  Mock side-effect mirrors the cascade by purging linked payments. */
export async function deleteInvoice(id: string): Promise<ActionResult> {
  return deleteOwnedRow({
    table: "invoices",
    id,
    paths: ["/factures", "/dashboard"],
    mockSideEffect: () => {
      // Cascade-delete payments tied to this invoice
      for (const p of [...mockInvoicePaymentsStore.items]) {
        if (p.invoiceId === id) mockInvoicePaymentsStore.remove(p.id);
      }
    },
  });
}

const InvoiceUpdateSchema = InvoiceCreateSchema.extend({ id: z.string().min(1) });

export async function updateInvoice(
  input: z.input<typeof InvoiceUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(InvoiceUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const { subtotal, vatAmount, total } = computeLineTotals(parsed.data.lines);
  const paths = [`/factures/${parsed.data.id}`, "/factures", "/dashboard"];

  if (session.session.mode === "mock") {
    const current = mockInvoicesStore.get(parsed.data.id);
    if (!current) return fail("Facture introuvable");
    mockInvoicesStore.update(parsed.data.id, {
      clientId: parsed.data.clientId,
      projectId: parsed.data.projectId || undefined,
      dueDate: parsed.data.dueDate,
      status: parsed.data.status,
      subtotal,
      vatAmount,
      total,
      notes: parsed.data.notes || undefined,
      lines: buildLinesForInvoice(parsed.data.id, parsed.data.lines),
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId || null,
      due_date: parsed.data.dueDate,
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

  // Replace lines wholesale.
  await supabase.from("invoice_lines").delete().eq("invoice_id", parsed.data.id);
  const { error: linesError } = await supabase.from("invoice_lines").insert(
    parsed.data.lines.map((l) => ({
      invoice_id: parsed.data.id,
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

/** Record that the client was reminded today. Currently only stamps the date —
 *  email integration is delegated to the edge function (see supabase/functions/invoice-reminders). */
export async function sendReminder(invoiceId: string): Promise<ActionResult> {
  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const pathsToRevalidate = [`/factures/${invoiceId}`, "/factures"];

  if (session.session.mode === "mock") {
    if (!mockInvoicesStore.get(invoiceId)) return fail("Facture introuvable");
    mockInvoicesStore.update(invoiceId, { lastRemindedAt: nowIso() });
    revalidateMany(pathsToRevalidate);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("invoices")
    .update({ last_reminded_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(pathsToRevalidate);
  return ok(null);
}
