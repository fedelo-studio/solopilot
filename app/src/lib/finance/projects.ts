import type { Person, Project, Task, TimeEntry } from "@/types/domain";
import type { BillableLine } from "./lines";

/** Sum of `durationMinutes` across entries, in decimal hours. */
export function hoursLogged(entries: TimeEntry[]): number {
  return entries.reduce((acc, e) => acc + e.durationMinutes, 0) / 60;
}

/** `null` when the project doesn't track an hour budget. */
export function hoursRemaining(project: Project, entries: TimeEntry[]): number | null {
  if (project.budgetHours == null) return null;
  return project.budgetHours - hoursLogged(entries);
}

export function budgetUtilizationPercent(project: Project, entries: TimeEntry[]): number | null {
  if (project.budgetHours == null || project.budgetHours <= 0) return null;
  return Math.round((hoursLogged(entries) / project.budgetHours) * 100);
}

/** Percentage of tasks marked "done". 0 tasks → 0, not NaN. */
export function projectProgressPercent(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

export interface TaskEstimateVsActual {
  estimatedHours: number | null;
  actualHours: number;
  /** actual − estimated. Negative = came in under estimate. Null when no estimate. */
  deltaHours: number | null;
  deltaPercent: number | null;
}

export function taskEstimateVsActual(task: Task, entries: TimeEntry[]): TaskEstimateVsActual {
  const actualHours = hoursLogged(entries.filter((e) => e.taskId === task.id));
  if (task.estimatedHours == null) {
    return { estimatedHours: null, actualHours, deltaHours: null, deltaPercent: null };
  }
  const deltaHours = actualHours - task.estimatedHours;
  const deltaPercent =
    task.estimatedHours > 0 ? Math.round((deltaHours / task.estimatedHours) * 100) : null;
  return { estimatedHours: task.estimatedHours, actualHours, deltaHours, deltaPercent };
}

export type CapacityBand = "under" | "optimal" | "near" | "over" | "no_data";

export function capacityUtilizationPercent(
  person: Person,
  weekEntries: TimeEntry[],
): number | null {
  if (person.weeklyCapacityHours <= 0) return null;
  return Math.round((hoursLogged(weekEntries) / person.weeklyCapacityHours) * 100);
}

/** <70% under · 70–90% optimal · 90–100% near · >100% over · capacity=0 → no_data. */
export function capacityBand(person: Person, weekEntries: TimeEntry[]): CapacityBand {
  const pct = capacityUtilizationPercent(person, weekEntries);
  if (pct == null) return "no_data";
  if (pct > 100) return "over";
  if (pct >= 90) return "near";
  if (pct >= 70) return "optimal";
  return "under";
}

/** Actual tracked-time cost at each person's CURRENT cost rate. Deliberately
 *  kept separate from `projectMargin` (a planned figure) rather than folded
 *  in automatically — surfacing it as its own metric avoids silently
 *  redefining what "Marge projetée" means. */
export function timeCost(entries: TimeEntry[], people: Person[]): number {
  const rateById = new Map(people.map((p) => [p.id, p.costRate]));
  return entries.reduce(
    (acc, e) => acc + (rateById.get(e.personId) ?? 0) * (e.durationMinutes / 60),
    0,
  );
}

/** Relocated, byte-identical formula from the project detail page — the one
 *  bounded context that didn't yet have a pure/tested finance module. */
export function projectMargin(
  project: Project,
  expensesTotal: number,
): { cost: number; margin: number; marginPercent: number } {
  const cost = project.internalBudget + expensesTotal;
  const margin = project.soldBudget - cost;
  const marginPercent = project.soldBudget > 0 ? Math.round((margin / project.soldBudget) * 100) : 0;
  return { cost, margin, marginPercent };
}

export type InvoiceLineGrouping = "task" | "person" | "single_line";

export interface TimeInvoiceLine extends BillableLine {
  description: string;
}

/** Groups billable time entries into invoice lines and resolves a rate per
 *  entry: `project.hourlyRate` wins, else the person's `billableRate`. If a
 *  group mixes entries whose resolved rate differs, the line's `unitPrice` is
 *  a blended `totalAmount / totalHours` — still financially correct, since
 *  `quantity × unitPrice` reproduces the exact billed amount. */
export function buildTimeEntryInvoiceLines(
  entries: TimeEntry[],
  ctx: { project: Project; people: Person[]; tasks: Task[] },
  groupBy: InvoiceLineGrouping,
  vatRate: number,
): { lines: TimeInvoiceLine[]; error?: string } {
  if (entries.length === 0) return { lines: [], error: "Aucune entrée sélectionnée." };

  const peopleById = new Map(ctx.people.map((p) => [p.id, p]));
  const tasksById = new Map(ctx.tasks.map((t) => [t.id, t]));

  const rateFor = (entry: TimeEntry): number | null => {
    if (ctx.project.hourlyRate != null) return ctx.project.hourlyRate;
    const person = peopleById.get(entry.personId);
    return person && person.billableRate > 0 ? person.billableRate : null;
  };

  for (const entry of entries) {
    if (rateFor(entry) == null) {
      const person = peopleById.get(entry.personId);
      return {
        lines: [],
        error: `Aucun tarif horaire défini pour ${person?.name ?? "cette personne"}.`,
      };
    }
  }

  const keyFor = (entry: TimeEntry): string => {
    if (groupBy === "single_line") return "all";
    if (groupBy === "person") return entry.personId;
    return entry.taskId ?? "no-task";
  };

  const labelFor = (key: string): string => {
    if (groupBy === "single_line") return "Temps facturable";
    if (groupBy === "person") return peopleById.get(key)?.name ?? "Personne";
    return key === "no-task" ? "Temps (sans tâche)" : (tasksById.get(key)?.title ?? "Tâche");
  };

  const groups = new Map<string, { minutes: number; amount: number }>();
  for (const entry of entries) {
    const key = keyFor(entry);
    const rate = rateFor(entry) as number;
    const hours = entry.durationMinutes / 60;
    const current = groups.get(key) ?? { minutes: 0, amount: 0 };
    current.minutes += entry.durationMinutes;
    current.amount += hours * rate;
    groups.set(key, current);
  }

  const lines: TimeInvoiceLine[] = Array.from(groups.entries()).map(([key, { minutes, amount }]) => {
    const quantity = Math.round((minutes / 60) * 100) / 100;
    const unitPrice = quantity > 0 ? Math.round((amount / quantity) * 100) / 100 : 0;
    return { description: labelFor(key), quantity, unitPrice, vatRate };
  });

  return { lines };
}
