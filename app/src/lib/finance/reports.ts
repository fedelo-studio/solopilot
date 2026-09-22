import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  Client,
  Expense,
  ExpenseCategory,
  Invoice,
  Person,
  Project,
  Task,
  TimeEntry,
} from "@/types/domain";
import { liveStatus } from "./invoices";
import { hoursLogged, taskEstimateVsActual, timeCost } from "./projects";

export interface MonthlyRevenuePoint {
  month: string; // ISO yyyy-MM-01
  label: string; // "Mars 26"
  paid: number;
  outstanding: number;
}

/** Revenue per month, separating paid invoices from sent/overdue ones. */
export function monthlyRevenue(invoices: Invoice[], monthsBack = 12): MonthlyRevenuePoint[] {
  const buckets = new Map<string, MonthlyRevenuePoint>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(new Date(), i));
    const key = format(monthDate, "yyyy-MM-01");
    buckets.set(key, {
      month: key,
      label: format(monthDate, "MMM yy", { locale: fr }),
      paid: 0,
      outstanding: 0,
    });
  }
  for (const invoice of invoices) {
    const status = liveStatus(invoice);
    if (status === "cancelled" || status === "draft") continue;
    const key = format(startOfMonth(parseISO(invoice.issuedAt)), "yyyy-MM-01");
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (status === "paid") bucket.paid += invoice.total;
    else bucket.outstanding += invoice.total;
  }
  return [...buckets.values()];
}

export interface TopClientRow {
  client: Client;
  invoiceCount: number;
  paid: number;
  outstanding: number;
}

/** Top N clients by paid revenue. Excludes drafts and cancelled. */
export function topClients(
  clients: Client[],
  invoices: Invoice[],
  limit = 5,
): TopClientRow[] {
  const rows = clients.map((client) => {
    const clientInvoices = invoices.filter((i) => i.clientId === client.id);
    const usable = clientInvoices.filter((i) => i.status !== "cancelled" && i.status !== "draft");
    const paid = usable.filter((i) => liveStatus(i) === "paid").reduce((acc, i) => acc + i.total, 0);
    const outstanding = usable.filter((i) => liveStatus(i) !== "paid").reduce((acc, i) => acc + i.total, 0);
    return { client, invoiceCount: usable.length, paid, outstanding };
  });
  return rows
    .filter((r) => r.paid > 0 || r.outstanding > 0)
    .sort((a, b) => b.paid - a.paid || b.outstanding - a.outstanding)
    .slice(0, limit);
}

export interface CategoryBreakdownSlice {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percent: number;
}

/** Expenses grouped by category, over the last `monthsBack` months. */
export function expensesByCategory(
  expenses: Expense[],
  categories: ExpenseCategory[],
  monthsBack = 12,
): CategoryBreakdownSlice[] {
  const since = startOfMonth(subMonths(new Date(), monthsBack - 1));
  const filtered = expenses.filter((e) => parseISO(e.date) >= since);
  const total = filtered.reduce((acc, e) => acc + e.amount, 0);
  if (total === 0) return [];

  const byCat = new Map<string, number>();
  for (const e of filtered) {
    const key = e.categoryId ?? "uncategorized";
    byCat.set(key, (byCat.get(key) ?? 0) + e.amount);
  }

  const slices: CategoryBreakdownSlice[] = [];
  for (const [catId, amount] of byCat) {
    const cat = categories.find((c) => c.id === catId);
    slices.push({
      categoryId: catId,
      name: cat?.name ?? "À classer",
      color: cat?.color ?? "#9ca3af",
      amount,
      percent: (amount / total) * 100,
    });
  }
  return slices.sort((a, b) => b.amount - a.amount);
}

export interface ProjectMarginRow {
  project: Project;
  client?: Client;
  cost: number;
  margin: number;
  marginPercent: number;
  /** Hours tracked against the project — informational, not folded into `cost`/`margin`
   *  (those stay budget-vs-expenses; tracked-time cost is a separate actuals view). */
  hoursLogged: number;
  timeCost: number;
}

/** Project profitability: sold − (internal budget + linked expenses).
 *  `timeEntries`/`people` feed the informational hours/time-cost columns only —
 *  they do not change `cost`/`margin`, see the comment on `ProjectMarginRow`. */
export function projectMargins(
  projects: Project[],
  clients: Client[],
  expenses: Expense[],
  timeEntries: TimeEntry[],
  people: Person[],
): ProjectMarginRow[] {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  return projects
    .map((p) => {
      const linkedExpenses = expenses
        .filter((e) => e.link.type === "project" && e.link.id === p.id)
        .reduce((acc, e) => acc + e.amount, 0);
      const cost = p.internalBudget + linkedExpenses;
      const margin = p.soldBudget - cost;
      const marginPercent = p.soldBudget > 0 ? Math.round((margin / p.soldBudget) * 100) : 0;
      const projectEntries = timeEntries.filter((e) => e.projectId === p.id);
      return {
        project: p,
        client: clientById.get(p.clientId),
        cost,
        margin,
        marginPercent,
        hoursLogged: hoursLogged(projectEntries),
        timeCost: timeCost(projectEntries, people),
      };
    })
    .sort((a, b) => b.margin - a.margin);
}

export interface ProjectHoursRow {
  project: Project;
  client?: Client;
  hours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercent: number;
}

/** Hours tracked per project (all-time — not windowed, matching `projectMargins`). */
export function hoursByProject(
  projects: Project[],
  clients: Client[],
  timeEntries: TimeEntry[],
): ProjectHoursRow[] {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  return projects
    .map((p) => {
      const entries = timeEntries.filter((e) => e.projectId === p.id);
      const hours = hoursLogged(entries);
      const billableHours = hoursLogged(entries.filter((e) => e.billable));
      const nonBillableHours = hours - billableHours;
      return {
        project: p,
        client: clientById.get(p.clientId),
        hours,
        billableHours,
        nonBillableHours,
        billablePercent: hours > 0 ? Math.round((billableHours / hours) * 100) : 0,
      };
    })
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

export interface PersonHoursRow {
  person: Person;
  hours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercent: number;
}

/** Hours tracked per person (all-time). Not the same as `capacityBand`, which
 *  compares a single week's entries against weekly capacity — this is a
 *  reporting rollup over whatever period `timeEntries` already covers. */
export function hoursByPerson(people: Person[], timeEntries: TimeEntry[]): PersonHoursRow[] {
  return people
    .map((person) => {
      const entries = timeEntries.filter((e) => e.personId === person.id);
      const hours = hoursLogged(entries);
      const billableHours = hoursLogged(entries.filter((e) => e.billable));
      const nonBillableHours = hours - billableHours;
      return {
        person,
        hours,
        billableHours,
        nonBillableHours,
        billablePercent: hours > 0 ? Math.round((billableHours / hours) * 100) : 0,
      };
    })
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

/** Overall billable-vs-non-billable split across every tracked hour. */
export function billableUtilization(timeEntries: TimeEntry[]): {
  billableHours: number;
  nonBillableHours: number;
  billablePercent: number;
} {
  const hours = hoursLogged(timeEntries);
  const billableHours = hoursLogged(timeEntries.filter((e) => e.billable));
  return {
    billableHours,
    nonBillableHours: hours - billableHours,
    billablePercent: hours > 0 ? Math.round((billableHours / hours) * 100) : 0,
  };
}

export interface TaskEstimateRow {
  project: Project;
  task: Task;
  estimatedHours: number;
  actualHours: number;
  deltaHours: number;
  deltaPercent: number | null;
}

/** Estimated-vs-actual across every task that has an estimate, sorted by the
 *  biggest overrun/underrun first. Tasks without an estimate are excluded —
 *  there's nothing to compare against. */
export function estimateVsActualRows(
  projects: Project[],
  tasks: Task[],
  timeEntries: TimeEntry[],
): TaskEstimateRow[] {
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return tasks
    .filter((t) => t.estimatedHours != null)
    .map((task) => {
      const r = taskEstimateVsActual(task, timeEntries);
      return {
        project: projectById.get(task.projectId),
        task,
        estimatedHours: r.estimatedHours as number,
        actualHours: r.actualHours,
        deltaHours: r.deltaHours as number,
        deltaPercent: r.deltaPercent,
      };
    })
    .filter((r): r is TaskEstimateRow => r.project != null)
    .sort((a, b) => Math.abs(b.deltaHours) - Math.abs(a.deltaHours));
}

/** High-level totals — paid + outstanding revenue + expenses + net for the period. */
export function periodSummary(invoices: Invoice[], expenses: Expense[], monthsBack = 12) {
  const since = startOfMonth(subMonths(new Date(), monthsBack - 1));
  const usableInvoices = invoices.filter((i) => parseISO(i.issuedAt) >= since && i.status !== "cancelled" && i.status !== "draft");
  const usableExpenses = expenses.filter((e) => parseISO(e.date) >= since);
  const paid = usableInvoices.filter((i) => liveStatus(i) === "paid").reduce((a, i) => a + i.total, 0);
  const outstanding = usableInvoices.filter((i) => liveStatus(i) !== "paid").reduce((a, i) => a + i.total, 0);
  const expensesTotal = usableExpenses.reduce((a, e) => a + e.amount, 0);
  return {
    revenuePaid: paid,
    revenueOutstanding: outstanding,
    expenses: expensesTotal,
    netPaid: paid - expensesTotal,
  };
}
