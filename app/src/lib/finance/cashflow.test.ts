import { describe, expect, it } from "vitest";
import { addDays, format } from "date-fns";
import type { Account, Deal, Expense, Invoice } from "@/types/domain";
import {
  applyScenario,
  buildDailySeries,
  currentCash,
  projectCashflow,
  summarizeCashflow,
} from "./cashflow";

function today(offset = 0): string {
  return format(addDays(new Date(), offset), "yyyy-MM-dd");
}

function account(initial: number): Account {
  return {
    id: "a",
    userId: "u",
    name: "Main",
    kind: "bank",
    initialBalance: initial,
    currency: "CHF",
    createdAt: new Date().toISOString(),
  };
}

describe("currentCash", () => {
  it("sums initial balances across accounts", () => {
    expect(currentCash([account(1_000), account(500)])).toBe(1_500);
  });
  it("returns 0 with no accounts", () => {
    expect(currentCash([])).toBe(0);
  });
});

describe("projectCashflow", () => {
  it("includes open invoices on their due date", () => {
    const invoices: Invoice[] = [
      {
        id: "i1",
        userId: "u",
        clientId: "c1",
        number: "2026-0001",
        status: "sent",
        issuedAt: today(-5),
        dueDate: today(10),
        currency: "CHF",
        subtotal: 1_000,
        vatAmount: 81,
        total: 1_081,
        amountPaid: 0,
        lines: [],
        createdAt: new Date().toISOString(),
      },
    ];
    const entries = projectCashflow({ invoices, deals: [], expenses: [] });
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("invoice");
    expect(entries[0].confidence).toBe("confirmed");
    expect(entries[0].inflow).toBe(1_081);
  });

  it("excludes paid invoices", () => {
    const invoices: Invoice[] = [
      {
        id: "i1",
        userId: "u",
        clientId: "c1",
        number: "2026-0001",
        status: "paid",
        issuedAt: today(-30),
        dueDate: today(-1),
        currency: "CHF",
        subtotal: 1_000,
        vatAmount: 0,
        total: 1_000,
        amountPaid: 1_000,
        lines: [],
        createdAt: new Date().toISOString(),
      },
    ];
    const entries = projectCashflow({ invoices, deals: [], expenses: [] });
    expect(entries).toHaveLength(0);
  });

  it("weights deals by probability", () => {
    const deals: Deal[] = [
      {
        id: "d1",
        userId: "u",
        title: "Deal 1",
        stage: "qualified",
        estimatedAmount: 10_000,
        currency: "CHF",
        probability: 40,
        expectedPaymentDate: today(30),
        createdAt: new Date().toISOString(),
      },
    ];
    const entries = projectCashflow({ invoices: [], deals, expenses: [] });
    expect(entries).toHaveLength(1);
    expect(entries[0].inflow).toBe(4_000);
    expect(entries[0].confidence).toBe("hypothetical"); // below 60%
  });

  it("classifies deals above 60% probability as probable", () => {
    const deals: Deal[] = [
      {
        id: "d1",
        userId: "u",
        title: "Deal 1",
        stage: "negotiation",
        estimatedAmount: 10_000,
        currency: "CHF",
        probability: 75,
        expectedPaymentDate: today(20),
        createdAt: new Date().toISOString(),
      },
    ];
    const entries = projectCashflow({ invoices: [], deals, expenses: [] });
    expect(entries[0].confidence).toBe("probable");
  });

  it("includes future expenses as outflows", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        userId: "u",
        date: today(15),
        vendor: "Vendor",
        amount: 500,
        currency: "CHF",
        link: { type: "none" },
        billable: false,
        createdAt: new Date().toISOString(),
      },
    ];
    const entries = projectCashflow({ invoices: [], deals: [], expenses });
    expect(entries[0].outflow).toBe(500);
    expect(entries[0].net).toBe(-500);
  });

  it("ignores expenses dated in the past", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        userId: "u",
        date: today(-5),
        vendor: "Vendor",
        amount: 500,
        currency: "CHF",
        link: { type: "none" },
        billable: false,
        createdAt: new Date().toISOString(),
      },
    ];
    const entries = projectCashflow({ invoices: [], deals: [], expenses });
    expect(entries).toHaveLength(0);
  });
});

describe("buildDailySeries", () => {
  it("starts at startingCash on day 0", () => {
    const series = buildDailySeries([], 10_000, 30);
    expect(series).toHaveLength(31);
    expect(series[0].confirmed).toBe(10_000);
    expect(series[0].probable).toBe(10_000);
    expect(series[0].all).toBe(10_000);
  });

  it("accumulates entries into the correct tier and into looser tiers too", () => {
    const series = buildDailySeries(
      [
        {
          date: today(0),
          inflow: 1_000,
          outflow: 0,
          net: 1_000,
          confidence: "confirmed",
          label: "X",
          source: "invoice",
        },
        {
          date: today(0),
          inflow: 500,
          outflow: 0,
          net: 500,
          confidence: "probable",
          label: "Y",
          source: "deal",
        },
        {
          date: today(0),
          inflow: 300,
          outflow: 0,
          net: 300,
          confidence: "hypothetical",
          label: "Z",
          source: "deal",
        },
      ],
      0,
      5,
    );
    expect(series[0].confirmed).toBe(1_000);
    expect(series[0].probable).toBe(1_500);
    expect(series[0].all).toBe(1_800);
  });
});

describe("summarizeCashflow", () => {
  it("breaks net out by tier", () => {
    const summary = summarizeCashflow(
      [
        { date: today(1), inflow: 100, outflow: 0, net: 100, confidence: "confirmed", label: "", source: "invoice" },
        { date: today(2), inflow: 0, outflow: 50, net: -50, confidence: "confirmed", label: "", source: "expense" },
        { date: today(3), inflow: 200, outflow: 0, net: 200, confidence: "probable", label: "", source: "deal" },
      ],
      1_000,
    );
    expect(summary.startingCash).toBe(1_000);
    expect(summary.byTier.confirmed.net).toBe(50);
    expect(summary.byTier.probable.net).toBe(200);
    expect(summary.byTier.hypothetical.net).toBe(0);
    expect(summary.projectedNet).toBe(250);
    expect(summary.projectedCash).toBe(1_250);
  });
});

describe("applyScenario", () => {
  const entries = [
    { date: today(1), inflow: 1_000, outflow: 0, net: 1_000, confidence: "confirmed" as const, label: "Facture A", source: "invoice" as const },
    { date: today(2), inflow: 300, outflow: 0, net: 300, confidence: "hypothetical" as const, label: "Deal — Bravo", source: "deal" as const },
    { date: today(3), inflow: 500, outflow: 0, net: 500, confidence: "probable" as const, label: "Deal — Charlie", source: "deal" as const },
  ];
  const deals: Deal[] = [
    { id: "b", userId: "u", title: "Bravo", stage: "qualified", estimatedAmount: 1_500, currency: "CHF", probability: 20, createdAt: "" },
    { id: "c", userId: "u", title: "Charlie", stage: "negotiation", estimatedAmount: 2_000, currency: "CHF", probability: 75, createdAt: "" },
  ];

  it("realistic returns the input unchanged", () => {
    expect(applyScenario(entries, "realistic", deals)).toEqual(entries);
  });

  it("pessimistic drops anything that isn't confirmed", () => {
    const result = applyScenario(entries, "pessimistic", deals);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Facture A");
  });

  it("optimistic inflates deals to full estimated amount", () => {
    const result = applyScenario(entries, "optimistic", deals);
    const bravo = result.find((e) => e.label === "Deal — Bravo");
    const charlie = result.find((e) => e.label === "Deal — Charlie");
    expect(bravo?.inflow).toBe(1_500);
    expect(charlie?.inflow).toBe(2_000);
    // Invoice entry untouched.
    expect(result.find((e) => e.label === "Facture A")?.inflow).toBe(1_000);
  });
});
