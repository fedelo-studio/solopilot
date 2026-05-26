import { describe, expect, it } from "vitest";
import { addDays, subDays } from "date-fns";
import type { Invoice } from "@/types/domain";
import { balanceDue, isOpen, liveStatus, sumInvoices, totalOwed } from "./invoices";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "i-test",
    userId: "u",
    clientId: "c",
    number: "2026-0001",
    status: "sent",
    issuedAt: new Date().toISOString(),
    dueDate: addDays(new Date(), 10).toISOString(),
    currency: "CHF",
    subtotal: 1_000,
    vatAmount: 81,
    total: 1_081,
    amountPaid: 0,
    lines: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("balanceDue", () => {
  it("returns total when nothing is paid", () => {
    expect(balanceDue(invoice({ total: 1_000, amountPaid: 0 }))).toBe(1_000);
  });
  it("subtracts the amount paid", () => {
    expect(balanceDue(invoice({ total: 1_000, amountPaid: 300 }))).toBe(700);
  });
  it("never goes negative — overpayments clamp to 0", () => {
    expect(balanceDue(invoice({ total: 500, amountPaid: 600 }))).toBe(0);
  });
});

describe("liveStatus", () => {
  it("preserves draft", () => {
    expect(liveStatus(invoice({ status: "draft" }))).toBe("draft");
  });
  it("preserves cancelled", () => {
    expect(liveStatus(invoice({ status: "cancelled" }))).toBe("cancelled");
  });
  it("returns paid when amountPaid covers the total", () => {
    expect(liveStatus(invoice({ status: "sent", total: 1_000, amountPaid: 1_000 }))).toBe("paid");
  });
  it("returns overdue when due date is past and balance remains", () => {
    expect(
      liveStatus(
        invoice({
          status: "sent",
          dueDate: subDays(new Date(), 5).toISOString(),
          amountPaid: 0,
        }),
      ),
    ).toBe("overdue");
  });
  it("returns sent when due in the future and not paid", () => {
    expect(liveStatus(invoice({ status: "sent" }))).toBe("sent");
  });
});

describe("isOpen", () => {
  it("returns true for sent invoices", () => {
    expect(isOpen(invoice({ status: "sent" }))).toBe(true);
  });
  it("returns true for overdue invoices", () => {
    expect(
      isOpen(
        invoice({ status: "sent", dueDate: subDays(new Date(), 5).toISOString() }),
      ),
    ).toBe(true);
  });
  it("returns false for paid invoices", () => {
    expect(isOpen(invoice({ status: "paid", total: 100, amountPaid: 100 }))).toBe(false);
  });
  it("returns false for drafts", () => {
    expect(isOpen(invoice({ status: "draft" }))).toBe(false);
  });
});

describe("sumInvoices", () => {
  it("sums totals", () => {
    expect(
      sumInvoices([
        invoice({ id: "a", total: 100 }),
        invoice({ id: "b", total: 250 }),
        invoice({ id: "c", total: 50 }),
      ]),
    ).toBe(400);
  });
  it("applies the filter when provided", () => {
    const list = [
      invoice({ id: "a", status: "paid", total: 1_000 }),
      invoice({ id: "b", status: "sent", total: 500 }),
    ];
    expect(sumInvoices(list, (i) => i.status === "paid")).toBe(1_000);
  });
});

describe("totalOwed", () => {
  it("sums balance due across open invoices only", () => {
    const list = [
      invoice({ id: "a", status: "sent", total: 1_000, amountPaid: 0 }),
      invoice({ id: "b", status: "sent", total: 500, amountPaid: 200 }),
      invoice({ id: "c", status: "paid", total: 300, amountPaid: 300 }),
      invoice({ id: "d", status: "draft", total: 100, amountPaid: 0 }),
    ];
    expect(totalOwed(list)).toBe(1_300); // 1000 + 300
  });
});
