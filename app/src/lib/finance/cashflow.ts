import { addDays, format, isBefore, parseISO } from "date-fns";
import type {
  Account,
  Deal,
  Expense,
  Invoice,
  Confidence,
} from "@/types/domain";
import { balanceDue, isOpen as isInvoiceOpen } from "./invoices";
import { weightedValue } from "./deals";

/** Current cash = sum of account initial balances + net transactions.
 *  For the MVP with mock data we approximate from accounts only; once
 *  real transactions are stored, swap to a SUM over the transactions table.
 */
export function currentCash(accounts: Account[]): number {
  return accounts.reduce((acc, a) => acc + a.initialBalance, 0);
}

export interface CashflowEntry {
  date: string; // ISO date
  /** Cash arriving on this date. */
  inflow: number;
  /** Cash leaving on this date. */
  outflow: number;
  /** Net for the day. */
  net: number;
  /** Confidence tier for this entry — drives the chart coloring. */
  confidence: Confidence;
  /** Human label, e.g. "Facture #2026-0042 — Studio Lumen". */
  label: string;
  /** Source kind for grouping. */
  source: "invoice" | "deal" | "expense" | "reserve";
}

/** Build a flat list of projected cash movements over `horizonDays`. */
export function projectCashflow(
  args: {
    invoices: Invoice[];
    deals: Deal[];
    expenses: Expense[];
    horizonDays?: number;
  },
): CashflowEntry[] {
  const { invoices, deals, expenses, horizonDays = 90 } = args;
  const today = new Date();
  const horizon = addDays(today, horizonDays);
  const entries: CashflowEntry[] = [];

  // 1) Confirmed: open invoices — money expected on their due date.
  for (const invoice of invoices.filter(isInvoiceOpen)) {
    const due = parseISO(invoice.dueDate);
    if (isBefore(due, today) || isBefore(due, horizon)) {
      entries.push({
        date: invoice.dueDate,
        inflow: balanceDue(invoice),
        outflow: 0,
        net: balanceDue(invoice),
        confidence: "confirmed",
        label: `Facture ${invoice.number}`,
        source: "invoice",
      });
    }
  }

  // 2) Probable: open deals with an expected payment date in the horizon.
  for (const deal of deals) {
    if (deal.stage === "won" || deal.stage === "lost") continue;
    if (!deal.expectedPaymentDate) continue;
    const paymentDate = parseISO(deal.expectedPaymentDate);
    if (isBefore(paymentDate, horizon)) {
      const weighted = weightedValue(deal);
      if (weighted <= 0) continue;
      entries.push({
        date: deal.expectedPaymentDate,
        inflow: weighted,
        outflow: 0,
        net: weighted,
        confidence: deal.probability >= 60 ? "probable" : "hypothetical",
        label: `Deal — ${deal.title}`,
        source: "deal",
      });
    }
  }

  // 3) Confirmed outflows: planned/recurring expenses already entered.
  //    In the MVP we treat *future-dated* expenses as planned outflows.
  for (const expense of expenses) {
    const date = parseISO(expense.date);
    if (isBefore(date, today)) continue;
    if (isBefore(date, horizon)) {
      entries.push({
        date: expense.date,
        inflow: 0,
        outflow: expense.amount,
        net: -expense.amount,
        confidence: "confirmed",
        label: expense.description ?? expense.vendor,
        source: "expense",
      });
    }
  }

  // Sort chronologically.
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

export interface CashflowSummary {
  startingCash: number;
  /** Net change at the end of the window, including all tiers. */
  projectedNet: number;
  /** Cash at horizon assuming all entries materialise. */
  projectedCash: number;
  byTier: Record<Confidence, { inflow: number; outflow: number; net: number }>;
}

/** Aggregate a list of cashflow entries into a summary, broken out by confidence tier. */
export function summarizeCashflow(
  entries: CashflowEntry[],
  startingCash: number,
): CashflowSummary {
  const byTier: CashflowSummary["byTier"] = {
    confirmed: { inflow: 0, outflow: 0, net: 0 },
    probable: { inflow: 0, outflow: 0, net: 0 },
    hypothetical: { inflow: 0, outflow: 0, net: 0 },
  };
  for (const e of entries) {
    byTier[e.confidence].inflow += e.inflow;
    byTier[e.confidence].outflow += e.outflow;
    byTier[e.confidence].net += e.net;
  }
  const projectedNet =
    byTier.confirmed.net + byTier.probable.net + byTier.hypothetical.net;
  return {
    startingCash,
    projectedNet,
    projectedCash: startingCash + projectedNet,
    byTier,
  };
}

export interface CashflowDayPoint {
  date: string;
  /** Running cash assuming only confirmed entries. */
  confirmed: number;
  /** Running cash including confirmed + probable. */
  probable: number;
  /** Running cash including all three tiers. */
  all: number;
}

/** Build a per-day series for charting over the horizon. */
export function buildDailySeries(
  entries: CashflowEntry[],
  startingCash: number,
  horizonDays = 90,
): CashflowDayPoint[] {
  const today = new Date();
  const series: CashflowDayPoint[] = [];

  let confirmed = startingCash;
  let probable = startingCash;
  let all = startingCash;

  for (let i = 0; i <= horizonDays; i++) {
    const day = addDays(today, i);
    const dayISO = format(day, "yyyy-MM-dd");
    const dayEntries = entries.filter((e) => e.date.startsWith(dayISO));
    for (const e of dayEntries) {
      if (e.confidence === "confirmed") {
        confirmed += e.net;
        probable += e.net;
        all += e.net;
      } else if (e.confidence === "probable") {
        probable += e.net;
        all += e.net;
      } else {
        all += e.net;
      }
    }
    series.push({ date: dayISO, confirmed, probable, all });
  }
  return series;
}

/** Helper for the dashboard cards: project cash at 30, 60, 90 days. */
export function snapshotAt(
  series: CashflowDayPoint[],
  days: number,
): CashflowDayPoint | undefined {
  return series[days];
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIOS
// ─────────────────────────────────────────────────────────────────────────────

export type CashflowScenario = "pessimistic" | "realistic" | "optimistic";

export const SCENARIO_LABELS: Record<CashflowScenario, string> = {
  pessimistic: "Pessimiste",
  realistic: "Réaliste",
  optimistic: "Optimiste",
};

export const SCENARIO_DESCRIPTIONS: Record<CashflowScenario, string> = {
  pessimistic: "Uniquement les factures confirmées. Aucun deal n'est compté.",
  realistic: "Confirmé + deals pondérés par leur probabilité (vue par défaut).",
  optimistic: "Tous les deals comptés à 100% — utile pour un plafond.",
};

/** Apply a scenario to a baseline list of entries by adjusting how deal entries weigh in.
 *
 *  - **realistic**: keep entries as-is (already weighted by probability in `projectCashflow`).
 *  - **pessimistic**: drop probable + hypothetical entries entirely.
 *  - **optimistic**: keep all entries but inflate deal entries to their full (un-weighted) value.
 *
 *  Reference deals so we can de-weight when going optimistic.
 */
export function applyScenario(
  entries: CashflowEntry[],
  scenario: CashflowScenario,
  deals: import("@/types/domain").Deal[] = [],
): CashflowEntry[] {
  if (scenario === "realistic") return entries;
  if (scenario === "pessimistic") {
    return entries.filter((e) => e.confidence === "confirmed");
  }
  // optimistic
  const dealByLabel = new Map(deals.map((d) => [`Deal — ${d.title}`, d]));
  return entries.map((e) => {
    if (e.source !== "deal") return e;
    const deal = dealByLabel.get(e.label);
    if (!deal) return e;
    // Replace weighted with full estimated amount.
    return {
      ...e,
      inflow: deal.estimatedAmount,
      net: deal.estimatedAmount,
      confidence: "probable", // promote — still not confirmed
    };
  });
}
