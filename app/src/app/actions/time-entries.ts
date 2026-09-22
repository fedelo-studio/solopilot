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
import {
  getCompanySettings,
  getPeople,
  getProjectById,
  getTasksByProject,
  getUnbilledTimeEntriesByProject,
} from "@/lib/data";
import { nextInvoiceNumber } from "@/lib/data/invoices";
import { computeLineTotals } from "@/lib/finance/lines";
import { buildTimeEntryInvoiceLines } from "@/lib/finance/projects";
import { mockTimeEntriesStore } from "@/lib/mock/time-entries";
import { mockInvoicesStore } from "@/lib/mock/invoices";
import { mockId, nowIso } from "@/lib/mock/_store";
import type { Invoice, InvoiceLine, TimeEntry } from "@/types/domain";

const TimeEntrySchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  personId: z.string().min(1, "Sélectionne une personne"),
  date: z.string().min(1, "La date est requise"),
  startTime: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive("La durée doit être positive"),
  description: z.string().optional(),
  billable: z.coerce.boolean().default(true),
});

export type TimeEntryInput = z.input<typeof TimeEntrySchema>;

export async function createTimeEntry(
  input: TimeEntryInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(TimeEntrySchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = ["/temps", `/projets/${parsed.data.projectId}`];

  if (session.session.mode === "mock") {
    const id = mockId("te");
    mockTimeEntriesStore.add({
      id,
      userId: session.session.userId,
      projectId: parsed.data.projectId,
      taskId: parsed.data.taskId || undefined,
      personId: parsed.data.personId,
      date: parsed.data.date,
      startTime: parsed.data.startTime || undefined,
      durationMinutes: parsed.data.durationMinutes,
      description: parsed.data.description || undefined,
      billable: parsed.data.billable,
      createdAt: nowIso(),
    });
    revalidateMany(paths);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: userId,
      project_id: parsed.data.projectId,
      task_id: parsed.data.taskId || null,
      person_id: parsed.data.personId,
      date: parsed.data.date,
      start_time: parsed.data.startTime || null,
      duration_minutes: parsed.data.durationMinutes,
      description: parsed.data.description || null,
      billable: parsed.data.billable,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  revalidateMany(paths);
  return ok({ id: data.id as string });
}

const TimeEntryUpdateSchema = TimeEntrySchema.extend({ id: z.string().min(1) });

export async function updateTimeEntry(
  input: z.input<typeof TimeEntryUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(TimeEntryUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = ["/temps", `/projets/${parsed.data.projectId}`];

  if (session.session.mode === "mock") {
    const current = mockTimeEntriesStore.get(parsed.data.id);
    if (!current) return fail("Entrée introuvable");
    if (current.invoiceId) return fail("Cette entrée est déjà facturée et ne peut plus être modifiée.");
    mockTimeEntriesStore.update(parsed.data.id, {
      taskId: parsed.data.taskId || undefined,
      personId: parsed.data.personId,
      date: parsed.data.date,
      startTime: parsed.data.startTime || undefined,
      durationMinutes: parsed.data.durationMinutes,
      description: parsed.data.description || undefined,
      billable: parsed.data.billable,
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  // `.is("invoice_id", null)` guards against editing an already-billed entry —
  // matches nothing (no error, no-op) rather than corrupting a billed line.
  const { error } = await supabase
    .from("time_entries")
    .update({
      task_id: parsed.data.taskId || null,
      person_id: parsed.data.personId,
      date: parsed.data.date,
      start_time: parsed.data.startTime || null,
      duration_minutes: parsed.data.durationMinutes,
      description: parsed.data.description || null,
      billable: parsed.data.billable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId)
    .is("invoice_id", null);
  if (error) return fail(error.message);

  revalidateMany(paths);
  return ok(null);
}

export async function deleteTimeEntry(input: {
  id: string;
  projectId: string;
}): Promise<ActionResult> {
  return deleteOwnedRow({
    table: "time_entries",
    id: input.id,
    paths: ["/temps", `/projets/${input.projectId}`],
  });
}

/* ---------------------------------------------------------------------------
 * Invoice from tracked time — mirrors convertQuoteToInvoice's structure and
 * its accepted limitations (no DB transaction; sequential awaited calls with
 * early-return `fail()`). Reads go through the mock/live-aware data layer
 * (getProjectById, getPeople, getTasksByProject, getUnbilledTimeEntriesByProject,
 * getCompanySettings); only the writes (insert invoice + lines, stamp
 * time_entries.invoice_id) branch explicitly on session.mode, same as every
 * other money-moving action in this codebase.
 * ------------------------------------------------------------------------- */

const CreateInvoiceFromTimeSchema = z.object({
  projectId: z.string().min(1),
  entryIds: z.array(z.string().min(1)).min(1, "Sélectionne au moins une entrée"),
  dueInDays: z.coerce.number().int().min(0).default(30),
  groupBy: z.enum(["task", "person", "single_line"]).default("task"),
});

export async function createInvoiceFromTimeEntries(
  input: z.input<typeof CreateInvoiceFromTimeSchema>,
): Promise<ActionResult<{ invoiceId: string }>> {
  const parsed = parseInput(CreateInvoiceFromTimeSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const project = await getProjectById(parsed.data.projectId);
  if (!project) return fail("Projet introuvable.");
  if (project.billingType !== "hourly") {
    return fail("Ce projet n'est pas facturé à l'heure — impossible de facturer du temps suivi.");
  }

  // Only entries that are still unbilled AND billable are eligible — this is
  // both the "don't double-bill" guard and the billable filter in one step.
  const unbilledById = new Map(
    (await getUnbilledTimeEntriesByProject(parsed.data.projectId)).map((e) => [e.id, e]),
  );
  const entries: TimeEntry[] = [];
  for (const id of parsed.data.entryIds) {
    const entry = unbilledById.get(id);
    if (!entry) {
      return fail(
        "Une ou plusieurs entrées sélectionnées ont déjà été facturées, ne sont pas facturables, ou n'existent plus.",
      );
    }
    entries.push(entry);
  }

  const [people, tasks, company] = await Promise.all([
    getPeople(),
    getTasksByProject(parsed.data.projectId),
    getCompanySettings(),
  ]);

  const built = buildTimeEntryInvoiceLines(
    entries,
    { project, people, tasks },
    parsed.data.groupBy,
    company.defaultVatRate,
  );
  if (built.error) return fail(built.error);

  const { subtotal, vatAmount, total } = computeLineTotals(built.lines);
  const issuedAt = nowIso().slice(0, 10);
  const dueDate = new Date(Date.now() + parsed.data.dueInDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const entryIds = entries.map((e) => e.id);
  const paths = ["/factures", `/projets/${parsed.data.projectId}`, "/temps"];

  if (session.session.mode === "mock") {
    const invoiceId = mockId("i");
    const invoiceLines: InvoiceLine[] = built.lines.map((l, idx) => ({
      id: `${invoiceId}-l${idx}`,
      invoiceId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      total: l.quantity * l.unitPrice,
    }));
    const newInvoice: Invoice = {
      id: invoiceId,
      userId: session.session.userId,
      clientId: project.clientId,
      projectId: project.id,
      number: await nextInvoiceNumber(),
      status: "draft",
      issuedAt,
      dueDate,
      currency: project.currency,
      subtotal,
      vatAmount,
      total,
      amountPaid: 0,
      lines: invoiceLines,
      createdAt: nowIso(),
    };
    mockInvoicesStore.add(newInvoice);
    for (const id of entryIds) mockTimeEntriesStore.update(id, { invoiceId });
    revalidateMany(paths);
    return ok({ invoiceId });
  }

  const { userId, supabase } = session.session;
  const number = await nextInvoiceNumber();

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      client_id: project.clientId,
      project_id: project.id,
      number,
      status: "draft",
      issued_at: issuedAt,
      due_date: dueDate,
      currency: project.currency,
      subtotal,
      vat_amount: vatAmount,
      total,
      amount_paid: 0,
    })
    .select("id")
    .single();
  if (invoiceError) return fail(invoiceError.message);
  const invoiceId = invoiceRow.id as string;

  const { error: linesError } = await supabase.from("invoice_lines").insert(
    built.lines.map((l) => ({
      invoice_id: invoiceId,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      vat_rate: l.vatRate,
    })),
  );
  if (linesError) return fail(linesError.message);

  const { error: entriesError } = await supabase
    .from("time_entries")
    .update({ invoice_id: invoiceId, updated_at: new Date().toISOString() })
    .in("id", entryIds)
    .eq("user_id", userId);
  if (entriesError) return fail(entriesError.message);

  revalidateMany(paths);
  return ok({ invoiceId });
}
