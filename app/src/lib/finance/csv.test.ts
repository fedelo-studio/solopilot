import { describe, expect, it } from "vitest";
import { parseCsv, rowsToTransactions } from "./csv";

describe("parseCsv", () => {
  it("parses a simple comma-separated file", () => {
    const out = parseCsv("Date,Label,Amount\n2026-03-12,Loyer,1200\n");
    expect(out).toEqual([{ date: "2026-03-12", label: "Loyer", amount: "1200" }]);
  });
  it("handles semicolon-separated CSV (Excel FR)", () => {
    const out = parseCsv("Date;Label;Amount\n12.03.2026;Loyer;1200\n");
    expect(out[0]).toMatchObject({ date: "12.03.2026", label: "Loyer", amount: "1200" });
  });
  it("handles quoted fields with embedded commas", () => {
    const out = parseCsv(`Date,Label,Amount\n2026-03-12,"Pereira, Lina",2400\n`);
    expect(out[0].label).toBe("Pereira, Lina");
  });
  it("handles escaped quotes inside quoted fields", () => {
    const out = parseCsv(`Date,Label,Amount\n2026-03-12,"Achat ""Pro""",100\n`);
    expect(out[0].label).toBe('Achat "Pro"');
  });
  it("ignores BOM at the start", () => {
    const out = parseCsv("﻿Date,Label,Amount\n2026-03-12,Test,10\n");
    expect(out[0].date).toBe("2026-03-12");
  });
});

describe("rowsToTransactions", () => {
  it("infers kind from sign when there's a single Amount column", () => {
    const txs = rowsToTransactions([
      { date: "12.03.2026", label: "Loyer", amount: "-1200" },
      { date: "13.03.2026", label: "Paiement client", amount: "5000" },
    ]);
    expect(txs).toHaveLength(2);
    expect(txs[0]).toEqual({ date: "2026-03-12", label: "Loyer", amount: 1200, kind: "out" });
    expect(txs[1]).toEqual({ date: "2026-03-13", label: "Paiement client", amount: 5000, kind: "in" });
  });

  it("uses debit/credit columns when present", () => {
    const txs = rowsToTransactions([
      { date: "12.03.2026", label: "Loyer", débit: "1200", crédit: "" },
      { date: "13.03.2026", label: "Paiement client", débit: "", crédit: "5000" },
    ]);
    expect(txs[0].kind).toBe("out");
    expect(txs[0].amount).toBe(1200);
    expect(txs[1].kind).toBe("in");
    expect(txs[1].amount).toBe(5000);
  });

  it("parses Swiss apostrophe thousands separator", () => {
    const txs = rowsToTransactions([{ date: "12.03.2026", label: "Test", amount: "12'500.50" }]);
    expect(txs[0].amount).toBe(12_500.5);
  });

  it("parses EU comma decimal separator", () => {
    const txs = rowsToTransactions([{ date: "12.03.2026", label: "Test", amount: "1250,75" }]);
    expect(txs[0].amount).toBe(1250.75);
  });

  it("skips rows with no parseable date", () => {
    const txs = rowsToTransactions([{ date: "", label: "X", amount: "100" }]);
    expect(txs).toHaveLength(0);
  });

  it("skips rows with no parseable amount", () => {
    const txs = rowsToTransactions([{ date: "2026-03-12", label: "X", amount: "" }]);
    expect(txs).toHaveLength(0);
  });
});
