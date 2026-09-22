import { describe, expect, it } from "vitest";
import { toCsv, type CsvColumn } from "./csv-export";

interface Row {
  name: string;
  amount: number;
  note: string;
}

const columns: CsvColumn<Row>[] = [
  { header: "Nom", value: (r) => r.name },
  { header: "Montant", value: (r) => r.amount },
  { header: "Note", value: (r) => r.note },
];

describe("toCsv", () => {
  it("builds a header row plus one row per item", () => {
    const csv = toCsv<Row>([{ name: "Alice", amount: 100, note: "ok" }], columns);
    expect(csv).toBe("Nom,Montant,Note\r\nAlice,100,ok");
  });

  it("returns just the header for an empty row set", () => {
    expect(toCsv<Row>([], columns)).toBe("Nom,Montant,Note");
  });

  it("quotes fields containing a comma", () => {
    const csv = toCsv<Row>([{ name: "Studio, Lumen", amount: 1, note: "" }], columns);
    expect(csv).toContain('"Studio, Lumen"');
  });

  it("doubles embedded quotes and wraps the field", () => {
    const csv = toCsv<Row>([{ name: 'Le "Best"', amount: 1, note: "" }], columns);
    expect(csv).toContain('"Le ""Best"""');
  });

  it("quotes fields containing a newline", () => {
    const csv = toCsv<Row>([{ name: "A", amount: 1, note: "line1\nline2" }], columns);
    expect(csv).toContain('"line1\nline2"');
  });

  it("leaves plain numeric and text fields unquoted", () => {
    const csv = toCsv<Row>([{ name: "Simple", amount: 42, note: "fine" }], columns);
    expect(csv).toBe("Nom,Montant,Note\r\nSimple,42,fine");
  });
});
