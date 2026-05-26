import { isSameMonth, parseISO, startOfMonth } from "date-fns";
import type { Budget, Expense } from "@/types/domain";

export interface BudgetUsage {
  planned: number;
  spent: number;
  remaining: number;
  /** 0–100 — clamped at 100 even if overspent (use `overBy` to know). */
  usagePercent: number;
  /** Positive if over budget, 0 otherwise. */
  overBy: number;
  status: "ok" | "watch" | "near_limit" | "exceeded";
}

const STATUS_THRESHOLDS = {
  watch: 0.6, // 60–80%
  nearLimit: 0.8, // 80–100%
};

/** Compute usage for a single budget against a list of expenses for the same period. */
export function budgetUsage(budget: Budget, expenses: Expense[]): BudgetUsage {
  const period = startOfMonth(parseISO(budget.periodMonth));

  const spent = expenses
    .filter(
      (e) =>
        e.categoryId === budget.categoryId &&
        isSameMonth(parseISO(e.date), period),
    )
    .reduce((acc, e) => acc + e.amount, 0);

  const remaining = budget.plannedAmount - spent;
  const overBy = remaining < 0 ? -remaining : 0;
  // Edge case: a 0 plafond is "exceeded" the moment any expense lands on it,
  // and remains "ok" only as long as no spend has occurred. Treating it as
  // ratio=0 always-ok would silently hide an overspend on an empty budget.
  const ratio =
    budget.plannedAmount > 0
      ? spent / budget.plannedAmount
      : spent > 0
        ? Infinity
        : 0;
  const usagePercent = Math.min(100, Math.round(ratio === Infinity ? 100 : ratio * 100));

  let status: BudgetUsage["status"] = "ok";
  if (ratio >= 1) status = "exceeded";
  else if (ratio >= STATUS_THRESHOLDS.nearLimit) status = "near_limit";
  else if (ratio >= STATUS_THRESHOLDS.watch) status = "watch";

  return { planned: budget.plannedAmount, spent, remaining, usagePercent, overBy, status };
}
