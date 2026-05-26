import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";

/** Strategy for finding the next available sequential number when generating
 *  invoice and quote numbers. The numeric portion is found by splitting on
 *  `-` and reading a specific zero-indexed slot.
 *
 *  Examples:
 *  - Invoices (`YYYY-NNNN`) → prefix `${year}-`, numericIndex 1
 *  - Quotes  (`DEV-YYYY-NNNN`) → prefix `DEV-${year}-`, numericIndex 2
 */
export interface SequenceSpec {
  /** Table to scan, must have a `number` text column. */
  table: "invoices" | "quotes";
  /** String prefix used both to filter and to construct the result. */
  prefix: string;
  /** Slot inside the dash-split number where the counter lives. */
  numericIndex: number;
  /** Fallback list scanned in mock mode (no DB available). */
  fallbackNumbers: string[];
  /** Width of the zero-padded counter (defaults to 4). */
  pad?: number;
}

/** Compute the next available counter for a sequence spec and format it
 *  back into the canonical `${prefix}${NNNN}` shape. Scans existing numbers,
 *  parses each, takes `max + 1`. Works for both mock mode and Supabase. */
export async function nextSequentialNumber(spec: SequenceSpec): Promise<string> {
  const pad = spec.pad ?? 4;

  if (!isLive) {
    const next = computeNext(spec.fallbackNumbers, spec.prefix, spec.numericIndex);
    return `${spec.prefix}${String(next).padStart(pad, "0")}`;
  }

  const supabase = await createServerSupabase();
  if (!supabase) return `${spec.prefix}${"".padStart(pad, "0").replace(/0$/, "1")}`; // "0001"

  const { data } = await supabase
    .from(spec.table)
    .select("number")
    .like("number", `${spec.prefix}%`);

  const numbers = (data ?? []).map((r) => (r.number as string) ?? "");
  const next = computeNext(numbers, spec.prefix, spec.numericIndex);
  return `${spec.prefix}${String(next).padStart(pad, "0")}`;
}

function computeNext(numbers: readonly string[], prefix: string, numericIndex: number): number {
  const counters = numbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.split("-")[numericIndex] ?? "0", 10))
    .filter((n) => !Number.isNaN(n));
  return (counters.length === 0 ? 0 : Math.max(...counters)) + 1;
}
