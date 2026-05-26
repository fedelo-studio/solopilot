import { describe, expect, it } from "vitest";
import type { Deal } from "@/types/domain";
import {
  DEFAULT_PROBABILITY,
  groupByStage,
  isOpen,
  totalWeighted,
  weightedValue,
} from "./deals";

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "d-test",
    userId: "u",
    title: "Test deal",
    stage: "qualified",
    estimatedAmount: 10_000,
    currency: "CHF",
    probability: 50,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("weightedValue", () => {
  it("multiplies amount by probability for open deals", () => {
    expect(weightedValue(deal({ estimatedAmount: 10_000, probability: 50 }))).toBe(5_000);
    expect(weightedValue(deal({ estimatedAmount: 4_500, probability: 20 }))).toBe(900);
  });
  it("returns full amount for won deals regardless of stored probability", () => {
    expect(weightedValue(deal({ stage: "won", estimatedAmount: 8_000, probability: 0 }))).toBe(8_000);
  });
  it("returns 0 for lost deals", () => {
    expect(weightedValue(deal({ stage: "lost", estimatedAmount: 12_000, probability: 80 }))).toBe(0);
  });
  it("handles 0% probability open deals", () => {
    expect(weightedValue(deal({ estimatedAmount: 1_000, probability: 0 }))).toBe(0);
  });
  it("handles 100% probability open deals", () => {
    expect(weightedValue(deal({ estimatedAmount: 1_000, probability: 100 }))).toBe(1_000);
  });
});

describe("totalWeighted", () => {
  it("sums weighted values across deals", () => {
    const deals = [
      deal({ id: "a", estimatedAmount: 10_000, probability: 50 }), // 5'000
      deal({ id: "b", estimatedAmount: 4_000, probability: 25 }), // 1'000
      deal({ id: "c", stage: "won", estimatedAmount: 2_000 }), // 2'000
      deal({ id: "d", stage: "lost", estimatedAmount: 8_000 }), // 0
    ];
    expect(totalWeighted(deals)).toBe(8_000);
  });
  it("returns 0 for an empty list", () => {
    expect(totalWeighted([])).toBe(0);
  });
});

describe("isOpen", () => {
  it("returns true for lead/qualified/proposal/negotiation", () => {
    for (const stage of ["lead", "qualified", "proposal", "negotiation"] as const) {
      expect(isOpen(deal({ stage }))).toBe(true);
    }
  });
  it("returns false for won and lost", () => {
    expect(isOpen(deal({ stage: "won" }))).toBe(false);
    expect(isOpen(deal({ stage: "lost" }))).toBe(false);
  });
});

describe("groupByStage", () => {
  it("groups deals into every stage, even empty ones", () => {
    const grouped = groupByStage([deal({ stage: "won" }), deal({ stage: "lead" })]);
    expect(grouped.won).toHaveLength(1);
    expect(grouped.lead).toHaveLength(1);
    expect(grouped.qualified).toEqual([]);
    expect(grouped.proposal).toEqual([]);
    expect(grouped.negotiation).toEqual([]);
    expect(grouped.lost).toEqual([]);
  });
});

describe("DEFAULT_PROBABILITY", () => {
  it("is monotonically non-decreasing along the funnel", () => {
    expect(DEFAULT_PROBABILITY.lead).toBeLessThan(DEFAULT_PROBABILITY.qualified);
    expect(DEFAULT_PROBABILITY.qualified).toBeLessThan(DEFAULT_PROBABILITY.proposal);
    expect(DEFAULT_PROBABILITY.proposal).toBeLessThan(DEFAULT_PROBABILITY.negotiation);
    expect(DEFAULT_PROBABILITY.negotiation).toBeLessThan(DEFAULT_PROBABILITY.won);
  });
  it("pins won at 100 and lost at 0", () => {
    expect(DEFAULT_PROBABILITY.won).toBe(100);
    expect(DEFAULT_PROBABILITY.lost).toBe(0);
  });
});
