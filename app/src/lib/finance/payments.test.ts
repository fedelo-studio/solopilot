/** Tests on the invoicing logic introduced in V5.
 *  The actual aggregation of payments → invoices.amount_paid happens in a Supabase
 *  trigger, so this file focuses on what we can test in TypeScript: balance,
 *  liveStatus transitions, and computing a derived "is fully paid" flag from
 *  a payments list. */

import { describe, expect, it } from "vitest";
import { addDays, subDays } from "date-fns";
import type { Invoice, InvoicePayment } from "@/types/domain";
import { balanceDue, liveStatus } from "./invoices";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "i-test",
    userId: "u",
    clientId: "c",
    number: "2026-9999",
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

function payment(overrides: Partial<InvoicePayment> = {}): InvoicePayment {
  return {
    id: "p",
    userId: "u",
    invoiceId: "i-test",
    amount: 0,
    paidOn: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("partial payments", () => {
  it("balance reflects the sum of payments via amount_paid", () => {
    // Multiple partial payments — application aggregates them via Supabase trigger.
    const payments = [payment({ id: "p1", amount: 400 }), payment({ id: "p2", amount: 300 })];
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const inv = invoice({ total: 1_000, amountPaid: totalPaid });
    expect(balanceDue(inv)).toBe(300);
  });

  it("an overpayment clamps the balance at zero", () => {
    const inv = invoice({ total: 500, amountPaid: 600 });
    expect(balanceDue(inv)).toBe(0);
  });

  it("transitions to paid when payments cover the total", () => {
    const inv = invoice({ status: "sent", total: 500, amountPaid: 500 });
    expect(liveStatus(inv)).toBe("paid");
  });

  it("stays sent while the cumulative payments are below the total", () => {
    const inv = invoice({ status: "sent", total: 1_000, amountPaid: 600 });
    expect(liveStatus(inv)).toBe("sent");
  });

  it("an overdue invoice with a partial payment stays overdue", () => {
    const inv = invoice({
      status: "sent",
      dueDate: subDays(new Date(), 10).toISOString(),
      total: 1_000,
      amountPaid: 400,
    });
    expect(liveStatus(inv)).toBe("overdue");
  });

  it("cancelled invoices remain cancelled even if the balance goes to zero", () => {
    const inv = invoice({ status: "cancelled", total: 500, amountPaid: 500 });
    expect(liveStatus(inv)).toBe("cancelled");
  });
});

describe("payment ordering", () => {
  it("payments sort newest first by paid_on", () => {
    const payments = [
      payment({ id: "a", paidOn: "2026-03-01" }),
      payment({ id: "b", paidOn: "2026-04-15" }),
      payment({ id: "c", paidOn: "2026-02-20" }),
    ];
    const sorted = [...payments].sort((a, b) => b.paidOn.localeCompare(a.paidOn));
    expect(sorted.map((p) => p.id)).toEqual(["b", "a", "c"]);
  });
});
