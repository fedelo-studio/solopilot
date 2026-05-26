/** Tiny CSV parser — handles quoted fields, escaped quotes, and \r\n / \n line endings.
 *  Returns rows as `Record<string, string>` keyed by the (lowercased, trimmed) header. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = tokenize(text.replace(/﻿/, "")); // strip BOM
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = (row[i] ?? "").trim();
    return obj;
  });
}

function tokenize(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === ";") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // ignore — handled by \n
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.length > 0));
}

export interface ParsedTransaction {
  date: string; // ISO yyyy-MM-dd
  label: string;
  amount: number;
  kind: "in" | "out";
}

/** Parse a Swiss-style bank CSV. Expected headers (case-insensitive, accents stripped):
 *
 *    date, libellé/label/description, montant/amount/débit/crédit
 *
 *  Heuristic: if a single "amount" column exists, sign of the number determines kind.
 *  If separate "débit" / "crédit" columns exist, kind is inferred from which is filled.
 */
export function rowsToTransactions(rows: Record<string, string>[]): ParsedTransaction[] {
  const result: ParsedTransaction[] = [];
  for (const row of rows) {
    const date = normaliseDate(pick(row, ["date", "valeur", "date_valeur"]));
    if (!date) continue;
    const label = pick(row, ["label", "libellé", "libelle", "description", "intitulé", "intitule"]);
    if (!label) continue;

    let amount: number | null = null;
    let kind: "in" | "out" | null = null;

    const debit = parseAmount(pick(row, ["débit", "debit"]));
    const credit = parseAmount(pick(row, ["crédit", "credit"]));
    if (debit !== null && debit > 0) {
      amount = debit;
      kind = "out";
    } else if (credit !== null && credit > 0) {
      amount = credit;
      kind = "in";
    } else {
      const flat = parseAmount(pick(row, ["amount", "montant", "valeur"]));
      if (flat !== null) {
        amount = Math.abs(flat);
        kind = flat < 0 ? "out" : "in";
      }
    }
    if (amount === null || kind === null) continue;
    result.push({ date, label, amount, kind });
  }
  return result;
}

function pick(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    if (row[c]) return row[c];
  }
  return "";
}

/** Accepts "12.03.2026", "2026-03-12", "12/03/2026". Returns ISO yyyy-MM-dd or empty. */
function normaliseDate(value: string): string {
  if (!value) return "";
  const v = value.trim();
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  // dd.mm.yyyy or dd/mm/yyyy
  const m = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) {
    const [, d, mm, y] = m;
    return `${y}-${mm.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

/** Parses "1'250.50", "1,250.50", "-12.30", "1250", returns number or null. */
function parseAmount(value: string): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/['\s ]/g, "") // CH thousands sep + spaces + non-breaking spaces
    .replace(/,(\d{1,2})$/, ".$1") // EU decimal comma → dot
    .replace(/,(\d{3})/g, "$1"); // remove US thousands commas
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
