/** Shared line-totals math used by invoices and devis, both server-side
 *  (action validation) and client-side (live totals while editing).
 *
 *  Keep this module dependency-free so it can run anywhere — including the
 *  browser bundle of the invoice editor — without pulling in `server-only`. */

export interface BillableLine {
  quantity: number;
  unitPrice: number;
  /** VAT as a percentage (0 → 100). The product never invents a Swiss rate —
   *  the user picks one per line, hence the explicit parameter. */
  vatRate: number;
}

export interface LineTotals {
  /** Sum of `quantity × unitPrice` across all lines, excluding VAT. */
  subtotal: number;
  /** Sum of VAT amounts (each line's `lineTotal × vatRate / 100`). */
  vatAmount: number;
  /** `subtotal + vatAmount` — what the client actually pays. */
  total: number;
}

/** Compute totals from a list of billable lines.
 *  Same shape for invoice lines, quote lines and the live editor draft. */
export function computeLineTotals(lines: readonly BillableLine[]): LineTotals {
  let subtotal = 0;
  let vatAmount = 0;
  for (const line of lines) {
    const lineTotal = line.quantity * line.unitPrice;
    subtotal += lineTotal;
    vatAmount += (lineTotal * line.vatRate) / 100;
  }
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}

/** Per-line total (qty × unit price), excluding VAT. */
export function lineTotalExclVat(line: BillableLine): number {
  return line.quantity * line.unitPrice;
}
