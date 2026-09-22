import { differenceInDays, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import type {
  Account,
  Alert,
  Budget,
  Deal,
  Expense,
  Invoice,
  Person,
  Project,
  TimeEntry,
} from "@/types/domain";
import { liveStatus, balanceDue } from "./invoices";
import { budgetUsage } from "./budget";
import { currentCash } from "./cashflow";
import { formatMoney } from "./format";
import { budgetUtilizationPercent, capacityBand, capacityUtilizationPercent, hoursLogged } from "./projects";

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
  projects: Project[];
  people: Person[];
  timeEntries: TimeEntry[];
  /** Used by the cash_low alert. Defaults to 5'000 CHF — configurable later. */
  cashLowThreshold?: number;
  /** Days without activity before a deal becomes "stale". Defaults to 30. */
  dealStaleDays?: number;
  /** % of a project's hour budget consumed before it's flagged "near limit". Defaults to 75. */
  projectHoursNearLimitPercent?: number;
  /** Days before a project's end date counts as "approaching". Defaults to 7. */
  deadlineApproachingDays?: number;
  /** Days an unbilled billable entry can sit before it's flagged "stale". Defaults to 14. */
  unbilledStaleDays?: number;
}

/** Pure compute — produces a list of alerts from the current state of the workspace.
 *  Deterministic: given the same input, the same alerts come out (same `key`). */
export function computeAlerts({
  invoices,
  expenses,
  budgets,
  deals,
  accounts,
  projects,
  people,
  timeEntries,
  cashLowThreshold = 5_000,
  dealStaleDays = 30,
  projectHoursNearLimitPercent = 75,
  deadlineApproachingDays = 7,
  unbilledStaleDays = 14,
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

  // ── Project hour budgets — near limit / exceeded ────────────────────────
  for (const project of projects) {
    if (project.budgetHours == null || project.budgetHours <= 0) continue;
    const projectEntries = timeEntries.filter((e) => e.projectId === project.id);
    const pct = budgetUtilizationPercent(project, projectEntries);
    if (pct == null) continue;
    if (pct >= 100) {
      alerts.push({
        key: `project_hours_exceeded:${project.id}`,
        type: "project_hours_exceeded",
        severity: "danger",
        title: `Budget d'heures dépassé — ${project.name}`,
        body: `${pct}% du budget consommé (${project.budgetHours} h prévues).`,
        relatedType: "project",
        relatedId: project.id,
      });
    } else if (pct >= projectHoursNearLimitPercent) {
      alerts.push({
        key: `project_hours_near_limit:${project.id}`,
        type: "project_hours_near_limit",
        severity: pct >= 90 ? "danger" : "warning",
        title: `Budget d'heures proche de la limite — ${project.name}`,
        body: `${pct}% du budget consommé (${project.budgetHours} h prévues).`,
        relatedType: "project",
        relatedId: project.id,
      });
    }
  }

  // ── Project deadline approaching ────────────────────────────────────────
  for (const project of projects) {
    if (!project.endDate) continue;
    if (project.status === "done" || project.status === "archived") continue;
    const daysUntil = differenceInDays(parseISO(project.endDate), new Date());
    if (daysUntil < 0 || daysUntil > deadlineApproachingDays) continue;
    alerts.push({
      key: `project_deadline_approaching:${project.id}`,
      type: "project_deadline_approaching",
      severity: daysUntil <= 2 ? "danger" : "warning",
      title: `Échéance proche — ${project.name}`,
      body:
        daysUntil === 0
          ? "Livraison prévue aujourd'hui."
          : `Livraison prévue dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}.`,
      relatedType: "project",
      relatedId: project.id,
    });
  }

  // ── Person over capacity this week ──────────────────────────────────────
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  for (const person of people) {
    if (!person.isActive) continue;
    const weekEntries = timeEntries.filter(
      (e) => e.personId === person.id && e.date >= format(weekStart, "yyyy-MM-dd") && e.date <= format(weekEnd, "yyyy-MM-dd"),
    );
    if (capacityBand(person, weekEntries) !== "over") continue;
    const pct = capacityUtilizationPercent(person, weekEntries);
    alerts.push({
      // Keyed by week so a new alert (re)appears each time capacity is exceeded,
      // and last week's alert resolves on its own once it's no longer in the seed set.
      key: `person_capacity_exceeded:${person.id}:${format(weekStart, "yyyy-MM-dd")}`,
      type: "person_capacity_exceeded",
      severity: "warning",
      title: `Capacité dépassée — ${person.name}`,
      body: `${pct}% de la capacité hebdomadaire consommé (${person.weeklyCapacityHours} h/semaine).`,
      relatedType: "person",
      relatedId: person.id,
    });
  }

  // ── Billable time sitting unbilled for too long ─────────────────────────
  for (const project of projects) {
    if (project.billingType !== "hourly") continue;
    const unbilled = timeEntries.filter(
      (e) => e.projectId === project.id && e.billable && !e.invoiceId,
    );
    if (unbilled.length === 0) continue;
    const oldestDate = unbilled.reduce((min, e) => (e.date < min ? e.date : min), unbilled[0].date);
    const daysSince = differenceInDays(new Date(), parseISO(oldestDate));
    if (daysSince < unbilledStaleDays) continue;
    alerts.push({
      key: `unbilled_time_stale:${project.id}`,
      type: "unbilled_time_stale",
      severity: daysSince >= unbilledStaleDays * 2 ? "danger" : "warning",
      title: `Temps facturable non facturé — ${project.name}`,
      body: `${hoursLogged(unbilled).toFixed(1)} h non facturées depuis ${daysSince} jours.`,
      relatedType: "project",
      relatedId: project.id,
    });
  }

  return alerts;
}
