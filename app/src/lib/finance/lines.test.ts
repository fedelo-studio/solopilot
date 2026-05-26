import { describe, expect, it } from "vitest";
import { computeLineTotals, lineTotalExclVat } from "./lines";

describe("computeLineTotals", () => {
  it("returns zero when there are no lines", () => {
    expect(computeLineTotals([])).toEqual({ subtotal: 0, vatAmount: 0, total: 0 });
  });

  it("sums lines and computes VAT per line", () => {
    const result = computeLineTotals([
      { quantity: 2, unitPrice: 100, vatRate: 8.1 },
      { quantity: 1, unitPrice: 250, vatRate: 0 },
    ]);
    expect(result.subtotal).toBeCloseTo(450, 4);
    expect(result.vatAmount).toBeCloseTo(16.2, 4);
    expect(result.total).toBeCloseTo(466.2, 4);
  });

  it("matches subtotal + vatAmount === total exactly", () => {
    const r = computeLineTotals([
      { quantity: 3.5, unitPrice: 120, vatRate: 8.1 },
      { quantity: 1, unitPrice: 99.99, vatRate: 8.1 },
    ]);
    expect(r.total).toBeCloseTo(r.subtotal + r.vatAmount, 10);
  });
});

describe("lineTotalExclVat", () => {
  it("multiplies quantity by unit price", () => {
    expect(lineTotalExclVat({ quantity: 4, unitPrice: 25, vatRate: 0 })).toBe(100);
    expect(lineTotalExclVat({ quantity: 0, unitPrice: 25, vatRate: 8.1 })).toBe(0);
  });
});
