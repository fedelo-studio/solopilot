/**
 * SoloPilot — Supabase seed script.
 *
 * Inserts the full mock dataset into a target user's workspace.
 *
 * Run with:
 *   pnpm tsx scripts/seed.ts <user-email>
 *
 * Requires the following env vars (load via .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY     ← service role, never expose to the client
 *
 * The script:
 *   1. Looks up the auth user by email (via the service-role admin API).
 *   2. Inserts categories, clients, contacts, deals, projects, invoices,
 *      invoice_lines, expenses, budgets, accounts, transactions, alerts.
 *   3. Maps mock IDs to the new database UUIDs as it goes.
 *
 * The schema's `handle_new_user` trigger already creates default categories
 * on signup, so this script clears them before inserting our six fixtures.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

import {
  mockAccounts,
  mockAlerts,
  mockBudgets,
  mockClients,
  mockContacts,
  mockDeals,
  mockExpenseCategories,
  mockExpenses,
  mockInvoicePayments,
  mockInvoices,
  mockProjects,
  mockQuotes,
  mockTransactions,
} from "../src/lib/mock";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm tsx scripts/seed.ts <user-email>");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function findUserByEmail(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`No user with email ${email}. Create the account in Supabase Auth first.`);
  return user.id;
}

function id<T>(): T {
  return crypto.randomUUID() as unknown as T;
}

async function main() {
  console.log(`Looking up user ${email}…`);
  const userId = await findUserByEmail(email);
  console.log(`Found user id: ${userId}`);

  // ---- Reset default categories (created by handle_new_user trigger) ----
  await admin.from("expense_categories").delete().eq("user_id", userId);

  // ---- Maps: mock id → real uuid ----
  const categoryMap = new Map<string, string>();
  const clientMap = new Map<string, string>();
  const projectMap = new Map<string, string>();
  const dealMap = new Map<string, string>();
  const invoiceMap = new Map<string, string>();
  const expenseMap = new Map<string, string>();
  const accountMap = new Map<string, string>();

  // ---- Categories ----
  for (const c of mockExpenseCategories) categoryMap.set(c.id, id<string>());
  const { error: catErr } = await admin.from("expense_categories").insert(
    mockExpenseCategories.map((c) => ({
      id: categoryMap.get(c.id),
      user_id: userId,
      name: c.name,
      color: c.color,
    })),
  );
  if (catErr) throw catErr;

  // ---- Clients ----
  for (const c of mockClients) clientMap.set(c.id, id<string>());
  const { error: clientErr } = await admin.from("clients").insert(
    mockClients.map((c) => ({
      id: clientMap.get(c.id),
      user_id: userId,
      name: c.name,
      kind: c.kind,
      status: c.status,
      email: c.email,
      phone: c.phone,
      address: c.address,
      vat_number: c.vatNumber,
      default_currency: c.defaultCurrency,
      notes: c.notes,
    })),
  );
  if (clientErr) throw clientErr;

  // ---- Contacts ----
  const { error: contactErr } = await admin.from("contacts").insert(
    mockContacts.map((c) => ({
      user_id: userId,
      client_id: c.clientId ? clientMap.get(c.clientId) : null,
      first_name: c.firstName,
      last_name: c.lastName,
      role: c.role,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
    })),
  );
  if (contactErr) throw contactErr;

  // ---- Deals ----
  for (const d of mockDeals) dealMap.set(d.id, id<string>());
  const { error: dealErr } = await admin.from("deals").insert(
    mockDeals.map((d) => ({
      id: dealMap.get(d.id),
      user_id: userId,
      client_id: d.clientId ? clientMap.get(d.clientId) : null,
      title: d.title,
      stage: d.stage,
      estimated_amount: d.estimatedAmount,
      currency: d.currency,
      probability: d.probability,
      expected_signature_date: d.expectedSignatureDate ?? null,
      expected_payment_date: d.expectedPaymentDate ?? null,
      source: d.source,
      notes: d.notes,
      won_at: d.wonAt,
      lost_reason: d.lostReason,
    })),
  );
  if (dealErr) throw dealErr;

  // ---- Projects ----
  for (const p of mockProjects) projectMap.set(p.id, id<string>());
  const { error: projectErr } = await admin.from("projects").insert(
    mockProjects.map((p) => ({
      id: projectMap.get(p.id),
      user_id: userId,
      client_id: clientMap.get(p.clientId)!,
      deal_id: p.dealId ? dealMap.get(p.dealId) : null,
      name: p.name,
      status: p.status,
      sold_budget: p.soldBudget,
      internal_budget: p.internalBudget,
      currency: p.currency,
      start_date: p.startDate ?? null,
      end_date: p.endDate ?? null,
      notes: p.notes,
    })),
  );
  if (projectErr) throw projectErr;

  // ---- Invoices + lines ----
  for (const inv of mockInvoices) invoiceMap.set(inv.id, id<string>());
  const { error: invoiceErr } = await admin.from("invoices").insert(
    mockInvoices.map((i) => ({
      id: invoiceMap.get(i.id),
      user_id: userId,
      client_id: clientMap.get(i.clientId)!,
      project_id: i.projectId ? projectMap.get(i.projectId) : null,
      number: i.number,
      status: i.status,
      issued_at: i.issuedAt,
      due_date: i.dueDate,
      currency: i.currency,
      subtotal: i.subtotal,
      vat_amount: i.vatAmount,
      total: i.total,
      amount_paid: i.amountPaid,
      notes: i.notes,
    })),
  );
  if (invoiceErr) throw invoiceErr;

  const allLines = mockInvoices.flatMap((i) =>
    i.lines.map((l) => ({
      invoice_id: invoiceMap.get(i.id)!,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      vat_rate: l.vatRate,
    })),
  );
  if (allLines.length > 0) {
    const { error: lineErr } = await admin.from("invoice_lines").insert(allLines);
    if (lineErr) throw lineErr;
  }

  // ---- Expenses ----
  for (const e of mockExpenses) expenseMap.set(e.id, id<string>());
  const { error: expenseErr } = await admin.from("expenses").insert(
    mockExpenses.map((e) => {
      const linkType = e.link.type;
      const linkId =
        linkType === "client"
          ? clientMap.get(e.link.id)
          : linkType === "project"
            ? projectMap.get(e.link.id)
            : linkType === "deal"
              ? dealMap.get(e.link.id)
              : null;
      return {
        id: expenseMap.get(e.id),
        user_id: userId,
        date: e.date,
        vendor: e.vendor,
        description: e.description,
        amount: e.amount,
        currency: e.currency,
        category_id: e.categoryId ? categoryMap.get(e.categoryId) : null,
        link_type: linkType,
        link_id: linkId ?? null,
        billable: e.billable,
        receipt_url: e.receiptUrl,
      };
    }),
  );
  if (expenseErr) throw expenseErr;

  // ---- Budgets ----
  const { error: budgetErr } = await admin.from("budgets").insert(
    mockBudgets.map((b) => ({
      user_id: userId,
      period_month: b.periodMonth,
      category_id: categoryMap.get(b.categoryId)!,
      planned_amount: b.plannedAmount,
      currency: b.currency,
      notes: b.notes,
    })),
  );
  if (budgetErr) throw budgetErr;

  // ---- Accounts + transactions ----
  for (const a of mockAccounts) accountMap.set(a.id, id<string>());
  const { error: accountErr } = await admin.from("accounts").insert(
    mockAccounts.map((a) => ({
      id: accountMap.get(a.id),
      user_id: userId,
      name: a.name,
      kind: a.kind,
      initial_balance: a.initialBalance,
      currency: a.currency,
    })),
  );
  if (accountErr) throw accountErr;

  const { error: txErr } = await admin.from("transactions").insert(
    mockTransactions.map((t) => ({
      user_id: userId,
      account_id: accountMap.get(t.accountId)!,
      date: t.date,
      amount: t.amount,
      label: t.label,
      kind: t.kind,
      linked_invoice_id: t.linkedInvoiceId ? invoiceMap.get(t.linkedInvoiceId) : null,
      linked_expense_id: t.linkedExpenseId ? expenseMap.get(t.linkedExpenseId) : null,
    })),
  );
  if (txErr) throw txErr;

  // ---- Quotes + quote_lines ----
  const quoteMap = new Map<string, string>();
  for (const q of mockQuotes) quoteMap.set(q.id, id<string>());
  if (mockQuotes.length > 0) {
    const { error: quoteErr } = await admin.from("quotes").insert(
      mockQuotes.map((q) => ({
        id: quoteMap.get(q.id),
        user_id: userId,
        client_id: clientMap.get(q.clientId)!,
        deal_id: q.dealId ? dealMap.get(q.dealId) : null,
        number: q.number,
        status: q.status,
        issued_at: q.issuedAt,
        valid_until: q.validUntil ?? null,
        currency: q.currency,
        subtotal: q.subtotal,
        vat_amount: q.vatAmount,
        total: q.total,
        notes: q.notes,
        accepted_at: q.acceptedAt ?? null,
        declined_at: q.declinedAt ?? null,
      })),
    );
    if (quoteErr) throw quoteErr;

    const allQuoteLines = mockQuotes.flatMap((q) =>
      q.lines.map((l) => ({
        quote_id: quoteMap.get(q.id)!,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        vat_rate: l.vatRate,
      })),
    );
    if (allQuoteLines.length > 0) {
      const { error: quoteLinesErr } = await admin.from("quote_lines").insert(allQuoteLines);
      if (quoteLinesErr) throw quoteLinesErr;
    }
  }

  // ---- Invoice payments (mock data tracks individual payments per paid invoice) ----
  if (mockInvoicePayments.length > 0) {
    const { error: paymentErr } = await admin.from("invoice_payments").insert(
      mockInvoicePayments.map((p) => ({
        user_id: userId,
        invoice_id: invoiceMap.get(p.invoiceId)!,
        amount: p.amount,
        paid_on: p.paidOn,
        method: p.method,
        notes: p.notes,
      })),
    );
    if (paymentErr) throw paymentErr;
  }

  // ---- Alerts ----
  const { error: alertErr } = await admin.from("alerts").insert(
    mockAlerts.map((a) => ({
      user_id: userId,
      type: a.type,
      severity: a.severity,
      title: a.title,
      body: a.body,
      related_type: a.relatedType,
      related_id:
        a.relatedType === "invoice" && a.relatedId
          ? invoiceMap.get(a.relatedId)
          : a.relatedType === "deal" && a.relatedId
            ? dealMap.get(a.relatedId)
            : a.relatedType === "expense" && a.relatedId
              ? expenseMap.get(a.relatedId)
              : null,
    })),
  );
  if (alertErr) throw alertErr;

  console.log("Seed complete.");
  console.log(`Categories: ${mockExpenseCategories.length}`);
  console.log(`Clients: ${mockClients.length}, Contacts: ${mockContacts.length}`);
  console.log(`Deals: ${mockDeals.length}, Projects: ${mockProjects.length}`);
  console.log(`Invoices: ${mockInvoices.length}, Quotes: ${mockQuotes.length}, Expenses: ${mockExpenses.length}`);
  console.log(`Payments: ${mockInvoicePayments.length}, Budgets: ${mockBudgets.length}, Accounts: ${mockAccounts.length}`);
  console.log(`Alerts: ${mockAlerts.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
