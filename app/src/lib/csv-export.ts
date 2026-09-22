/** CSV export for report tables — not to be confused with `lib/finance/csv.ts`,
 *  which parses an *imported* bank statement. This is the other direction:
 *  turning report rows into a CSV a spreadsheet can open. */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

/** Escapes a single CSV field per RFC 4180: wrap in quotes if it contains a
 *  comma, quote, or newline; double any embedded quotes. */
function escapeCsvField(raw: string | number): string {
  const value = String(raw);
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds a CSV string (RFC 4180, \r\n line endings) from rows + column defs. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(c.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}

/** Triggers a browser download of a CSV string. Client-side only — a UTF-8
 *  BOM is prepended so Excel renders accented French characters correctly. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
