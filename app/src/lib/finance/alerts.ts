import { differenceInDays, parseISO } from "date-fns";
import type { Budget, Expense, Invoice, Deal, Account, Alert } from "@/types/domain";
import { liveStatus, balanceDue } from "./invoices";
import { budgetUsage } from "./budget";
import { currentCash } from "./cashflow";
import { formatMoney } from "./format";

export interface AlertSeed {
  /** Stable identifier so we can dedupe between runs. */
  key: string;
  type: Alert["type"];
  severity: Alert["severity"];
  title: string;
  body?: string;
  relatedType?: Alert["relatedType"];
  relatedId?: string;
}

interface ComputeArgs {
  invoices: Invoice[];
  expenses: Expense[];
  budgets: Budget[];
  deals: Deal[];
  accounts: Account[];
  /** Used by the cash_low alert. Defaults to 5'000 CHF — configurable later. */
  cashLowThreshold?: number;
  /** Days without activity before a deal becomes "stale". Defaults to 30. */
  dealStaleDays?: number;
}

/** Pure compute — produces a list of alerts from the current state of the workspace.
 *  Deterministic: given the same input, the same alerts come out (same `key`). */
export function computeAlerts({
  invoices,
  expenses,
  budgets,
  deals,
  accounts,
  cashLowThreshold = 5_000,
  dealStaleDays = 30,
}: ComputeArgs): AlertSeed[] {
  const alerts: AlertSeed[] = [];

  // ── Invoice overdue ─────────────────────────────────────────────────────
  for (const invoice of invoices) {
    if (liveStatus(invoice) !== "overdue") continue;
    const overdueDays = differenceInDays(new Date(), parseISO(invoice.dueDate));
    alerts.push({
      key: `invoice_overdue:${invoice.id}`,
      type: "invoice_overdue",
      severity: "danger",
      title: `Facture ${invoice.number} en retard`,
      body: `${formatMoney(balanceDue(invoice))} dus depuis ${overdueDays} jour${overdueDays > 1 ? "s" : ""}.`,
      relatedType: "invoice",
      relatedId: invoice.id,
    });
  }

  // ── Expenses without a category ─────────────────────────────────────────
  for (const expense of expenses) {
    if (expense.categoryId) continue;
    alerts.push({
      key: `expense_uncategorized:${expense.id}`,
      type: "expense_uncategorized",
      severity: "warning",
      title: "Dépense sans catégorie",
      body: `${expense.vendor} — ${formatMoney(expense.amount)} à classer.`,
      relatedType: "expense",
      relatedId: expense.id,
    });
  }

  // ── Budgets near limit or exceeded ──────────────────────────────────────
  for (const budget of budgets) {
    const usage = budgetUsage(budget, expenses);
    if (usage.status === "exceeded") {
      alerts.push({
        key: `budget_exceeded:${budget.id}`,
        type: "budget_exceeded",
        severity: "danger",
        title: "Budget dépassé",
        body: `Dépassement de ${formatMoney(usage.overBy)} sur la catégorie.`,
        relatedType: "budget",
        relatedId: budget.id,
      });
    } else if (usage.status === "near_limit") {
      alerts.push({
        key: `budget_near_limit:${budget.id}`,
        type: "budget_near_limit",
        severity: "warning",
        title: "Budget proche de la limite",
        body: `${usage.usagePercent}% du budget mensuel engagé.`,
        relatedType: "budget",
        relatedId: budget.id,
      });
    }
  }

  // ── Stale deals — open with no recent activity ──────────────────────────
  for (const deal of deals) {
    if (deal.stage === "won" || deal.stage === "lost") continue;
    // We treat `createdAt` as a proxy for last activity until we track updates.
    const daysSince = differenceInDays(new Date(), parseISO(deal.createdAt));
    if (daysSince < dealStaleDays) continue;
    alerts.push({
      key: `deal_stale:${deal.id}`,
      type: "deal_stale",
      severity: "info",
      title: `Deal sans activité depuis ${daysSince} jours`,
      body: `${deal.title} — relance recommandée.`,
      relatedType: "deal",
      relatedId: deal.id,
    });
  }

  // ── Cash low ────────────────────────────────────────────────────────────
  const cash = currentCash(accounts);
  if (cash < cashLowThreshold) {
    alerts.push({
      key: "cash_low",
      type: "cash_low",
      severity: cash < cashLowThreshold / 2 ? "danger" : "warning",
      title: "Trésorerie basse",
      body: `Cash disponible : ${formatMoney(cash)}. Seuil d'alerte : ${formatMoney(cashLowThreshold)}.`,
      relatedType: "account",
    });
  }

  return alerts;
}
