import { describe, expect, it } from "vitest";
import { format, startOfMonth, subMonths } from "date-fns";
import type { Budget, Expense } from "@/types/domain";
import { budgetUsage } from "./budget";

const thisMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
const lastMonth = format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "b",
    userId: "u",
    periodMonth: thisMonth,
    categoryId: "cat-1",
    plannedAmount: 1_000,
    currency: "CHF",
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e",
    userId: "u",
    date: thisMonth,
    vendor: "Vendor",
    amount: 0,
    currency: "CHF",
    categoryId: "cat-1",
    link: { type: "none" },
    billable: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("budgetUsage", () => {
  it("returns 0% usage when no expenses", () => {
    const u = budgetUsage(budget(), []);
    expect(u.spent).toBe(0);
    expect(u.usagePercent).toBe(0);
    expect(u.status).toBe("ok");
    expect(u.remaining).toBe(1_000);
  });

  it("only counts expenses in the same month and same category", () => {
    const u = budgetUsage(budget(), [
      expense({ id: "1", amount: 200 }),
      expense({ id: "2", amount: 100, categoryId: "cat-2" }), // wrong cat
      expense({ id: "3", amount: 300, date: lastMonth }), // wrong month
    ]);
    expect(u.spent).toBe(200);
    expect(u.usagePercent).toBe(20);
    expect(u.status).toBe("ok");
  });

  it("flips to 'watch' between 60% and 80%", () => {
    const u = budgetUsage(budget(), [expense({ amount: 700 })]);
    expect(u.usagePercent).toBe(70);
    expect(u.status).toBe("watch");
  });

  it("flips to 'near_limit' between 80% and 100%", () => {
    const u = budgetUsage(budget(), [expense({ amount: 850 })]);
    expect(u.usagePercent).toBe(85);
    expect(u.status).toBe("near_limit");
  });

  it("flips to 'exceeded' when spent >= planned", () => {
    const u = budgetUsage(budget(), [expense({ amount: 1_200 })]);
    expect(u.usagePercent).toBe(100); // clamped at 100
    expect(u.overBy).toBe(200);
    expect(u.remaining).toBe(-200);
    expect(u.status).toBe("exceeded");
  });

  it("handles planned=0 gracefully", () => {
    const u = budgetUsage(budget({ plannedAmount: 0 }), [expense({ amount: 100 })]);
    expect(u.usagePercent).toBe(100);
    expect(u.status).toBe("exceeded");
    expect(u.overBy).toBe(100);
  });
});
