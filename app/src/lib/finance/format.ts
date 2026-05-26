import {
  addDays,
  differenceInDays,
  format,
  formatDistanceToNowStrict,
  isAfter,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Currency } from "@/types/domain";

/** Format an amount as a CHF-style monetary string.
 *
 *  We use the Swiss German locale because it formats CHF with the apostrophe
 *  thousands separator (1'250.50), which is the convention freelancers in
 *  Switzerland recognise — even when the rest of the UI is in French.
 */
export function formatMoney(
  amount: number,
  currency: Currency = "CHF",
  options: { showSymbol?: boolean; compact?: boolean } = {},
): string {
  const { showSymbol = true, compact = false } = options;

  const formatter = new Intl.NumberFormat("de-CH", {
    style: showSymbol ? "currency" : "decimal",
    currency,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact && Math.abs(amount) >= 10_000 ? "compact" : "standard",
  });

  return formatter.format(amount);
}

/** Strip the currency code and return just the number for sub-headings. */
export function formatAmount(amount: number, options?: { compact?: boolean }): string {
  return formatMoney(amount, "CHF", { ...options, showSymbol: false });
}

/** "12 mars 2026" — long date in French. */
export function formatDate(input: string | Date, pattern = "d MMM yyyy"): string {
  const date = typeof input === "string" ? parseISO(input) : input;
  return format(date, pattern, { locale: fr });
}

/** "il y a 3 jours" / "dans 5 jours" — used in alerts and pipeline cards. */
export function formatRelativeDate(input: string | Date): string {
  const date = typeof input === "string" ? parseISO(input) : input;
  const distance = formatDistanceToNowStrict(date, { locale: fr });
  return isAfter(date, new Date()) ? `dans ${distance}` : `il y a ${distance}`;
}

/** Days until a target date — negative if it's already past. */
export function daysUntil(input: string | Date): number {
  const date = typeof input === "string" ? parseISO(input) : input;
  return differenceInDays(date, new Date());
}

/** Build a "from today + N days" ISO date — used for cashflow projections. */
export function isoInDays(days: number): string {
  return addDays(new Date(), days).toISOString();
}

/** Format a percentage from a 0–100 number. */
export function formatPercent(value: number, digits = 0): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}
